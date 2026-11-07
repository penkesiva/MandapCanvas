import { NextResponse } from "next/server";
import sharp from "sharp";
import { anonId, currentUser, isAdmin } from "@/lib/auth";
import { createAlbum, fundAlbum } from "@/lib/albums";
import { loadImage } from "@/lib/blob";
import { PACKS } from "@/lib/config";
import { clientIp, jsonError, rateLimit } from "@/lib/http";
import { ART_STYLES } from "@/lib/artStyles";
import { nearestAspect } from "@/lib/venueDecor";
import { isOurImageUrl } from "@/lib/validate";
import type { AlbumConfig } from "@/lib/types";

export const runtime = "nodejs";

/** Creates an unpaid Art pack album (every style) from their photo; the client goes to checkout next. */
export async function POST(request: Request) {
  const ip = await clientIp();
  if (!(await rateLimit(`art-pack:${ip}`, 20, 3600))) return jsonError("Too many requests. Try again in a few minutes.", 429);
  const b = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!b) return jsonError("Invalid request.");
  if (b.consent !== true) return jsonError("Please confirm the photo is of you, or that everyone in it agreed.");
  const photoUrl = b.photoUrl;
  if (!isOurImageUrl(photoUrl) || !photoUrl.includes("/faces/")) return jsonError("Upload your photo first.");
  const outfit = b.outfit === "keep" ? "keep" : "wedding";
  const glasses = b.glasses === "keep" || b.glasses === "remove" ? b.glasses : "auto";

  const [user, anon] = await Promise.all([currentUser(), anonId(true)]);
  if (b.adminFree === true && !isAdmin(user)) return jsonError("Not allowed.", 403);

  let aspect: NonNullable<AlbumConfig["artPack"]>["aspect"] = "3:4";
  try {
    const photo = await loadImage(photoUrl);
    const meta = await sharp(photo.data).rotate().metadata();
    aspect = nearestAspect(meta.autoOrient?.width ?? meta.width ?? 3, meta.autoOrient?.height ?? meta.height ?? 4);
  } catch {
    return jsonError("Upload your photo again, then try once more.");
  }

  const packId = "art10" as const;
  const styles = ART_STYLES.map((s) => s.id);
  const config: AlbumConfig = {
    tradition: "hindu_north",
    events: ["ceremony"],
    palettes: ["red_gold"],
    venue: "mixed",
    lighting: "mixed",
    decor: { source: "preset", presetId: "floral_classic", applyToAllEvents: false },
    people: { mode: "silhouette" },
    mix: { decor: 0, decor_detail: 0, couple_stage: 0, family: 0, bride: 0, groom: 0, couple: PACKS[packId].images },
    notes: "",
    artPack: { photoUrl, outfit, glasses, styles, aspect },
  };
  const album = await createAlbum({ config, packId, kind: "couple", title: "Our art portraits", user, anon });
  if (b.adminFree === true) {
    // Admins skip checkout to test the pack: no charge, no revenue recorded.
    await fundAlbum(album, PACKS[packId].images, PACKS[packId].freeRegens);
    return NextResponse.json({ ok: true, albumId: album.id, redirect: `/album/${album.id}` });
  }
  return NextResponse.json({ ok: true, albumId: album.id });
}
