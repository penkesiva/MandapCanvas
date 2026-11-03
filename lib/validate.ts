import { PACKS, type PackId, ALBUM_PACKS } from "./config";
import { supabaseHost } from "./supabase";
import { CATEGORIES, DECOR_PRESETS, EVENTS, EVENT_DEFAULT_PRESET, PALETTES, TRADITIONS, mixTotal, normalizeEventSettings } from "./catalog";
import type { AlbumConfig, EventDesign, EventId, ShotMix, TraditionId } from "./types";

/** Only accept image URLs that we stored ourselves (prevents fetching arbitrary URLs server-side). */
export function isOurImageUrl(url: unknown): url is string {
  if (typeof url !== "string" || url.length > 500) return false;
  if (/^\/api\/dev-blob\/[\w\-/.]+$/.test(url)) return true;
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return false;
    if (u.hostname.endsWith(".public.blob.vercel-storage.com")) return true;
    const sbHost = supabaseHost();
    return !!sbHost && u.host === sbHost && u.pathname.startsWith("/storage/v1/object/public/media/");
  } catch {
    return false;
  }
}

export function parsePackId(v: unknown): PackId | null {
  return typeof v === "string" && (ALBUM_PACKS as string[]).includes(v) ? (v as PackId) : null;
}

export function parseConfig(raw: unknown, packId: PackId): { config: AlbumConfig } | { error: string } {
  if (!raw || typeof raw !== "object") return { error: "Missing album settings." };
  const r = raw as Record<string, unknown>;
  const pack = PACKS[packId];

  const tradition = TRADITIONS.find((t) => t.id === r.tradition)?.id as TraditionId | undefined;
  if (!tradition) return { error: "Choose a wedding tradition." };
  const allowedEvents = TRADITIONS.find((t) => t.id === tradition)!.events;

  const events = (Array.isArray(r.events) ? r.events : []).filter(
    (e): e is EventId => typeof e === "string" && e in EVENTS && allowedEvents.includes(e as EventId),
  );
  const uniqEvents = [...new Set(events)];
  if (uniqEvents.length === 0) return { error: "Pick at least one event." };
  if (uniqEvents.length > pack.maxEvents) return { error: `The ${pack.name} pack covers up to ${pack.maxEvents} events.` };

  let palettes = [...new Set((Array.isArray(r.palettes) ? r.palettes : []).filter((p): p is string => PALETTES.some((x) => x.id === p)))];

  // Per-event palettes, venue and light (newer clients). Distinct palettes across the album count toward the pack.
  let eventSettings: AlbumConfig["eventSettings"];
  if (r.eventSettings && typeof r.eventSettings === "object") {
    const raw = r.eventSettings as Record<string, { palettes?: unknown; venue?: unknown; lighting?: unknown; design?: unknown }>;
    const requested = new Set<string>();
    const cleaned: NonNullable<AlbumConfig["eventSettings"]> = {};
    for (const e of uniqEvents) {
      const x = raw[e] ?? {};
      const pals = (Array.isArray(x.palettes) ? x.palettes : []).filter((p): p is string => typeof p === "string" && PALETTES.some((q) => q.id === p));
      pals.forEach((p) => requested.add(p));
      const d = (x.design ?? null) as { source?: unknown; imageUrl?: unknown; presetId?: unknown } | null;
      let design: EventDesign;
      if (d && (d.source === "sketch" || d.source === "upload")) {
        if (!isOurImageUrl(d.imageUrl)) return { error: `Add a sketch or photo for ${EVENTS[e].name}, or pick a template.` };
        design = { source: d.source, imageUrl: d.imageUrl };
      } else {
        const presetId = typeof d?.presetId === "string" && DECOR_PRESETS.some((q) => q.id === d.presetId) ? d.presetId : EVENT_DEFAULT_PRESET[e];
        design = { source: "preset", presetId };
      }
      cleaned[e] = { design, palettes: pals, venue: x.venue as "indoor", lighting: x.lighting as "day" };
    }
    if (requested.size > pack.maxPalettes) return { error: `The ${pack.name} pack covers up to ${pack.maxPalettes} palettes in total.` };
    const norm = normalizeEventSettings(uniqEvents, cleaned, palettes, pack.maxPalettes);
    eventSettings = norm.eventSettings;
    palettes = norm.palettes;
  }
  if (palettes.length === 0) return { error: "Pick at least one color palette." };
  if (palettes.length > pack.maxPalettes) return { error: `The ${pack.name} pack covers up to ${pack.maxPalettes} palettes.` };

  const venue = ["indoor", "outdoor", "mixed"].includes(r.venue as string) ? (r.venue as AlbumConfig["venue"]) : "mixed";
  const lighting = ["day", "evening", "mixed"].includes(r.lighting as string) ? (r.lighting as AlbumConfig["lighting"]) : "mixed";

  let decor: AlbumConfig["decor"];
  if (eventSettings) {
    // Album-wide decor mirrors the main event's design (used only by older code paths).
    const main = eventSettings[uniqEvents.includes("ceremony") ? "ceremony" : uniqEvents[0]]!.design!;
    decor = { ...main, applyToAllEvents: false };
  } else {
    const d = (r.decor ?? {}) as Record<string, unknown>;
    const source = ["sketch", "upload", "preset"].includes(d.source as string) ? (d.source as AlbumConfig["decor"]["source"]) : "preset";
    decor = { source, applyToAllEvents: d.applyToAllEvents === true };
    if (source === "preset") {
      decor.presetId = DECOR_PRESETS.some((p) => p.id === d.presetId) ? (d.presetId as string) : "floral_classic";
    } else {
      if (!isOurImageUrl(d.imageUrl)) return { error: "Add your sketch or decor photo first." };
      decor.imageUrl = d.imageUrl;
    }
  }

  const p = (r.people ?? {}) as Record<string, unknown>;
  const people: AlbumConfig["people"] = { mode: p.mode === "likeness" ? "likeness" : "silhouette" };
  if (people.mode === "likeness") {
    if (p.consent !== true) return { error: "Please confirm you have permission to use these photos." };
    if (isOurImageUrl(p.brideUrl)) people.brideUrl = p.brideUrl;
    if (isOurImageUrl(p.groomUrl)) people.groomUrl = p.groomUrl;
    if (!people.brideUrl && !people.groomUrl) people.mode = "silhouette";
    else {
      people.consentAt = Date.now();
      people.glasses = p.glasses === "keep" ? "keep" : "remove";
    }
  }

  const m = (r.mix ?? {}) as Record<string, unknown>;
  const mix = Object.fromEntries(
    CATEGORIES.map((c) => [c.id, Math.max(0, Math.min(pack.images, Math.floor(Number(m[c.id]) || 0)))]),
  ) as ShotMix;
  if (mixTotal(mix) !== pack.images) return { error: `Your album mix adds up to ${mixTotal(mix)} — it needs to total ${pack.images}.` };

  const notes = typeof r.notes === "string" ? r.notes.slice(0, 600) : "";
  const inventoryUrls = (Array.isArray(r.inventoryUrls) ? r.inventoryUrls : []).filter(isOurImageUrl).slice(0, 3);

  return {
    config: { tradition, events: uniqEvents, palettes, venue, lighting, decor, people, mix, notes, inventoryUrls, eventSettings },
  };
}
