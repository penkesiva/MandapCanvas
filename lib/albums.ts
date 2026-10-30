import "server-only";
import { ADVANCE_BATCH, FREE_PREVIEW, PACKS, type PackId } from "./config";
import { EVENTS, CATEGORIES, getTradition, eventLabel, getPalette } from "./catalog";
import { acquireLock, getJSON, kv, setJSON } from "./kv";
import { buildShotPrompt, type PromptRefs } from "./prompts";
import { generateImage, watermark, type RefImage } from "./imagegen";
import { loadImage, saveImage, deleteImage } from "./blob";
import { recordStat, todayCostCents } from "./stats";
import { sendAlbumReadyEmail } from "./email";
import type { Album, AlbumConfig, LedgerEntry, Shot, ShotCategory, User } from "./types";

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
      const palette = palettes[Math.floor(i / events.length) % palettes.length];
      const ev = EVENTS[event];
      shots.push({
        id: crypto.randomUUID().slice(0, 12),
        event,
        category: cat,
        paletteId: palette,
        venue: config.venue === "mixed" ? ev.defaultVenue : config.venue,
        lighting: config.lighting === "mixed" ? ev.defaultLighting : config.lighting,
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

async function loadRefs(album: Album): Promise<{ decor?: RefImage; bride?: RefImage; groom?: RefImage; inventory: RefImage[] }> {
  const c = album.config;
  const out: { decor?: RefImage; bride?: RefImage; groom?: RefImage; inventory: RefImage[] } = { inventory: [] };
  const tasks: Promise<void>[] = [];
  if (c.decor.source !== "preset" && c.decor.imageUrl)
    tasks.push(loadImage(c.decor.imageUrl).then((i) => void (out.decor = { label: "DECOR", ...i })));
  if (c.people.mode === "likeness" && c.people.consentAt) {
    if (c.people.brideUrl) tasks.push(loadImage(c.people.brideUrl).then((i) => void (out.bride = { label: "BRIDE", ...i })));
    if (c.people.groomUrl) tasks.push(loadImage(c.people.groomUrl).then((i) => void (out.groom = { label: "GROOM", ...i })));
  }
  for (const url of (c.inventoryUrls ?? []).slice(0, 3))
    tasks.push(loadImage(url).then((i) => void out.inventory.push({ label: "INVENTORY", ...i })));
  await Promise.allSettled(tasks);
  return out;
}

function aspectFor(shot: Shot): "4:3" | "3:4" {
  return shot.category === "bride" || shot.category === "groom" ? "3:4" : "4:3";
}

async function renderShot(
  album: Album,
  shot: Shot,
  refs: Awaited<ReturnType<typeof loadRefs>>,
  opts: { watermarked: boolean },
): Promise<{ url: string; cost: number }> {
  const c = album.config;
  const isPeople = !["decor", "decor_detail"].includes(shot.category);
  // The sketch guides the ceremony; it guides every event if asked to, or if there's no ceremony in the album.
  const useDecor = !!refs.decor && (shot.event === "ceremony" || c.decor.applyToAllEvents || !c.events.includes("ceremony"));
  const attached: RefImage[] = [];
  if (useDecor) attached.push(refs.decor!);
  if (isPeople && refs.bride && ["bride", "couple", "couple_stage", "family"].includes(shot.category)) attached.push(refs.bride);
  if (isPeople && refs.groom && ["groom", "couple", "couple_stage", "family"].includes(shot.category)) attached.push(refs.groom);
  attached.push(...refs.inventory);

  const promptRefs: PromptRefs = {
    decorImage: useDecor,
    brideImage: attached.some((r) => r.label === "BRIDE"),
    groomImage: attached.some((r) => r.label === "GROOM"),
    inventoryCount: refs.inventory.length,
  };
  const prompt = buildShotPrompt(c, shot, promptRefs);
  const category = CATEGORIES.find((x) => x.id === shot.category)?.name ?? shot.category;
  const result = await generateImage({
    prompt,
    refs: attached,
    aspectRatio: aspectFor(shot),
    hd: PACKS[album.packId]?.hd && !opts.watermarked,
    mockLabel: {
      title: `${eventLabel(shot.event, c.tradition)} · ${category}`,
      subtitle: `${getTradition(c.tradition).short} · ${getPalette(shot.paletteId).name}`,
      paletteId: shot.paletteId,
    },
  });
  const bytes = opts.watermarked ? await watermark(result.data) : result.data;
  const saved = await saveImage(
    `albums/${album.id}/${opts.watermarked ? "preview-" : ""}${shot.id}`,
    bytes,
    opts.watermarked ? "image/jpeg" : result.mimeType,
  );
  return { url: saved.url, cost: result.costMilliCents };
}

function dailyCapCents(): number {
  const v = Number(process.env.DAILY_COST_CAP_CENTS);
  return Number.isFinite(v) && v > 0 ? v : 5000;
}

export class GenerationPausedError extends Error {}

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
        if (shot.url) void deleteImage(shot.url);
        shot.url = r.value.url;
        shot.status = "done";
        shot.error = undefined;
        shot.doneAt = Date.now();
        cost += r.value.cost;
        ok += 1;
      } else {
        const msg = r.reason instanceof Error ? r.reason.message : String(r.reason);
        shot.error = msg.slice(0, 200);
        shot.status = shot.attempts >= 3 ? "failed" : "pending";
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
  const refs = await loadRefs(album);
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
    brand: album.brand,
    createdAt: album.createdAt,
  };
}

export type PublicAlbum = ReturnType<typeof publicAlbum>;
