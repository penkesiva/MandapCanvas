import "server-only";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { kv } from "./kv";

export function jsonError(error: string, status = 400, code?: string) {
  return NextResponse.json({ ok: false, error, code }, { status });
}

export async function clientIp(): Promise<string> {
  const h = await headers();
  return (h.get("x-forwarded-for")?.split(",")[0] || h.get("x-real-ip") || "local").trim();
}

/** Fixed-window rate limit. Returns true when the request is allowed. */
export async function rateLimit(bucket: string, limit: number, windowSeconds: number): Promise<boolean> {
  const window = Math.floor(Date.now() / 1000 / windowSeconds);
  const key = `rl:${bucket}:${window}`;
  const n = await kv().incrby(key, 1);
  if (n === 1) await kv().expire(key, windowSeconds + 5);
  return n <= limit;
}

export const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;
export const IMAGE_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp", "image/heic", "image/heif"]);
