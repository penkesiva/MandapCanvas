import { NextResponse } from "next/server";
import { anonId, currentUser, isAdmin } from "@/lib/auth";
import { createAlbum, fundAlbum } from "@/lib/albums";
import { parseGlasses } from "@/lib/bridalLooks";
import { PACKS, type PackId } from "@/lib/config";
import { getCollection } from "@/lib/lookCollections";
import { clientIp, jsonError, rateLimit } from "@/lib/http";
import { isOurImageUrl } from "@/lib/validate";
import type { AlbumConfig } from "@/lib/types";

export const runtime = "nodejs";

/** Creates an unpaid Maharani or Navratri album from her photos; the client goes to checkout next. */
export async function POST(request: Request) {
  const ip = await clientIp();
  if (!(await rateLimit(`looks-collection:${ip}`, 20, 3600))) return jsonError("Too many requests. Try again in a few minutes.", 429);
  const b = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!b) return jsonError("Invalid request.");

  const collection = getCollection(b.collection);
  if (!collection) return jsonError("Unknown collection.");
  const packId = collection.packs.includes(b.packId as PackId) ? (b.packId as PackId) : null;
  if (!packId) return jsonError("Choose a pack.");
  const photos = Array.isArray(b.photos) ? b.photos : [];
  if (!photos.length) return jsonError("Add at least one photo of yourself.");
  if (photos.length > 5 || !photos.every((u) => isOurImageUrl(u) && u.includes("/faces/"))) return jsonError("Upload your photos again, then try once more.");
  if (b.consent !== true) return jsonError("Please confirm these are your photos and you're 18 or older.");

  const config: AlbumConfig = {
    tradition: "hindu_north",
    events: ["ceremony"],
    palettes: ["red_gold"],
    venue: "mixed",
    lighting: "mixed",
    decor: { source: "preset", presetId: "floral_classic", applyToAllEvents: false },
    people: { mode: "likeness", brideUrls: photos as string[], groomUrls: [], coupleUrls: [], consentAt: Date.now() },
    mix: { decor: 0, decor_detail: 0, couple_stage: 0, family: 0, bride: 0, groom: 0, couple: 0 },
    notes: "",
    look: { who: "bride", tradition: "north", color: "", jewelry: "royal", glasses: parseGlasses(b.glasses), collection: collection.id },
  };
  const [user, anon] = await Promise.all([currentUser(), anonId(true)]);
  if (b.adminFree === true && !isAdmin(user)) return jsonError("Not allowed.", 403);
  const album = await createAlbum({ config, packId, kind: "couple", title: collection.albumTitle, user, anon });
  if (b.adminFree === true) {
    // Admins skip checkout to test likeness on their own photos: no charge, no revenue recorded.
    await fundAlbum(album, PACKS[packId].images, PACKS[packId].freeRegens);
    return NextResponse.json({ ok: true, albumId: album.id, redirect: `/album/${album.id}` });
  }
  return NextResponse.json({ ok: true, albumId: album.id });
}
