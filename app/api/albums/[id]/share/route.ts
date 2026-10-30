import { NextResponse } from "next/server";
import { anonId, currentUser } from "@/lib/auth";
import { canEdit, ensureShareToken, getAlbum } from "@/lib/albums";
import { SITE } from "@/lib/config";
import { jsonError } from "@/lib/http";

export const runtime = "nodejs";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const album = await getAlbum(id);
  if (!album) return jsonError("Album not found.", 404);
  const [user, anon] = await Promise.all([currentUser(), anonId(false)]);
  if (!canEdit(album, user, anon)) return jsonError("You don't have access to this album.", 403);
  if (!album.paid) return jsonError("Share links open up once the album is created.", 409);
  const token = await ensureShareToken(album);
  return NextResponse.json({ ok: true, url: `${SITE.url}/s/${token}` });
}
