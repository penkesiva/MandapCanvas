import { NextResponse } from "next/server";
import { anonId, currentUser } from "@/lib/auth";
import { canEdit, getAlbum, publicAlbum, saveAlbum } from "@/lib/albums";
import { parseConfig, parsePackId } from "@/lib/validate";
import { jsonError } from "@/lib/http";
import { PACKS } from "@/lib/config";
import { defaultMix, normalizeEventSettings } from "@/lib/catalog";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

async function load(id: string) {
  const album = await getAlbum(id);
  if (!album) return { error: jsonError("Album not found.", 404) };
  const [user, anon] = await Promise.all([currentUser(), anonId(false)]);
  if (!canEdit(album, user, anon)) return { error: jsonError("You don't have access to this album.", 403) };
  return { album, user };
}

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const r = await load(id);
  if ("error" in r) return r.error;
  return NextResponse.json({ ok: true, album: publicAlbum(r.album) });
}

/** Rename, or (before payment) change settings and pack. */
export async function PATCH(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const r = await load(id);
  if ("error" in r) return r.error;
  const album = r.album;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return jsonError("Invalid request.");

  if (typeof body.title === "string") album.title = body.title.slice(0, 80) || album.title;
  if (typeof body.clientName === "string") album.clientName = body.clientName.slice(0, 80);

  if (body.packId && !body.config) {
    // Pack change only: keep every setting, resize the mix and trim to the pack's limits.
    if (album.paid) return jsonError("This album is already paid for.", 409);
    const packId = parsePackId(body.packId);
    if (!packId) return jsonError("Unknown pack.");
    const p = PACKS[packId];
    album.packId = packId;
    const events = album.config.events.slice(0, p.maxEvents);
    const trimmed = album.config.eventSettings
      ? normalizeEventSettings(events, album.config.eventSettings, album.config.palettes, p.maxPalettes)
      : { eventSettings: undefined, palettes: album.config.palettes.slice(0, p.maxPalettes) };
    album.config = {
      ...album.config,
      events,
      palettes: trimmed.palettes,
      eventSettings: trimmed.eventSettings,
      mix: defaultMix(p.images),
    };
  } else if (body.config || body.packId) {
    if (album.paid) return jsonError("This album is already paid for. Start a new album to change its settings.", 409);
    const packId = parsePackId(body.packId) ?? album.packId;
    const parsed = parseConfig(body.config ?? album.config, packId);
    if ("error" in parsed) return jsonError(parsed.error);
    album.packId = packId;
    album.config = { ...parsed.config, inventoryUrls: r.user?.plan === "studio" ? parsed.config.inventoryUrls : [] };
  }
  await saveAlbum(album);
  return NextResponse.json({ ok: true, album: publicAlbum(album) });
}
