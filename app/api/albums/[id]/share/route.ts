import { NextResponse } from "next/server";
import { anonId, currentUser } from "@/lib/auth";
import { canEdit, ensureShareToken, getAlbum, saveAlbum } from "@/lib/albums";
import { SITE } from "@/lib/config";
import { jsonError } from "@/lib/http";
import { newPin } from "@/lib/sharePin";

export const runtime = "nodejs";

/** Makes the share link. Body { pin: "on" | "off" | "new" } turns the 6-digit code on, off, or changes it. */
export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const album = await getAlbum(id);
  if (!album) return jsonError("Album not found.", 404);
  const [user, anon] = await Promise.all([currentUser(), anonId(false)]);
  if (!canEdit(album, user, anon)) return jsonError("You don't have access to this album.", 403);
  if (!album.paid) return jsonError("Share links open up once the album is created.", 409);
  const body = (await request.json().catch(() => ({}))) as { pin?: string };
  const token = await ensureShareToken(album);
  if (body.pin === "off" && album.sharePin) {
    album.sharePin = undefined;
    await saveAlbum(album);
  } else if ((body.pin === "on" && !album.sharePin) || body.pin === "new") {
    album.sharePin = newPin();
    await saveAlbum(album);
  }
  return NextResponse.json({ ok: true, url: `${SITE.url}/s/${token}`, pin: album.sharePin ?? null });
}
