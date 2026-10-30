import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { getJSON, setJSON, kv } from "./kv";
import type { User } from "./types";

const SESSION_COOKIE = "mc_session";
const ANON_COOKIE = "mc_anon";
const SESSION_DAYS = 60;

function secret(): string {
  const s = process.env.AUTH_SECRET;
  if (s && s.length >= 16) return s;
  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET must be set (16+ chars) in production.");
  }
  return "dev-only-secret-do-not-use-in-production";
}

function b64url(buf: Buffer | string): string {
  return Buffer.from(buf).toString("base64url");
}

export function sign(payload: Record<string, unknown>): string {
  const body = b64url(JSON.stringify(payload));
  const sig = b64url(createHmac("sha256", secret()).update(body).digest());
  return `${body}.${sig}`;
}

export function verify<T extends { exp: number }>(token: string | undefined | null): T | null {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = createHmac("sha256", secret()).update(body).digest();
  const given = Buffer.from(sig, "base64url");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try {
    const data = JSON.parse(Buffer.from(body, "base64url").toString()) as T;
    if (typeof data.exp !== "number" || data.exp < Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) && email.length <= 254;
}

export async function getUserById(id: string): Promise<User | null> {
  return getJSON<User>(`user:${id}`);
}

export async function saveUser(user: User): Promise<void> {
  await setJSON(`user:${user.id}`, user);
}

export async function findOrCreateUser(rawEmail: string): Promise<User> {
  const email = normalizeEmail(rawEmail);
  const existingId = await kv().get(`user:email:${email}`);
  if (existingId) {
    const u = await getUserById(existingId);
    if (u) return u;
  }
  const user: User = {
    id: crypto.randomUUID(),
    email,
    createdAt: Date.now(),
    plan: null,
  };
  const claimed = await kv().set(`user:email:${email}`, user.id, { nx: true });
  if (!claimed) {
    // Another request created the user first.
    const id = await kv().get(`user:email:${email}`);
    const u = id ? await getUserById(id) : null;
    if (u) return u;
  }
  await saveUser(user);
  await kv().lpush("users:all", user.id);
  return user;
}

export function loginLinkToken(email: string, next: string): string {
  return sign({ purpose: "login", email: normalizeEmail(email), next, exp: Date.now() + 30 * 60 * 1000 });
}

export async function startSession(userId: string): Promise<void> {
  const token = sign({ uid: userId, exp: Date.now() + SESSION_DAYS * 86400 * 1000 });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 86400,
  });
}

export async function endSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export async function currentUser(): Promise<User | null> {
  const jar = await cookies();
  const data = verify<{ uid: string; exp: number }>(jar.get(SESSION_COOKIE)?.value);
  if (!data) return null;
  return getUserById(data.uid);
}

/** Stable anonymous id for visitors who haven't signed in, so drafts survive reloads. */
export async function anonId(create = true): Promise<string | null> {
  const jar = await cookies();
  const existing = verify<{ aid: string; exp: number }>(jar.get(ANON_COOKIE)?.value);
  if (existing) return existing.aid;
  if (!create) return null;
  const aid = crypto.randomUUID();
  jar.set(ANON_COOKIE, sign({ aid, exp: Date.now() + 365 * 86400 * 1000 }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 365 * 86400,
  });
  return aid;
}

export function isAdmin(user: User | null): boolean {
  if (!user) return false;
  const admins = (process.env.ADMIN_EMAILS || "").split(",").map((s) => normalizeEmail(s)).filter(Boolean);
  return admins.includes(user.email);
}
