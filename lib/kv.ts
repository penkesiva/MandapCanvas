import "server-only";
import { Redis } from "@upstash/redis";
import fs from "node:fs";
import path from "node:path";

/**
 * Tiny key-value layer. Uses Upstash Redis (or Vercel KV, which is Upstash) when configured,
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
    const r = redisFromEnv();
    globalForKV.__kv = r ? new RedisKV(r) : new FileKV();
  }
  return globalForKV.__kv;
}

export function usingDevKV(): boolean {
  return !redisFromEnv();
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
