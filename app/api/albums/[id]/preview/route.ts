import { NextResponse } from "next/server";
import { anonId, currentUser, isAdmin } from "@/lib/auth";
import { canEdit, GenerationPausedError, generatePreview, getAlbum, publicAlbum } from "@/lib/albums";
import { FREE_PREVIEW } from "@/lib/config";
import { clientIp, jsonError, rateLimit } from "@/lib/http";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const album = await getAlbum(id);
  if (!album) return jsonError("Album not found.", 404);
  const [user, anon] = await Promise.all([currentUser(), anonId(false)]);
  if (!canEdit(album, user, anon)) return jsonError("You don't have access to this album.", 403);

  if (album.previews.filter((p) => p.status === "done").length >= FREE_PREVIEW.imagesPerAlbum) {
    return NextResponse.json({ ok: true, album: publicAlbum(album) });
  }
  const ip = await clientIp();
  // Admins (ADMIN_EMAILS) skip the daily limit for demos and QA.
  if (!isAdmin(user) && !(await rateLimit(`preview:${ip}`, FREE_PREVIEW.perIpPerDay, 86400))) {
    return jsonError("You've used today's free previews. Choose a pack to see your full album.", 429, "preview_limit");
  }
  try {
    const updated = await generatePreview(album);
    return NextResponse.json({ ok: true, album: publicAlbum(updated) });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Preview failed.";
    return jsonError(e instanceof GenerationPausedError ? msg : `We couldn't create your preview: ${msg}`, 502, "preview_failed");
  }
}
