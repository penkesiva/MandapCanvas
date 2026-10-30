import { NextResponse } from "next/server";
import { anonId, currentUser } from "@/lib/auth";
import { canEdit, getAlbum, publicAlbum, saveAlbum, spendCredits, getCredits } from "@/lib/albums";
import { acquireLock } from "@/lib/kv";
import { jsonError } from "@/lib/http";

export const runtime = "nodejs";

/**
 * favorite   — toggle a heart
 * regenerate — make a new version (uses a free regen, then 1 credit)
 * retry      — re-queue a failed image (free)
 */
export async function POST(request: Request, ctx: { params: Promise<{ id: string; shotId: string }> }) {
  const { id, shotId } = await ctx.params;
  const body = (await request.json().catch(() => ({}))) as { action?: string };
  const release = await acquireLock(`album:${id}`, 10);
  if (!release) return jsonError("This album is busy creating images. Try again in a few seconds.", 409, "busy");
  try {
    const album = await getAlbum(id);
    if (!album) return jsonError("Album not found.", 404);
    const [user, anon] = await Promise.all([currentUser(), anonId(false)]);
    if (!canEdit(album, user, anon)) return jsonError("You don't have access to this album.", 403);
    const shot = album.shots.find((s) => s.id === shotId);
    if (!shot) return jsonError("Image not found.", 404);

    if (body.action === "favorite") {
      shot.favorite = !shot.favorite;
    } else if (body.action === "regenerate") {
      if (shot.status !== "done") return jsonError("This image isn't finished yet.", 409);
      if (album.regensLeft > 0) {
        album.regensLeft -= 1;
      } else {
        if (!user) return jsonError("Sign in to use credits for more versions.", 401);
        const ok = await spendCredits(user.id, 1, { at: Date.now(), reason: "regen", ref: `${album.id}:${shot.id}` });
        if (!ok) return jsonError("You're out of free new versions. Add 10 images to keep going.", 402, "needs_topup");
      }
      shot.status = "pending";
      shot.attempts = 0;
      album.status = "queued";
    } else if (body.action === "retry") {
      if (shot.status !== "failed") return jsonError("Only failed images can be retried.", 409);
      shot.status = "pending";
      shot.attempts = 0;
      shot.error = undefined;
      album.status = "queued";
    } else {
      return jsonError("Unknown action.");
    }
    await saveAlbum(album);
    return NextResponse.json({
      ok: true,
      album: publicAlbum(album),
      credits: user ? await getCredits(user.id) : undefined,
    });
  } finally {
    await release();
  }
}
