import { NextResponse } from "next/server";
import { anonId, currentUser } from "@/lib/auth";
import { advanceAlbum, canEdit, GenerationPausedError, getAlbum, publicAlbum } from "@/lib/albums";
import { jsonError } from "@/lib/http";

export const runtime = "nodejs";
export const maxDuration = 120;

/** The album page calls this in a loop until every image is done. */
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const album = await getAlbum(id);
  if (!album) return jsonError("Album not found.", 404);
  const [user, anon] = await Promise.all([currentUser(), anonId(false)]);
  if (!canEdit(album, user, anon)) return jsonError("You don't have access to this album.", 403);
  try {
    const res = await advanceAlbum(id);
    return NextResponse.json({ ok: true, busy: res.busy, worked: res.worked, album: res.album ? publicAlbum(res.album) : null });
  } catch (e) {
    if (e instanceof GenerationPausedError) return jsonError(e.message, 503, "paused");
    return jsonError(e instanceof Error ? e.message : "Generation failed.", 500);
  }
}
