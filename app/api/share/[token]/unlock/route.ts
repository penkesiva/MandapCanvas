import { NextResponse } from "next/server";
import { albumByShareToken } from "@/lib/albums";
import { clientIp, jsonError, rateLimit } from "@/lib/http";
import { rememberUnlock } from "@/lib/sharePin";

export const runtime = "nodejs";

/** Checks the 6-digit code for a protected share link. 8 tries per 15 minutes per network and link. */
export async function POST(request: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const album = await albumByShareToken(token);
  if (!album) return jsonError("Album not found.", 404);
  if (!album.sharePin) return NextResponse.json({ ok: true });
  const ip = await clientIp();
  if (!(await rateLimit(`unlock:${ip}:${token}`, 8, 900))) {
    return jsonError("Too many tries. Wait 15 minutes, or ask the couple for the code.", 429);
  }
  const body = (await request.json().catch(() => ({}))) as { pin?: string };
  const pin = String(body.pin ?? "").replace(/\D/g, "");
  if (pin !== album.sharePin) return jsonError("That code doesn't match. Check it and try again.", 403);
  await rememberUnlock(album, token);
  return NextResponse.json({ ok: true });
}
