import "server-only";
import { ADVANCE_BATCH, FREE_PREVIEW, PACKS, type PackId } from "./config";
import { EVENTS, CATEGORIES, getTradition, eventLabel, getPalette, getPreset } from "./catalog";
import { promises as fs } from "node:fs";
import path from "node:path";
import { SITE } from "./config";
import { acquireLock, getJSON, kv, setJSON } from "./kv";
import { buildEditPrompt, buildShotPrompt, type PromptRefs } from "./prompts";
import { buildEventLookPrompt, glassesRule } from "./bridalLooks";
import { buildCollectionPrompt, collectionShot, getCollection } from "./lookCollections";
import { buildVenuePrompt, VENUE_EVENTS, VENUE_STYLES } from "./venueDecor";
import { ART_STYLES, buildArtPrompt } from "./artStyles";
import { generateImage, watermark, type RefImage } from "./imagegen";
import { loadImage, saveImage, deleteImage } from "./blob";
import { recordStat, todayCostCents } from "./stats";
import { sendAlbumReadyEmail } from "./email";
import type { Album, AlbumConfig, EventDesign, EventId, LedgerEntry, Shot, ShotCategory, User } from "./types";

/* ---------------------------------------------------------------- storage */

export async function getAlbum(id: string): Promise<Album | null> {
  if (!/^[a-z0-9-]{8,64}$/i.test(id)) return null;
  return getJSON<Album>(`album:${id}`);
}

export async function saveAlbum(album: Album): Promise<void> {
  album.updatedAt = Date.now();
  await setJSON(`album:${album.id}`, album);
}

export async function listAlbumIds(listKey: string): Promise<string[]> {
  const ids = await kv().lrange(listKey, 0, 499);
  return [...new Set(ids)];
}

export async function albumsForUser(userId: string): Promise<Album[]> {
  const ids = await listAlbumIds(`albums:user:${userId}`);
  const albums = await Promise.all(ids.map(getAlbum));
  return albums.filter((a): a is Album => !!a && a.ownerUserId === userId);
}

export function canEdit(album: Album, user: User | null, anon: string | null): boolean {
  if (user && album.ownerUserId === user.id) return true;
  if (!album.ownerUserId && anon && album.ownerAnonId === anon) return true;
  return false;
}

/** Moves anonymous drafts to a user after sign-in or purchase. */
export async function claimAnonAlbums(anon: string | null, userId: string): Promise<void> {
  if (!anon) return;
  const ids = await listAlbumIds(`albums:anon:${anon}`);
  for (const id of ids) {
    const a = await getAlbum(id);
    if (a && !a.ownerUserId && a.ownerAnonId === anon) {
      a.ownerUserId = userId;
      await saveAlbum(a);
      await kv().lpush(`albums:user:${userId}`, a.id);
    }
  }
}

export async function attachAlbumToUser(album: Album, userId: string): Promise<void> {
  if (album.ownerUserId === userId) return;
  album.ownerUserId = userId;
  await kv().lpush(`albums:user:${userId}`, album.id);
}

export async function createAlbum(opts: {
  config: AlbumConfig;
  packId: PackId;
  kind: Album["kind"];
  title: string;
  clientName?: string;
  user: User | null;
  anon: string | null;
}): Promise<Album> {
  const album: Album = {
    id: crypto.randomUUID(),
    kind: opts.kind,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ownerUserId: opts.user?.id,
    ownerAnonId: opts.user ? undefined : opts.anon ?? undefined,
    title: opts.title.slice(0, 80) || "Our wedding",
    clientName: opts.clientName?.slice(0, 80),
    status: "draft",
    packId: opts.packId,
    imageQuota: 0,
    regensLeft: 0,
    paid: false,
    config: opts.config,
    shots: [],
    previews: [],
    brand: opts.kind === "proposal" ? opts.user?.brand : undefined,
  };
  await saveAlbum(album);
  if (opts.user) await kv().lpush(`albums:user:${opts.user.id}`, album.id);
  else if (opts.anon) await kv().lpush(`albums:anon:${opts.anon}`, album.id);
  await kv().lpush("albums:all", album.id);
  return album;
}

/* ---------------------------------------------------------------- credits */

export async function getCredits(userId: string): Promise<number> {
  return Number((await kv().get(`credits:${userId}`)) ?? 0);
}

export async function addCredits(userId: string, entry: LedgerEntry): Promise<number> {
  const bal = await kv().incrby(`credits:${userId}`, entry.delta);
  await kv().lpush(`ledger:${userId}`, JSON.stringify(entry));
  return bal;
}

/** Atomically spends credits; returns false (and leaves the balance unchanged) if insufficient. */
export async function spendCredits(userId: string, n: number, entry: Omit<LedgerEntry, "delta">): Promise<boolean> {
  const after = await kv().incrby(`credits:${userId}`, -n);
  if (after < 0) {
    await kv().incrby(`credits:${userId}`, n);
    return false;
  }
  await kv().lpush(`ledger:${userId}`, JSON.stringify({ ...entry, delta: -n }));
  return true;
}

/* ---------------------------------------------------------------- planning */

/** Expands the customer's mix into a concrete, evenly varied shot list. */
export function planShots(config: AlbumConfig, total: number, existing: Shot[] = []): Shot[] {
  if (config.artPack) {
    // Art pack: one style per image, in order; a top-up goes round the styles again.
    return Array.from({ length: Math.max(0, total - existing.length) }, (_, i) => ({
      id: crypto.randomUUID().slice(0, 12),
      event: "ceremony" as const,
      category: "couple" as const,
      scene: existing.length + i,
      paletteId: "red_gold",
      venue: "indoor" as const,
      lighting: "day" as const,
      status: "pending" as const,
      attempts: 0,
    }));
  }
  if (config.venuePack) {
    // Venue pack: their space in one style per image, in order; a top-up goes round the styles again.
    const vp = config.venuePack;
    return Array.from({ length: Math.max(0, total - existing.length) }, (_, i) => ({
      id: crypto.randomUUID().slice(0, 12),
      event: vp.event,
      category: "decor" as const,
      scene: existing.length + i,
      paletteId: vp.palette || "red_gold",
      venue: "indoor" as const,
      lighting: "day" as const,
      status: "pending" as const,
      attempts: 0,
    }));
  }
  if (config.look?.collection) {
    // Collections: one portrait per scene in order, then a second pose per scene.
    return Array.from({ length: Math.max(0, total - existing.length) }, (_, i) => ({
      id: crypto.randomUUID().slice(0, 12),
      event: "ceremony" as const,
      category: "bride" as const,
      scene: existing.length + i,
      paletteId: "red_gold",
      venue: "indoor" as const,
      lighting: "day" as const,
      status: "pending" as const,
      attempts: 0,
    }));
  }
  const events = config.events.length ? config.events : (["ceremony"] as const);
  const palettes = config.palettes.length ? config.palettes : ["blush_ivory"];
  const shots: Shot[] = [];
  const order = CATEGORIES.map((c) => c.id);
  const counters: Partial<Record<ShotCategory, number>> = {};
  for (const s of existing) counters[s.category] = (counters[s.category] ?? 0) + 1;

  // Interleave categories so partial albums already look balanced.
  const remaining = { ...config.mix };
  for (const s of existing) remaining[s.category] = Math.max(0, (remaining[s.category] ?? 0) - 1);
  let guard = 0;
  while (shots.length + existing.length < total && guard++ < 10000) {
    let placed = false;
    for (const cat of order) {
      if (shots.length + existing.length >= total) break;
      if ((remaining[cat] ?? 0) <= 0) continue;
      remaining[cat] -= 1;
      const i = counters[cat] ?? 0;
      counters[cat] = i + 1;
      const event = events[i % events.length];
      const set = config.eventSettings?.[event];
      const pals = set?.palettes?.length ? set.palettes : palettes;
      const palette = pals[Math.floor(i / events.length) % pals.length];
      const ev = EVENTS[event];
      shots.push({
        id: crypto.randomUUID().slice(0, 12),
        event,
        category: cat,
        paletteId: palette,
        venue: set?.venue ?? (config.venue === "mixed" ? ev.defaultVenue : config.venue),
        lighting: set?.lighting ?? (config.lighting === "mixed" ? ev.defaultLighting : config.lighting),
        status: "pending",
        attempts: 0,
      });
      placed = true;
    }
    if (!placed) {
      // Mix totals less than quota (e.g. a top-up): fill with wide decor shots.
      remaining.decor = (remaining.decor ?? 0) + (total - existing.length - shots.length);
    }
  }
  return shots;
}

/* ---------------------------------------------------------------- generation */

/**
 * The design that guides one event. Per-event designs win; older albums fall back to the album-wide
 * decor (a template styled every event; a sketch or photo guided the ceremony unless told otherwise).
 */
export function designFor(c: AlbumConfig, event: EventId): EventDesign | null {
  const own = c.eventSettings?.[event]?.design;
  if (own) return own;
  if (!c.decor) return null;
  if (c.decor.source === "preset") return { source: "preset", presetId: c.decor.presetId };
  const applies = event === "ceremony" || c.decor.applyToAllEvents || !c.events.includes("ceremony");
  return applies && c.decor.imageUrl ? { source: c.decor.source, imageUrl: c.decor.imageUrl } : null;
}

type Refs = {
  decor: Map<string, RefImage>;
  bride?: RefImage;
  groom?: RefImage;
  inventory: RefImage[];
  /** Look Packs: every photo of each person. */
  people: { bride: RefImage[]; groom: RefImage[]; couple: RefImage[] };
};

async function loadRefs(album: Album, events: EventId[] = album.config.events): Promise<Refs> {
  const c = album.config;
  const out: Refs = { decor: new Map(), inventory: [], people: { bride: [], groom: [], couple: [] } };
  if (c.look && c.people.consentAt) {
    const sets = { bride: c.people.brideUrls ?? [], groom: c.people.groomUrls ?? [], couple: c.people.coupleUrls ?? [] };
    await Promise.allSettled(
      (Object.keys(sets) as (keyof typeof sets)[]).flatMap((who) =>
        sets[who].slice(0, 5).map((url, i) =>
          loadImage(url).then((img) => {
            out.people[who][i] = { label: `${who.toUpperCase()} PHOTO`, ...img };
          }),
        ),
      ),
    );
    for (const k of ["bride", "groom", "couple"] as const) out.people[k] = out.people[k].filter(Boolean);
    return out;
  }
  const tasks: Promise<void>[] = [];
  // A picked template: its photo is the blueprint, so every image of that event shows the same mandap.
  const templates = new Set(events.map((e) => designFor(c, e)).filter((d) => d?.source === "preset").map((d) => getPreset(d!.presetId).image));
  for (const img of templates) tasks.push(loadTemplate(img).then((i) => void out.decor.set(img, { label: "TEMPLATE", ...i })));
  const urls = new Set(events.map((e) => designFor(c, e)).filter((d) => d && d.source !== "preset" && d.imageUrl).map((d) => d!.imageUrl!));
  for (const url of urls) tasks.push(loadImage(url).then((i) => void out.decor.set(url, { label: "DECOR", ...i })));
  if (c.people.mode === "likeness" && c.people.consentAt) {
    if (c.people.brideUrl) tasks.push(loadImage(c.people.brideUrl).then((i) => void (out.bride = { label: "BRIDE", ...i })));
    if (c.people.groomUrl) tasks.push(loadImage(c.people.groomUrl).then((i) => void (out.groom = { label: "GROOM", ...i })));
  }
  for (const url of (c.inventoryUrls ?? []).slice(0, 3))
    tasks.push(loadImage(url).then((i) => void out.inventory.push({ label: "INVENTORY", ...i })));
  await Promise.allSettled(tasks);
  return out;
}

/** A template photo from /public: read from disk when it's there (local), otherwise from the site. */
async function loadTemplate(img: string): Promise<{ data: Buffer; mimeType: string }> {
  try {
    const data = await fs.readFile(path.join(process.cwd(), "public", img));
    return { data, mimeType: img.endsWith(".png") ? "image/png" : "image/jpeg" };
  } catch {
    return loadImage(new URL(img, SITE.url).toString());
  }
}

function aspectFor(shot: Shot, album?: Album): "4:3" | "3:4" | "16:9" | "9:16" {
  if (album?.config.venuePack) return album.config.venuePack.aspect;
  if (album?.config.artPack) return album.config.artPack.aspect;
  if (album?.config.look) return "3:4";
  return shot.category === "bride" || shot.category === "groom" ? "3:4" : "4:3";
}

/** Up to `n` photos, rotating the starting photo per shot so every upload gets used. */
function pick(list: RefImage[], n: number, offset: number): RefImage[] {
  if (list.length <= n) return list;
  return Array.from({ length: n }, (_, i) => list[(offset + i) % list.length]);
}

/** The style a Venue pack image uses. */
export function venueShotStyle(c: AlbumConfig, shot: Shot) {
  const styles = c.venuePack?.styles ?? [];
  const id = styles[(shot.scene ?? 0) % Math.max(1, styles.length)];
  return VENUE_STYLES.find((s) => s.id === id) ?? VENUE_STYLES[0];
}

/** The style an Art pack image uses. */
export function artShotStyle(c: AlbumConfig, shot: Shot) {
  const styles = c.artPack?.styles ?? [];
  const id = styles[(shot.scene ?? 0) % Math.max(1, styles.length)];
  return ART_STYLES.find((s) => s.id === id) ?? ART_STYLES[0];
}

/** Art pack image: their photo redrawn in one style. */
async function renderArtShot(album: Album, shot: Shot): Promise<{ url: string; cost: number }> {
  const ap = album.config.artPack!;
  const style = artShotStyle(album.config, shot);
  const photo = await loadImage(ap.photoUrl);
  const result = await generateImage({
    prompt: buildArtPrompt(style, ap.outfit, ap.glasses === "auto" ? undefined : ap.glasses),
    refs: [{ label: "PHOTO", ...photo }],
    aspectRatio: ap.aspect,
    mockLabel: { title: "Your art portrait", subtitle: style.name, paletteId: "red_gold" },
  });
  const saved = await saveImage(`albums/${album.id}/${shot.id}`, result.data, result.mimeType);
  return { url: saved.url, cost: result.costMilliCents };
}

/** Venue pack image: an edit of their own venue photo in one style. */
async function renderVenueShot(album: Album, shot: Shot): Promise<{ url: string; cost: number }> {
  const vp = album.config.venuePack!;
  const style = venueShotStyle(album.config, shot);
  const photo = await loadImage(vp.photoUrl);
  const ev = VENUE_EVENTS.find((e) => e.id === vp.event);
  const result = await generateImage({
    prompt: buildVenuePrompt({ event: vp.event, style: style.id, palette: vp.palette }),
    refs: [{ label: "VENUE", ...photo }],
    aspectRatio: vp.aspect,
    mockLabel: { title: `Your venue: ${ev?.name ?? "event"}`, subtitle: style.name, paletteId: vp.palette || "red_gold" },
  });
  const saved = await saveImage(`albums/${album.id}/${shot.id}`, result.data, result.mimeType);
  return { url: saved.url, cost: result.costMilliCents };
}

/** Look Pack portrait: the person's photos plus the per-event outfit and scene. */
async function renderLookShot(album: Album, shot: Shot, refs: Refs): Promise<{ url: string; cost: number }> {
  const c = album.config;
  const look = c.look!;
  const collection = getCollection(look.collection);
  if (collection) {
    const n = shot.scene ?? album.shots.findIndex((s) => s.id === shot.id);
    const attached = refs.people.bride.length ? pick(refs.people.bride, 3, n) : pick(refs.people.couple, 2, n);
    const { scene } = collectionShot(collection, Math.max(0, n));
    const result = await generateImage({
      prompt: buildCollectionPrompt({ collection, n: Math.max(0, n), photoCount: attached.length, glassesRule: glassesRule(look.glasses) }),
      refs: attached.map((r) => ({ ...r, label: "BRIDE PHOTO" })),
      aspectRatio: "3:4",
      mockLabel: { title: `${collection.name} · ${scene.name}`, subtitle: "Portrait", paletteId: "red_gold" },
    });
    const saved = await saveImage(`albums/${album.id}/${shot.id}`, result.data, result.mimeType);
    return { url: saved.url, cost: result.costMilliCents };
  }
  const person = shot.category === "groom" ? "groom" : shot.category === "couple" ? "couple" : "bride";
  const variant = album.shots.filter((s) => s.event === shot.event && s.category === shot.category).findIndex((s) => s.id === shot.id);
  const offset = Math.max(0, variant) + album.shots.findIndex((s) => s.id === shot.id);
  let attached: RefImage[] = [];
  if (person === "couple") {
    attached = refs.people.couple.length
      ? pick(refs.people.couple, 3, offset)
      : [...pick(refs.people.bride, 2, offset), ...pick(refs.people.groom, 2, offset)];
  } else {
    attached = refs.people[person].length ? pick(refs.people[person], 3, offset) : pick(refs.people.couple, 2, offset);
  }
  const count = (label: string) => attached.filter((r) => r.label === label).length;
  const prompt = buildEventLookPrompt({
    look,
    event: shot.event,
    eventName: eventLabel(shot.event, c.tradition),
    person,
    variant: Math.max(0, variant),
    refs: { bride: count("BRIDE PHOTO"), groom: count("GROOM PHOTO"), couple: count("COUPLE PHOTO") },
  });
  const result = await generateImage({
    prompt,
    refs: attached,
    aspectRatio: "3:4",
    mockLabel: { title: `${eventLabel(shot.event, c.tradition)} · ${person}`, subtitle: look.tradition, paletteId: "red_gold" },
  });
  const saved = await saveImage(`albums/${album.id}/${shot.id}`, result.data, result.mimeType);
  return { url: saved.url, cost: result.costMilliCents };
}

async function renderShot(
  album: Album,
  shot: Shot,
  refs: Refs,
  opts: { watermarked: boolean },
): Promise<{ url: string; cost: number }> {
  const c = album.config;
  const category = CATEGORIES.find((x) => x.id === shot.category)?.name ?? shot.category;
  const mockLabel = {
    title: `${eventLabel(shot.event, c.tradition)} · ${category}`,
    subtitle: `${getTradition(c.tradition).short} · ${getPalette(shot.paletteId).name}`,
    paletteId: shot.paletteId,
  };

  // Refinement: edit the current image instead of starting over.
  if (shot.edit && shot.url && !opts.watermarked) {
    const current = await loadImage(shot.url);
    const result = await generateImage({
      prompt: buildEditPrompt(c, shot, shot.edit),
      refs: [{ label: "CURRENT IMAGE", ...current }],
      aspectRatio: aspectFor(shot, album),
      hd: PACKS[album.packId]?.hd,
      mockLabel: { ...mockLabel, subtitle: `Changed: ${shot.edit.slice(0, 60)}` },
    });
    const saved = await saveImage(`albums/${album.id}/${shot.id}`, result.data, result.mimeType);
    return { url: saved.url, cost: result.costMilliCents };
  }
  if (c.venuePack) return renderVenueShot(album, shot);
  if (c.artPack) return renderArtShot(album, shot);
  if (c.look) return renderLookShot(album, shot, refs);

  const isPeople = !["decor", "decor_detail"].includes(shot.category);
  const design = designFor(c, shot.event);
  const decorRef =
    design?.source === "preset"
      ? refs.decor.get(getPreset(design.presetId).image)
      : design && design.imageUrl
        ? refs.decor.get(design.imageUrl)
        : undefined;
  const useDecor = !!decorRef;
  const attached: RefImage[] = [];
  if (decorRef) attached.push(decorRef);
  if (isPeople && refs.bride && ["bride", "couple", "couple_stage", "family"].includes(shot.category)) attached.push(refs.bride);
  if (isPeople && refs.groom && ["groom", "couple", "couple_stage", "family"].includes(shot.category)) attached.push(refs.groom);
  attached.push(...refs.inventory);

  const promptRefs: PromptRefs = {
    decorImage: useDecor && decorRef?.label === "DECOR",
    templateImage: decorRef?.label === "TEMPLATE",
    brideImage: attached.some((r) => r.label === "BRIDE"),
    groomImage: attached.some((r) => r.label === "GROOM"),
    inventoryCount: refs.inventory.length,
  };
  const prompt = buildShotPrompt(c, shot, promptRefs, design);
  const result = await generateImage({
    prompt,
    refs: attached,
    aspectRatio: aspectFor(shot),
    hd: PACKS[album.packId]?.hd && !opts.watermarked,
    mockLabel,
  });
  const bytes = opts.watermarked ? await watermark(result.data) : result.data;
  const saved = await saveImage(
    `albums/${album.id}/${opts.watermarked ? "preview-" : ""}${shot.id}`,
    bytes,
    opts.watermarked ? "image/jpeg" : result.mimeType,
  );
  return { url: saved.url, cost: result.costMilliCents };
}

export function dailyCapCents(): number {
  const v = Number(process.env.DAILY_COST_CAP_CENTS);
  return Number.isFinite(v) && v > 0 ? v : 5000;
}

export class GenerationPausedError extends Error {}

const MAX_VERSIONS = 8;

/**
 * Generates the next few pending shots. Safe to call repeatedly and concurrently:
 * a lock ensures only one worker touches an album at a time.
 */
export async function advanceAlbum(albumId: string): Promise<{ album: Album | null; worked: number; busy: boolean }> {
  const release = await acquireLock(`album:${albumId}`, 110);
  if (!release) return { album: await getAlbum(albumId), worked: 0, busy: true };
  try {
    const album = await getAlbum(albumId);
    if (!album || !album.paid) return { album, worked: 0, busy: false };

    // Recover shots left "running" by a crashed worker.
    for (const s of album.shots) if (s.status === "running") s.status = "pending";

    const batch = album.shots.filter((s) => s.status === "pending").slice(0, ADVANCE_BATCH);
    if (batch.length === 0) {
      await finishIfComplete(album);
      return { album, worked: 0, busy: false };
    }
    if ((await todayCostCents()) >= dailyCapCents()) {
      throw new GenerationPausedError("Generation is paused for today because the daily spend cap was reached.");
    }

    album.status = "generating";
    for (const s of batch) s.status = "running";
    await saveAlbum(album);

    const refs = await loadRefs(album);
    const results = await Promise.allSettled(batch.map((s) => renderShot(album, s, refs, { watermarked: false })));

    // Re-read so concurrent edits (favorites, title) aren't lost.
    const fresh = (await getAlbum(albumId)) ?? album;
    let cost = 0;
    let ok = 0;
    results.forEach((r, i) => {
      const shot = fresh.shots.find((s) => s.id === batch[i].id);
      if (!shot) return;
      shot.attempts += 1;
      if (r.status === "fulfilled") {
        // Keep the previous image as a version so it can be restored.
        if (shot.url) {
          shot.versions = [{ url: shot.url, at: shot.doneAt ?? Date.now(), kind: shot.made ?? "original", note: shot.madeNote }, ...(shot.versions ?? [])];
          for (const old of shot.versions.slice(MAX_VERSIONS)) void deleteImage(old.url);
          shot.versions = shot.versions.slice(0, MAX_VERSIONS);
        }
        shot.made = shot.edit ? "refine" : shot.url ? "new" : "original";
        shot.madeNote = shot.edit;
        shot.edit = undefined;
        shot.url = r.value.url;
        shot.status = "done";
        shot.error = undefined;
        shot.doneAt = Date.now();
        cost += r.value.cost;
        ok += 1;
      } else {
        const msg = r.reason instanceof Error ? r.reason.message : String(r.reason);
        shot.error = msg.slice(0, 200);
        shot.status = shot.attempts >= 3 ? (shot.url ? "done" : "failed") : "pending";
        if (shot.status === "done") shot.edit = undefined; // a failed change keeps the current image
        console.error("shot failed", albumId, shot.id, msg);
      }
    });
    fresh.costMilliCents = (fresh.costMilliCents ?? 0) + cost;
    await saveAlbum(fresh);
    await recordStat({ images: ok, costMilliCents: cost, failures: results.length - ok });
    await finishIfComplete(fresh);
    return { album: fresh, worked: batch.length, busy: false };
  } finally {
    await release();
  }
}

async function finishIfComplete(album: Album): Promise<void> {
  const open = album.shots.some((s) => s.status === "pending" || s.status === "running");
  if (open || album.shots.length === 0) return;
  if (album.status !== "complete") {
    album.status = "complete";
    await saveAlbum(album);
  }
  if (!album.completedNotifiedAt && album.ownerUserId) {
    const owner = await getJSON<User>(`user:${album.ownerUserId}`);
    if (owner) {
      album.completedNotifiedAt = Date.now();
      await saveAlbum(album);
      await sendAlbumReadyEmail(owner.email, album).catch((e) => console.error("ready email failed", e));
    }
  }
}

/** Allocates paid images to an album and queues generation. */
export async function fundAlbum(album: Album, images: number, regens: number): Promise<Album> {
  album.paid = true;
  album.imageQuota += images;
  album.regensLeft += regens;
  const extra = planShots(album.config, album.imageQuota, album.shots);
  album.shots.push(...extra);
  album.status = "queued";
  await saveAlbum(album);
  await kv().lpush("albums:queue", album.id);
  return album;
}

/** Free watermarked previews: one wide decor shot and one people shot when possible. */
export async function generatePreview(album: Album): Promise<Album> {
  const already = album.previews.filter((p) => p.status === "done").length;
  if (already >= FREE_PREVIEW.imagesPerAlbum) return album;
  const plan = planShots(
    { ...album.config, mix: { decor: 1, decor_detail: 0, bride: 0, groom: 0, couple: 0, couple_stage: 1, family: 0 }, events: album.config.events.includes("ceremony") ? ["ceremony"] : album.config.events.slice(0, 1) },
    FREE_PREVIEW.imagesPerAlbum,
  ).slice(already);
  if ((await todayCostCents()) >= dailyCapCents()) {
    throw new GenerationPausedError("Previews are paused for today. Please try again tomorrow.");
  }
  const refs = await loadRefs(album, [...new Set(plan.map((s) => s.event))]);
  const results = await Promise.allSettled(plan.map((s) => renderShot(album, s, refs, { watermarked: true })));
  const fresh = (await getAlbum(album.id)) ?? album;
  let cost = 0;
  results.forEach((r, i) => {
    const s = plan[i];
    s.attempts = 1;
    if (r.status === "fulfilled") {
      s.status = "done";
      s.url = r.value.url;
      s.watermarked = true;
      cost += r.value.cost;
      fresh.previews.push(s);
    } else {
      console.error("preview failed", album.id, r.reason);
    }
  });
  fresh.costMilliCents = (fresh.costMilliCents ?? 0) + cost;
  await saveAlbum(fresh);
  await recordStat({ previews: results.filter((r) => r.status === "fulfilled").length, costMilliCents: cost });
  if (!fresh.previews.length) {
    const first = results.find((r) => r.status === "rejected") as PromiseRejectedResult | undefined;
    throw new Error(first?.reason instanceof Error ? first.reason.message : "Preview generation failed.");
  }
  return fresh;
}

export async function ensureShareToken(album: Album): Promise<string> {
  if (album.shareToken) return album.shareToken;
  album.shareToken = crypto.randomUUID().replace(/-/g, "").slice(0, 20);
  await kv().set(`share:${album.shareToken}`, album.id);
  await saveAlbum(album);
  return album.shareToken;
}

export async function albumByShareToken(token: string): Promise<Album | null> {
  if (!/^[a-f0-9]{20}$/.test(token)) return null;
  const id = await kv().get(`share:${token}`);
  return id ? getAlbum(id) : null;
}

/** Strips owner-only fields before sending an album to the browser. */
export function publicAlbum(album: Album) {
  return {
    id: album.id,
    kind: album.kind,
    title: album.title,
    clientName: album.clientName,
    status: album.status,
    packId: album.packId,
    imageQuota: album.imageQuota,
    regensLeft: album.regensLeft,
    paid: album.paid,
    config: {
      ...album.config,
      people: { mode: album.config.people.mode, hasBride: !!album.config.people.brideUrl, hasGroom: !!album.config.people.groomUrl },
    },
    shots: album.shots.map((s) => ({ ...s, error: undefined })),
    previews: album.previews,
    shareToken: album.shareToken,
    sharePin: album.sharePin,
    brand: album.brand,
    createdAt: album.createdAt,
  };
}

export type PublicAlbum = ReturnType<typeof publicAlbum>;
