import { NextResponse } from "next/server";
import { anonId, currentUser } from "@/lib/auth";
import { createAlbum } from "@/lib/albums";
import { LOOK_PACKS, type PackId } from "@/lib/config";
import { LOOK_JEWELRY, LOOK_TO_ALBUM_TRADITION, LOOK_TRADITIONS, lookMix } from "@/lib/bridalLooks";
import { OUTFIT_COLORS } from "@/lib/outfitColors";
import { clientIp, jsonError, rateLimit } from "@/lib/http";
import { isOurImageUrl } from "@/lib/validate";
import type { AlbumConfig, EventId, TraditionId } from "@/lib/types";

export const runtime = "nodejs";

const EVENT_IDS: EventId[] = ["haldi", "mehndi", "sangeet", "garba", "ceremony", "reception"];

function photoList(v: unknown): string[] | null {
  if (v === undefined) return [];
  if (!Array.isArray(v) || v.length > 5) return null;
  return v.every((u) => isOurImageUrl(u) && u.includes("/faces/")) ? (v as string[]) : null;
}

/** Creates an unpaid Look Pack album; the client sends the customer to checkout next. */
export async function POST(request: Request) {
  const ip = await clientIp();
  if (!(await rateLimit(`looks-pack:${ip}`, 20, 3600))) return jsonError("Too many requests. Try again in a few minutes.", 429);
  const b = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!b) return jsonError("Invalid request.");

  const who = b.who === "bride" || b.who === "groom" || b.who === "couple" ? b.who : null;
  const tradition = LOOK_TRADITIONS.some((t) => t.id === b.tradition) ? (b.tradition as string) : null;
  const color = typeof b.color === "string" && (b.color === "" || OUTFIT_COLORS.some((o) => o.id === b.color)) ? b.color : "";
  const jewelry = LOOK_JEWELRY.find((j) => j.id === b.jewelry)?.id ?? "classic";
  const packId = LOOK_PACKS.includes(b.packId as PackId) ? (b.packId as PackId) : null;
  const events = Array.isArray(b.events) ? [...new Set(b.events.filter((e): e is EventId => EVENT_IDS.includes(e as EventId)))] : [];
  const photos = (b.photos ?? {}) as Record<string, unknown>;
  const bride = photoList(photos.bride);
  const groom = photoList(photos.groom);
  const couple = photoList(photos.couple);

  if (!who || !tradition || !packId) return jsonError("Choose who it's for, a look and a pack.");
  if (!events.length) return jsonError("Pick at least one event.");
  if (!bride || !groom || !couple) return jsonError("Upload your photos again, then try once more.");
  if (b.consent !== true) return jsonError("Please confirm the photos are of you, or that everyone in them agreed.");
  const has = { bride: bride.length > 0, groom: groom.length > 0, couple: couple.length > 0 };
  if (who === "bride" && !has.bride && !has.couple) return jsonError("Add at least one photo of the bride.");
  if (who === "groom" && !has.groom && !has.couple) return jsonError("Add at least one photo of the groom.");
  if (who === "couple" && !has.couple && !(has.bride && has.groom)) return jsonError("Add a photo of you both, or at least one photo of each of you.");

  const mix = lookMix(who, packId === "look30" ? 30 : 12);
  const config: AlbumConfig = {
    tradition: (LOOK_TO_ALBUM_TRADITION[tradition] ?? "hindu_north") as TraditionId,
    events,
    palettes: ["red_gold"],
    venue: "mixed",
    lighting: "mixed",
    decor: { source: "preset", presetId: "floral_classic", applyToAllEvents: false },
    people: {
      mode: "likeness",
      brideUrls: who === "groom" ? [] : bride,
      groomUrls: who === "bride" ? [] : groom,
      coupleUrls: couple,
      consentAt: Date.now(),
    },
    mix: { decor: 0, decor_detail: 0, couple_stage: 0, family: 0, ...mix },
    notes: "",
    look: { who, tradition, color, jewelry },
  };
  const [user, anon] = await Promise.all([currentUser(), anonId(true)]);
  const album = await createAlbum({
    config,
    packId,
    kind: "couple",
    title: who === "couple" ? "Our wedding looks" : who === "bride" ? "My bridal looks" : "My groom looks",
    user,
    anon,
  });
  return NextResponse.json({ ok: true, albumId: album.id });
}
