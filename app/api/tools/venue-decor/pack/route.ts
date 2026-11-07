import { NextResponse } from "next/server";
import sharp from "sharp";
import { anonId, currentUser, isAdmin } from "@/lib/auth";
import { createAlbum, fundAlbum } from "@/lib/albums";
import { loadImage } from "@/lib/blob";
import { PACKS } from "@/lib/config";
import { clientIp, jsonError, rateLimit } from "@/lib/http";
import { PALETTES } from "@/lib/catalog";
import { nearestAspect, VENUE_EVENTS, venuePackStyles } from "@/lib/venueDecor";
import { isOurImageUrl } from "@/lib/validate";
import type { AlbumConfig } from "@/lib/types";

export const runtime = "nodejs";

/** Creates an unpaid Venue pack album from their venue photo; the client goes to checkout next. */
export async function POST(request: Request) {
  const ip = await clientIp();
  if (!(await rateLimit(`venue-pack:${ip}`, 20, 3600))) return jsonError("Too many requests. Try again in a few minutes.", 429);
  const b = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!b) return jsonError("Invalid request.");

  const event = VENUE_EVENTS.find((e) => e.id === b.event);
  if (!event) return jsonError("Choose an event.");
  const palette = typeof b.palette === "string" && (b.palette === "" || PALETTES.some((p) => p.id === b.palette)) ? b.palette : "";
  const photoUrl = b.photoUrl;
  if (!isOurImageUrl(photoUrl) || !photoUrl.includes("/venue/")) return jsonError("Upload a photo of your venue first.");

  const [user, anon] = await Promise.all([currentUser(), anonId(true)]);
  if (b.adminFree === true && !isAdmin(user)) return jsonError("Not allowed.", 403);

  let aspect: NonNullable<AlbumConfig["venuePack"]>["aspect"] = "4:3";
  try {
    const photo = await loadImage(photoUrl);
    const meta = await sharp(photo.data).rotate().metadata();
    aspect = nearestAspect(meta.autoOrient?.width ?? meta.width ?? 4, meta.autoOrient?.height ?? meta.height ?? 3);
  } catch {
    return jsonError("Upload your venue photo again, then try once more.");
  }

  const packId = "venue9" as const;
  const styles = venuePackStyles(event.id).map((s) => s.id);
  const config: AlbumConfig = {
    tradition: "hindu_north",
    events: [event.id],
    palettes: [palette || "red_gold"],
    venue: "mixed",
    lighting: "mixed",
    decor: { source: "preset", presetId: "floral_classic", applyToAllEvents: false },
    people: { mode: "silhouette" },
    mix: { decor: PACKS[packId].images, decor_detail: 0, couple_stage: 0, family: 0, bride: 0, groom: 0, couple: 0 },
    notes: "",
    venuePack: { photoUrl, event: event.id, palette, styles, aspect },
  };
  const album = await createAlbum({ config, packId, kind: "couple", title: `Our ${event.name.toLowerCase()}, ${styles.length} ways`, user, anon });
  if (b.adminFree === true) {
    // Admins skip checkout to test the pack: no charge, no revenue recorded.
    await fundAlbum(album, PACKS[packId].images, PACKS[packId].freeRegens);
    return NextResponse.json({ ok: true, albumId: album.id, redirect: `/album/${album.id}` });
  }
  return NextResponse.json({ ok: true, albumId: album.id });
}
