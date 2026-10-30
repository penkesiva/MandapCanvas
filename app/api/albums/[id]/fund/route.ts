import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { fundAlbum, getAlbum, getCredits, publicAlbum, spendCredits } from "@/lib/albums";
import { PACKS } from "@/lib/config";
import { jsonError } from "@/lib/http";

export const runtime = "nodejs";

/** Uses existing credits (Pro plans, leftover credits) to create an album without a new checkout. */
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const user = await currentUser();
  if (!user) return jsonError("Sign in first.", 401);
  const album = await getAlbum(id);
  if (!album || album.ownerUserId !== user.id) return jsonError("Album not found.", 404);
  if (album.paid) return NextResponse.json({ ok: true, album: publicAlbum(album) });

  const pack = PACKS[album.packId];
  const ok = await spendCredits(user.id, pack.images, { at: Date.now(), reason: "album_allocation", ref: album.id });
  if (!ok) {
    return jsonError(`This album needs ${pack.images} images and you have ${await getCredits(user.id)}.`, 402, "insufficient_credits");
  }
  const funded = await fundAlbum(album, pack.images, pack.freeRegens);
  return NextResponse.json({ ok: true, album: publicAlbum(funded), credits: await getCredits(user.id) });
}
