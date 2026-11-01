import "server-only";
import { Redis } from "@upstash/redis";
import fs from "node:fs";
import path from "node:path";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseFromEnv } from "./supabase";

/**
 * Tiny key-value layer. Uses Supabase Postgres (supabase/schema.sql) or Upstash Redis when configured,
 * otherwise a local JSON file under .data/ so the app runs end to end with zero setup.
 */
export interface KV {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, opts?: { ex?: number; nx?: boolean }): Promise<boolean>;
  del(key: string): Promise<void>;
  incrby(key: string, by: number): Promise<number>;
  lpush(key: string, value: string): Promise<void>;
  lrange(key: string, start: number, stop: number): Promise<string[]>;
  hincrby(key: string, field: string, by: number): Promise<number>;
  hgetall(key: string): Promise<Record<string, string>>;
  expire(key: string, seconds: number): Promise<void>;
  keys(pattern: string): Promise<string[]>;
}

function redisFromEnv(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token, automaticDeserialization: false });
}

class RedisKV implements KV {
  constructor(private r: Redis) {}
  async get(key: string) {
    const v = await this.r.get<string>(key);
    return v == null ? null : String(v);
  }
  async set(key: string, value: string, opts?: { ex?: number; nx?: boolean }) {
    let res: unknown;
    if (opts?.nx && opts?.ex) res = await this.r.set(key, value, { nx: true, ex: opts.ex });
    else if (opts?.nx) res = await this.r.set(key, value, { nx: true });
    else if (opts?.ex) res = await this.r.set(key, value, { ex: opts.ex });
    else res = await this.r.set(key, value);
    return res === "OK";
  }
  async del(key: string) {
    await this.r.del(key);
  }
  async incrby(key: string, by: number) {
    return Number(await this.r.incrby(key, by));
  }
  async lpush(key: string, value: string) {
    await this.r.lpush(key, value);
  }
  async lrange(key: string, start: number, stop: number) {
    return (await this.r.lrange<string>(key, start, stop)).map(String);
  }
  async hincrby(key: string, field: string, by: number) {
    return Number(await this.r.hincrby(key, field, by));
  }
  async hgetall(key: string) {
    const v = (await this.r.hgetall<Record<string, string>>(key)) ?? {};
    return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, String(x)]));
  }
  async expire(key: string, seconds: number) {
    await this.r.expire(key, seconds);
  }
  async keys(pattern: string) {
    const out: string[] = [];
    let cursor: string | number = 0;
    do {
      const [next, batch] = (await this.r.scan(cursor, { match: pattern, count: 500 })) as [string | number, string[]];
      out.push(...batch.map(String));
      cursor = next;
    } while (String(cursor) !== "0");
    return out;
  }
}

/** Postgres-backed KV on Supabase. Atomic operations are SQL functions in supabase/schema.sql. */
class SupabaseKV implements KV {
  constructor(private sb: SupabaseClient) {}
  private async rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
    const { data, error } = await this.sb.rpc(fn, args);
    if (error) throw new Error(`${fn}: ${error.message}`);
    return data as T;
  }
  async get(key: string) {
    const v = await this.rpc<string | null>("mc_get", { p_key: key });
    return v == null ? null : String(v);
  }
  async set(key: string, value: string, opts?: { ex?: number; nx?: boolean }) {
    return !!(await this.rpc<boolean>("mc_set", { p_key: key, p_value: value, p_ex: opts?.ex ?? null, p_nx: !!opts?.nx }));
  }
  async del(key: string) {
    await this.rpc("mc_del", { p_key: key });
  }
  async incrby(key: string, by: number) {
    return Number(await this.rpc("mc_incrby", { p_key: key, p_by: by }));
  }
  async lpush(key: string, value: string) {
    const { error } = await this.sb.from("mc_list").insert({ key, value });
    if (error) throw new Error(`lpush: ${error.message}`);
  }
  async lrange(key: string, start: number, stop: number) {
    // Supabase caps a single response at 1000 rows by default; page through for -1.
    const out: string[] = [];
    const last = stop === -1 ? Infinity : stop;
    for (let from = start; from <= last; from += 1000) {
      const to = Math.min(from + 999, last);
      const { data, error } = await this.sb
        .from("mc_list")
        .select("value")
        .eq("key", key)
        .order("id", { ascending: false })
        .range(from, to === Infinity ? from + 999 : to);
      if (error) throw new Error(`lrange: ${error.message}`);
      out.push(...(data ?? []).map((r) => String(r.value)));
      if (!data || data.length < 1000) break;
    }
    return out;
  }
  async hincrby(key: string, field: string, by: number) {
    return Number(await this.rpc("mc_hincrby", { p_key: key, p_field: field, p_by: by }));
  }
  async hgetall(key: string) {
    const { data, error } = await this.sb.from("mc_hash").select("field,value").eq("key", key);
    if (error) throw new Error(`hgetall: ${error.message}`);
    return Object.fromEntries((data ?? []).map((r) => [String(r.field), String(r.value)]));
  }
  async expire(key: string, seconds: number) {
    await this.rpc("mc_expire", { p_key: key, p_seconds: seconds });
  }
  async keys(pattern: string) {
    const like = pattern.replace(/[%_]/g, "\\$&").replace(/\*/g, "%");
    const { data, error } = await this.sb.from("mc_kv").select("key").like("key", like).limit(5000);
    if (error) throw new Error(`keys: ${error.message}`);
    return (data ?? []).map((r) => String(r.key));
  }
}

type Entry = { v: unknown; exp?: number };

class FileKV implements KV {
  private file = path.join(process.cwd(), ".data", "kv.json");
  private data: Record<string, Entry> = {};
  constructor() {
    try {
      this.data = JSON.parse(fs.readFileSync(this.file, "utf8"));
    } catch {
      this.data = {};
    }
  }
  private save() {
    fs.mkdirSync(path.dirname(this.file), { recursive: true });
    fs.writeFileSync(this.file, JSON.stringify(this.data));
  }
  private live(key: string): Entry | undefined {
    const e = this.data[key];
    if (e?.exp && e.exp < Date.now()) {
      delete this.data[key];
      return undefined;
    }
    return e;
  }
  async get(key: string) {
    const e = this.live(key);
    return e == null ? null : String(e.v);
  }
  async set(key: string, value: string, opts?: { ex?: number; nx?: boolean }) {
    if (opts?.nx && this.live(key)) return false;
    this.data[key] = { v: value, exp: opts?.ex ? Date.now() + opts.ex * 1000 : undefined };
    this.save();
    return true;
  }
  async del(key: string) {
    delete this.data[key];
    this.save();
  }
  async incrby(key: string, by: number) {
    const n = Number(this.live(key)?.v ?? 0) + by;
    this.data[key] = { v: String(n), exp: this.data[key]?.exp };
    this.save();
    return n;
  }
  async lpush(key: string, value: string) {
    const list = (this.live(key)?.v as string[]) ?? [];
    this.data[key] = { v: [value, ...list] };
    this.save();
  }
  async lrange(key: string, start: number, stop: number) {
    const list = (this.live(key)?.v as string[]) ?? [];
    return list.slice(start, stop === -1 ? undefined : stop + 1);
  }
  async hincrby(key: string, field: string, by: number) {
    const h = (this.live(key)?.v as Record<string, string>) ?? {};
    h[field] = String(Number(h[field] ?? 0) + by);
    this.data[key] = { v: h };
    this.save();
    return Number(h[field]);
  }
  async hgetall(key: string) {
    return { ...((this.live(key)?.v as Record<string, string>) ?? {}) };
  }
  async expire(key: string, seconds: number) {
    if (this.data[key]) this.data[key].exp = Date.now() + seconds * 1000;
    this.save();
  }
  async keys(pattern: string) {
    const re = new RegExp("^" + pattern.split("*").map((s) => s.replace(/[.+?^${}()|[\]\\]/g, "\\$&")).join(".*") + "$");
    return Object.keys(this.data).filter((k) => re.test(k) && this.live(k));
  }
}

const globalForKV = globalThis as unknown as { __kv?: KV };

export function kv(): KV {
  if (!globalForKV.__kv) {
    const sb = supabaseFromEnv();
    const r = sb ? null : redisFromEnv();
    globalForKV.__kv = sb ? new SupabaseKV(sb) : r ? new RedisKV(r) : new FileKV();
  }
  return globalForKV.__kv;
}

export function usingDevKV(): boolean {
  return !supabaseFromEnv() && !redisFromEnv();
}

export function kvBackend(): string {
  return supabaseFromEnv() ? "Supabase Postgres" : redisFromEnv() ? "Upstash Redis" : "Local file (set SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY)";
}

export async function getJSON<T>(key: string): Promise<T | null> {
  const raw = await kv().get(key);
  if (raw == null) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function setJSON(key: string, value: unknown, opts?: { ex?: number }): Promise<void> {
  await kv().set(key, JSON.stringify(value), opts);
}

/** Simple distributed lock. Returns a release function, or null if already held. */
export async function acquireLock(key: string, seconds: number): Promise<(() => Promise<void>) | null> {
  const ok = await kv().set(`lock:${key}`, String(Date.now()), { nx: true, ex: seconds });
  if (!ok) return null;
  return async () => {
    await kv().del(`lock:${key}`);
  };
}
