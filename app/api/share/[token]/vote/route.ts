import { NextResponse } from "next/server";
import { albumByShareToken } from "@/lib/albums";
import { kv } from "@/lib/kv";
import { clientIp, jsonError, rateLimit } from "@/lib/http";

export const runtime = "nodejs";

/** Family members heart their favorite images on a shared album. One heart per image per device/IP. */
export async function POST(request: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const album = await albumByShareToken(token);
  if (!album) return jsonError("Album not found.", 404);
  const body = (await request.json().catch(() => ({}))) as { shotId?: string; voter?: string };
  const shot = album.shots.find((s) => s.id === body.shotId && s.status === "done");
  if (!shot) return jsonError("Image not found.", 404);
  const ip = await clientIp();
  if (!(await rateLimit(`vote:${ip}`, 300, 3600))) return jsonError("Too many votes.", 429);
  const voter = (body.voter || ip).slice(0, 64);
  const fresh = await kv().set(`vote:${album.id}:${shot.id}:${voter}`, "1", { nx: true, ex: 60 * 86400 });
  const count = fresh ? await kv().hincrby(`votes:${album.id}`, shot.id, 1) : Number((await kv().hgetall(`votes:${album.id}`))[shot.id] ?? 0);
  return NextResponse.json({ ok: true, count, counted: fresh });
}
