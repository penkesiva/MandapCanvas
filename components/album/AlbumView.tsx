"use client";

import { readJson } from "@/lib/readJson";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { track } from "@vercel/analytics";
import { ChevronLeft, ChevronRight, Download, Heart, Link2, Loader2, Printer, RefreshCw, Share2, Sparkles, Wand2, X, AlertCircle } from "lucide-react";
import { AI_LABEL, PACKS, ALBUM_PACKS, LOOK_PACKS, formatUSD, type PackId } from "@/lib/config";
import { collectionShot, getCollection } from "@/lib/lookCollections";
import { VENUE_EVENTS, VENUE_STYLES } from "@/lib/venueDecor";
import { ART_STYLES } from "@/lib/artStyles";
import { CATEGORIES, eventLabel, getPalette } from "@/lib/catalog";
import type { PublicAlbum } from "@/lib/albums";
import type { Shot } from "@/lib/types";

type Filters = { event: string; category: string; palette: string; favorites: boolean };

export function AlbumView({
  initial,
  votes,
  credits,
  signedIn,
  welcome,
}: {
  initial: PublicAlbum;
  votes: Record<string, number>;
  credits: number | null;
  signedIn: boolean;
  welcome: boolean;
}) {
  const [album, setAlbum] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(welcome ? "Payment received. Your album is being created — images appear below as they're ready." : null);
  const [filters, setFilters] = useState<Filters>({ event: "all", category: "all", palette: "all", favorites: false });
  const [open, setOpen] = useState<number | null>(null);
  const [refineText, setRefineText] = useState("");
  const [zipping, setZipping] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  useEffect(() => {
    if (initial.shareToken) setShareUrl(`${window.location.origin}/s/${initial.shareToken}`);
  }, [initial.shareToken]);
  const [busyShot, setBusyShot] = useState<string | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);
  const stop = useRef(false);

  const done = album.shots.filter((s) => s.status === "done").length;
  const pending = album.shots.filter((s) => s.status === "pending" || s.status === "running").length;
  const failed = album.shots.filter((s) => s.status === "failed").length;
  const tradition = album.config.tradition;

  /* -------- keep generating while the page is open */
  useEffect(() => {
    if (!album.paid || pending === 0) return;
    stop.current = false;
    let delay = 600;
    let timer: ReturnType<typeof setTimeout>;
    const tick = async () => {
      if (stop.current) return;
      if (document.visibilityState === "hidden") {
        timer = setTimeout(tick, 3000);
        return;
      }
      try {
        const res = await fetch(`/api/albums/${album.id}/advance`, { method: "POST" });
        const data = await readJson(res);
        if (data.album) setAlbum(data.album);
        if (!res.ok) {
          setError(data.error || "Generation hit a problem. Retrying shortly.");
          delay = Math.min(delay * 2, 30000);
        } else {
          setError(null);
          delay = data.busy ? 4000 : 600;
        }
        const stillPending = (data.album?.shots ?? []).some((s: Shot) => s.status === "pending" || s.status === "running");
        if (stillPending) timer = setTimeout(tick, delay);
      } catch {
        delay = Math.min(delay * 2, 30000);
        timer = setTimeout(tick, delay);
      }
    };
    timer = setTimeout(tick, 300);
    return () => {
      stop.current = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [album.id, album.paid, pending > 0]);

  /* -------- derived */
  const shots = useMemo(
    () =>
      album.shots.filter(
        (s) =>
          (filters.event === "all" || s.event === filters.event) &&
          (filters.category === "all" || s.category === filters.category) &&
          (filters.palette === "all" || s.paletteId === filters.palette) &&
          (!filters.favorites || s.favorite),
      ),
    [album.shots, filters],
  );
  // Finished images, plus images being changed (they keep showing until the new one lands).
  const viewable = shots.filter((s) => !!s.url && s.status !== "failed");

  /* -------- actions */
  const shotAction = useCallback(
    async (shot: Shot, action: "favorite" | "regenerate" | "retry" | "refine" | "use", extra?: { instruction?: string; url?: string }) => {
      setBusyShot(shot.id + action);
      setError(null);
      try {
        const res = await fetch(`/api/albums/${album.id}/shots/${shot.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, ...extra }),
        });
        const data = await readJson(res);
        if (!res.ok || !data.ok) throw new Error(data.error || "That didn't work.");
        setAlbum(data.album);
        if (action === "regenerate") track("image_regenerated");
        if (action === "refine") {
          track("image_refined");
          setRefineText("");
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "That didn't work.");
      } finally {
        setBusyShot(null);
      }
    },
    [album.id],
  );

  const share = async () => {
    setError(null);
    try {
      let url = shareUrl;
      if (!url) {
        const res = await fetch(`/api/albums/${album.id}/share`, { method: "POST" });
        const data = await readJson(res);
        if (!res.ok || !data.ok) throw new Error(data.error || "Couldn't create a link.");
        url = data.url as string;
        setShareUrl(url);
      }
      if (navigator.share) {
        await navigator.share({ title: album.title, text: "Help us choose! Heart your favorites:", url }).catch(() => {});
      } else {
        await navigator.clipboard.writeText(url);
        setNotice("Link copied. Send it to family so they can heart their favorites.");
      }
      track("album_shared");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't share.");
    }
  };

  const downloadZip = async (onlyFavorites: boolean) => {
    const list = album.shots.filter((s) => s.status === "done" && s.url && (!onlyFavorites || s.favorite));
    if (!list.length) return setError(onlyFavorites ? "Heart some images first." : "No images yet.");
    setZipping(`Preparing 0 of ${list.length}…`);
    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      let n = 0;
      for (const s of list) {
        const res = await fetch(`/api/img?u=${encodeURIComponent(s.url!)}`);
        if (!res.ok) continue;
        const blob = await res.blob();
        const ext = blob.type.includes("png") ? "png" : "jpg";
        const name = (collection ? `${String(++n).padStart(3, "0")}-${collection.name}-${collectionShot(collection, s.scene ?? 0).scene.name}` : `${String(++n).padStart(3, "0")}-${eventLabel(s.event, tradition)}-${s.category}-${getPalette(s.paletteId).name}`).replace(/[^\w-]+/g, "-");
        zip.file(`${name}.${ext}`, blob);
        setZipping(`Preparing ${n} of ${list.length}…`);
      }
      const out = await zip.generateAsync({ type: "blob" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(out);
      a.download = `${album.title.replace(/[^\w-]+/g, "-") || "mandapcanvas"}.zip`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 10000);
      track("album_downloaded", { count: list.length });
    } catch {
      setError("The download failed. Try again, or download images one at a time.");
    } finally {
      setZipping(null);
    }
  };

  const changePack = async (packId: PackId) => {
    const res = await fetch(`/api/albums/${album.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ packId }),
    });
    const data = await readJson(res);
    if (!res.ok || !data.ok) return setError(data.error || "Couldn't change the pack.");
    setAlbum(data.album);
  };

  const checkout = async (packId: PackId) => {
    setCheckingOut(true);
    setError(null);
    track("checkout_started", { pack: packId, from: "album" });
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "pack", packId, albumId: album.id }),
      });
      const data = await readJson(res);
      if (!res.ok || !data.ok) throw new Error(data.error || "Checkout failed.");
      window.location.href = data.url;
    } catch (e) {
      setCheckingOut(false);
      setError(e instanceof Error ? e.message : "Checkout failed.");
    }
  };

  /* -------- lightbox keyboard */
  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") setOpen((i) => (i === null ? i : (i + 1) % viewable.length));
      if (e.key === "ArrowLeft") setOpen((i) => (i === null ? i : (i - 1 + viewable.length) % viewable.length));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, viewable.length]);

  const isLook = !!album.config.look;
  const collection = getCollection(album.config.look?.collection);
  const venue = album.config.venuePack;
  const art = album.config.artPack;
  const artStyle = (s: Shot) => {
    const id = art?.styles[(s.scene ?? 0) % Math.max(1, art.styles.length)];
    return ART_STYLES.find((x) => x.id === id) ?? ART_STYLES[0];
  };
  // Venue and Art packs keep the shape of the customer's own photo.
  const ownAspect = venue?.aspect ?? art?.aspect;
  const venueStyle = (s: Shot) => {
    const id = venue?.styles[(s.scene ?? 0) % Math.max(1, venue.styles.length)];
    return VENUE_STYLES.find((x) => x.id === id) ?? VENUE_STYLES[0];
  };
  const caption = (s: Shot) =>
    art
      ? artStyle(s).name
      : venue
      ? `${venueStyle(s).name}, ${eventLabel(s.event, tradition).toLowerCase()}`
      : collection
      ? collectionShot(collection, s.scene ?? 0).scene.name
      : isLook
      ? `${eventLabel(s.event, tradition)}, ${s.category === "couple" ? "the two of you" : s.category}`
      : `${eventLabel(s.event, tradition)}, ${CATEGORIES.find((c) => c.id === s.category)?.name.toLowerCase()}, ${getPalette(s.paletteId).name}`;

  /* -------- unpaid Art pack */
  if (!album.paid && art) {
    const pack = PACKS[album.packId];
    return (
      <div className="mx-auto max-w-3xl px-4 pb-24 pt-8 sm:px-6">
        <h1 className="text-[2.2rem]">{album.title}</h1>
        <p className="mt-1 text-ink-soft">Your photo is saved. We&apos;ll paint it in all {art.styles.length} styles, without watermarks.</p>
        {error ? <ErrorBox msg={error} /> : null}
        <div className="mt-6 flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={art.photoUrl} alt="Your photo" className="h-28 w-[5.25rem] flex-none rounded-2xl object-cover" />
          <ul className="flex flex-wrap gap-1.5">
            {art.styles.map((id) => (
              <li key={id} className="rounded-full border border-gold/60 px-2.5 py-0.5 text-sm">
                {ART_STYLES.find((x) => x.id === id)?.name ?? id}
              </li>
            ))}
          </ul>
        </div>
        <button type="button" className="btn btn-primary mt-6" onClick={() => checkout(album.packId)} disabled={checkingOut}>
          {checkingOut ? <Loader2 size={18} className="animate-spin" /> : null}
          Paint all {pack.images} styles, {formatUSD(pack.priceCents)}
        </button>
        <p className="mt-2 text-xs text-ink-soft">{AI_LABEL}</p>
      </div>
    );
  }

  /* -------- unpaid Venue pack */
  if (!album.paid && venue) {
    const pack = PACKS[album.packId];
    const evName = VENUE_EVENTS.find((e) => e.id === venue.event)?.name ?? "event";
    return (
      <div className="mx-auto max-w-3xl px-4 pb-24 pt-8 sm:px-6">
        <h1 className="text-[2.2rem]">{album.title}</h1>
        <p className="mt-1 text-ink-soft">
          Your venue photo is saved. We&apos;ll decorate it for your {evName.toLowerCase()} in these {venue.styles.length} styles, without watermarks.
        </p>
        {error ? <ErrorBox msg={error} /> : null}
        <div className="mt-6 flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={venue.photoUrl} alt="Your venue" className="h-24 w-36 flex-none rounded-2xl object-cover" />
          <ul className="flex flex-wrap gap-1.5">
            {venue.styles.map((id) => (
              <li key={id} className="rounded-full border border-gold/60 px-2.5 py-0.5 text-sm">
                {VENUE_STYLES.find((x) => x.id === id)?.name ?? id}
              </li>
            ))}
          </ul>
        </div>
        <button type="button" className="btn btn-primary mt-6" onClick={() => checkout(album.packId)} disabled={checkingOut}>
          {checkingOut ? <Loader2 size={18} className="animate-spin" /> : null}
          Decorate my venue {pack.images} ways, {formatUSD(pack.priceCents)}
        </button>
        <p className="mt-2 text-xs text-ink-soft">{AI_LABEL}</p>
      </div>
    );
  }

  /* -------- unpaid draft */
  if (!album.paid && isLook) {
    const pack = PACKS[album.packId];
    return (
      <div className="mx-auto max-w-3xl px-4 pb-24 pt-8 sm:px-6">
        <h1 className="text-[2.2rem]">{album.title}</h1>
        <p className="mt-1 text-ink-soft">
          Your photos and choices are saved. Pick a pack: we&apos;ll create your{" "}
          {collection ? `${collection.name} portraits` : `portraits for ${album.config.events.map((e) => eventLabel(e, tradition)).join(", ")}`} without watermarks.
        </p>
        {error ? <ErrorBox msg={error} /> : null}
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {(collection ? collection.packs : LOOK_PACKS).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => (id === album.packId ? undefined : changePack(id))}
              aria-pressed={id === album.packId}
              className={`rounded-2xl border-2 bg-white p-4 text-left ${id === album.packId ? "border-kumkum" : "border-line"}`}
            >
              <span className="flex items-baseline justify-between gap-2">
                <span className="font-semibold">{PACKS[id].images} portraits</span>
                <span>
                  {PACKS[id].listCents ? <s className="mr-1.5 text-sm text-ink-soft">{formatUSD(PACKS[id].listCents!)}</s> : null}
                  <span className="font-display text-2xl">{formatUSD(PACKS[id].priceCents)}</span>
                </span>
              </span>
              <span className="text-sm text-ink-soft">{PACKS[id].blurb}</span>
            </button>
          ))}
        </div>
        <button type="button" className="btn btn-primary mt-6" onClick={() => checkout(album.packId)} disabled={checkingOut}>
          {checkingOut ? <Loader2 size={18} className="animate-spin" /> : null}
          Create my {pack.images} portraits, {formatUSD(pack.priceCents)}
        </button>
        <p className="mt-2 text-xs text-ink-soft">{AI_LABEL}</p>
      </div>
    );
  }

  if (!album.paid) {
    const pack = PACKS[album.packId];
    return (
      <div className="mx-auto max-w-5xl px-4 pb-24 pt-8 sm:px-6">
        <h1 className="text-[2.2rem]">{album.title}</h1>
        <p className="mt-1 text-ink-soft">Your free preview. Choose a pack to create the full album without watermarks.</p>
        {error ? <ErrorBox msg={error} /> : null}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {album.previews.length ? (
            album.previews.map((p) =>
              // eslint-disable-next-line @next/next/no-img-element
              p.url ? <img key={p.id} src={p.url} alt={caption(p)} className="aspect-[4/3] w-full rounded-[18px] object-cover" /> : null,
            )
          ) : (
            <p className="text-ink-soft">No preview yet. <Link className="text-kumkum underline" href="/create">Go back to the album builder</Link>.</p>
          )}
        </div>
        <p className="mt-2 text-xs text-ink-soft">{AI_LABEL}</p>
        {album.kind === "couple" ? (
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {ALBUM_PACKS.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => (id === album.packId ? undefined : changePack(id))}
                aria-pressed={id === album.packId}
                className={`rounded-2xl border-2 bg-white p-4 text-left ${id === album.packId ? "border-kumkum" : "border-line"}`}
              >
                <span className="flex items-baseline justify-between">
                  <span className="font-semibold">{PACKS[id].name}</span>
                  <span className="font-display text-2xl">{formatUSD(PACKS[id].priceCents)}</span>
                </span>
                <span className="text-sm text-ink-soft">{PACKS[id].images} images</span>
              </button>
            ))}
          </div>
        ) : null}
        <button type="button" className="btn btn-primary mt-6" onClick={() => checkout(album.packId)} disabled={checkingOut}>
          {checkingOut ? <Loader2 size={18} className="animate-spin" /> : null}
          Create my album, {formatUSD(pack.priceCents)}
        </button>
      </div>
    );
  }

  /* -------- paid album */
  const usedEvents = [...new Set(album.shots.map((s) => s.event))];
  const usedPalettes = [...new Set(album.shots.map((s) => s.paletteId))];
  const pct = album.shots.length ? Math.round((done / album.shots.length) * 100) : 0;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-8 sm:px-6">
      {album.brand ? (
        <div className="mb-4 flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {album.brand.logoUrl ? <img src={album.brand.logoUrl} alt="" className="h-10 w-10 rounded-full object-cover" /> : null}
          <span className="font-semibold" style={{ color: album.brand.accent }}>{album.brand.businessName}</span>
          <span className="text-sm text-ink-soft">Proposal{album.clientName ? ` for ${album.clientName}` : ""}</span>
        </div>
      ) : null}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[2.2rem] sm:text-[2.6rem]">{album.title}</h1>
          <p className="mt-1 text-ink-soft">
            {pending > 0 ? `${done} of ${album.shots.length} ready. Keep this page open, or come back later — we'll email you.` : `${done} images.`}{" "}
            {album.regensLeft > 0 ? `${album.regensLeft} free new versions left.` : credits ? `${credits} credits for new versions.` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-primary" onClick={share}>
            <Share2 size={18} /> {album.kind === "proposal" ? "Send to client" : "Share with family"}
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => downloadZip(false)} disabled={!!zipping || done === 0}>
            {zipping ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />} {zipping ?? "Download all"}
          </button>
          <Link className="btn btn-ghost" href={`/album/${album.id}/print`} target="_blank">
            <Printer size={18} /> Lookbook PDF
          </Link>
        </div>
      </div>

      {pending > 0 ? (
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Album progress">
          <div className="h-full rounded-full bg-kumkum transition-[width] duration-700" style={{ width: `${Math.max(4, pct)}%` }} />
        </div>
      ) : null}

      {notice && !(notice.startsWith("Payment received") && pending === 0) ? (
        <div className="mt-5 flex items-start justify-between gap-3 rounded-2xl bg-[#e8efdc] px-4 py-3 text-mehndi">
          <p>{notice}</p>
          <button type="button" aria-label="Dismiss" onClick={() => setNotice(null)}>
            <X size={18} />
          </button>
        </div>
      ) : null}
      {error ? <ErrorBox msg={error} /> : null}
      {shareUrl ? (
        <p className="mt-4 flex flex-wrap items-center gap-2 text-sm text-ink-soft">
          <Link2 size={16} /> Family link:
          <button type="button" className="font-medium text-kumkum underline underline-offset-2" onClick={() => navigator.clipboard.writeText(shareUrl).then(() => setNotice("Link copied."))}>
            {shareUrl.replace(/^https?:\/\//, "")}
          </button>
        </p>
      ) : null}

      {/* Filters */}
      <div className="mt-7 space-y-3">
        <FilterRow
          label="Event"
          value={filters.event}
          onChange={(v) => setFilters((f) => ({ ...f, event: v }))}
          options={usedEvents.map((e) => [e, eventLabel(e, tradition)])}
        />
        <FilterRow
          label="Shot"
          value={filters.category}
          onChange={(v) => setFilters((f) => ({ ...f, category: v }))}
          options={CATEGORIES.filter((c) => album.shots.some((s) => s.category === c.id)).map((c) => [c.id, c.name])}
        />
        <div className="flex flex-wrap items-center gap-2">
          {isLook ? null : <FilterRow
            label="Palette"
            value={filters.palette}
            onChange={(v) => setFilters((f) => ({ ...f, palette: v }))}
            options={usedPalettes.map((p) => [p, getPalette(p).name])}
          />}
          <button type="button" className="chip" aria-pressed={filters.favorites} onClick={() => setFilters((f) => ({ ...f, favorites: !f.favorites }))}>
            <Heart size={15} className={filters.favorites ? "fill-kumkum text-kumkum" : ""} /> Favorites
          </button>
          {filters.favorites ? (
            <button type="button" className="chip" onClick={() => downloadZip(true)}>
              <Download size={15} /> Download favorites
            </button>
          ) : null}
        </div>
      </div>

      {/* Grid */}
      <ul className="mt-6 columns-2 gap-3 sm:gap-4 md:columns-3 lg:columns-4">
        {shots.map((s) => {
          const idx = viewable.findIndex((v) => v.id === s.id);
          const portrait = isLook || s.category === "bride" || s.category === "groom";
          return (
            <li key={s.id} className="group relative mb-4 break-inside-avoid">
              <div
                className={`relative overflow-hidden rounded-[16px] bg-white ${ownAspect ? "" : portrait ? "aspect-[3/4]" : "aspect-[4/3]"}`}
                style={ownAspect ? { aspectRatio: ownAspect.replace(":", " / ") } : undefined}
              >
                {s.url && s.status !== "failed" ? (
                  <button type="button" className="relative block h-full w-full" onClick={() => setOpen(idx)} aria-label={`Open ${caption(s)}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={s.url} alt={caption(s)} className="h-full w-full object-cover" loading="lazy" />
                    {s.status !== "done" ? (
                      <span className="absolute inset-0 grid place-items-center bg-ink/45 text-sm font-semibold text-white">
                        <span className="flex items-center gap-2">
                          <Loader2 size={16} className="animate-spin" /> {s.edit ? "Applying your change…" : "Making a new version…"}
                        </span>
                      </span>
                    ) : null}
                  </button>
                ) : s.status === "failed" ? (
                  <div className="grid h-full place-items-center p-3 text-center text-sm text-ink-soft">
                    <span>
                      This one didn&apos;t work.
                      <button type="button" className="mt-2 block w-full font-semibold text-kumkum underline" onClick={() => shotAction(s, "retry")}>
                        Try again (free)
                      </button>
                    </span>
                  </div>
                ) : (
                  <div className="grid h-full animate-pulse place-items-center bg-gradient-to-br from-silk to-line/60 text-ink-soft">
                    {s.status === "running" ? <Loader2 className="animate-spin text-kumkum" /> : <Sparkles size={18} className="opacity-40" />}
                  </div>
                )}
                {s.status === "done" ? (
                  <div className="absolute right-2 top-2 flex gap-1.5">
                    {votes[s.id] ? (
                      <span className="flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-xs font-semibold text-kumkum" title="Hearts from family">
                        <Heart size={12} className="fill-kumkum" /> {votes[s.id]}
                      </span>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => shotAction(s, "favorite")}
                      aria-pressed={!!s.favorite}
                      aria-label={s.favorite ? "Remove from favorites" : "Add to favorites"}
                      className="grid h-8 w-8 place-items-center rounded-full bg-white/90"
                    >
                      <Heart size={16} className={s.favorite ? "fill-kumkum text-kumkum" : "text-ink"} />
                    </button>
                  </div>
                ) : null}
              </div>
              <div className="mt-1.5 flex items-start justify-between gap-2">
                <p className="text-[0.82rem] leading-snug text-ink-soft">{caption(s)}</p>
                {s.status === "done" ? (
                  <button
                    type="button"
                    className="flex-none text-ink-soft hover:text-kumkum disabled:opacity-40"
                    onClick={() => shotAction(s, "regenerate")}
                    disabled={busyShot === s.id + "regenerate"}
                    title="Make a new version"
                    aria-label={`Make a new version of ${caption(s)}`}
                  >
                    <RefreshCw size={15} className={busyShot === s.id + "regenerate" ? "animate-spin" : ""} />
                  </button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
      {shots.length === 0 ? <p className="mt-10 text-center text-ink-soft">Nothing matches these filters.</p> : null}
      {failed > 0 ? <p className="mt-6 text-sm text-ink-soft">{failed} image{failed > 1 ? "s" : ""} didn&apos;t work. Use &ldquo;Try again&rdquo; — it&apos;s free.</p> : null}

      {album.kind === "couple" ? (
        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 rounded-[22px] border border-line bg-silk p-6">
          <div>
            <p className="font-semibold">Want more?</p>
            <p className="text-ink-soft">Add 10 images to this album for {formatUSD(PACKS.topup.priceCents)}.</p>
          </div>
          <button type="button" className="btn btn-ghost" onClick={() => checkout("topup")} disabled={checkingOut}>
            Add 10 images
          </button>
        </div>
      ) : null}
      <p className="mt-6 text-xs text-ink-soft">{AI_LABEL}{!signedIn ? " Sign in with the email you paid with to find this album on any device." : ""}</p>

      {/* Lightbox */}
      {open !== null && viewable[open] ? (
        <div className="fixed inset-0 z-50 flex flex-col bg-ink/95 p-3 sm:p-6" role="dialog" aria-modal="true" aria-label={caption(viewable[open])}>
          <div className="flex items-center justify-between text-white">
            <p className="text-sm sm:text-base">{caption(viewable[open])}</p>
            <button type="button" aria-label="Close" className="grid h-10 w-10 place-items-center rounded-full hover:bg-white/10" onClick={() => setOpen(null)}>
              <X />
            </button>
          </div>
          <div className="relative flex min-h-0 flex-1 items-center justify-center py-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={viewable[open].url} alt={caption(viewable[open])} className={`max-h-full max-w-full rounded-lg object-contain ${viewable[open].status !== "done" ? "opacity-60" : ""}`} />
            {viewable[open].status !== "done" ? (
              <span className="absolute flex items-center gap-2 rounded-full bg-ink/80 px-4 py-2 text-sm font-semibold text-white">
                <Loader2 size={16} className="animate-spin" /> {viewable[open].edit ? `Applying: ${viewable[open].edit}` : "Making a new version…"}
              </span>
            ) : null}
            <button type="button" aria-label="Previous" className="absolute left-0 grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20" onClick={() => setOpen((i) => (i! - 1 + viewable.length) % viewable.length)}>
              <ChevronLeft />
            </button>
            <button type="button" aria-label="Next" className="absolute right-0 grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20" onClick={() => setOpen((i) => (i! + 1) % viewable.length)}>
              <ChevronRight />
            </button>
          </div>
          {(() => {
            const cur = viewable[open];
            const updating = cur.status !== "done";
            return (
              <div className="mx-auto w-full max-w-3xl space-y-3">
                {cur.made === "refine" && cur.madeNote ? <p className="text-center text-sm text-white/80">Changed: &ldquo;{cur.madeNote}&rdquo;</p> : null}
                {album.paid ? (
                  <form
                    className="flex flex-col gap-2 sm:flex-row"
                    onSubmit={(ev) => {
                      ev.preventDefault();
                      if (refineText.trim().length >= 3) void shotAction(cur, "refine", { instruction: refineText });
                    }}
                  >
                    <label className="sr-only" htmlFor="refine">Describe a change</label>
                    <input
                      id="refine"
                      className="field flex-1"
                      placeholder="Change something, e.g. “make the flowers white, keep everything else”"
                      value={refineText}
                      maxLength={300}
                      onChange={(ev) => setRefineText(ev.target.value)}
                      disabled={updating}
                    />
                    <button type="submit" className="btn btn-gold" disabled={updating || refineText.trim().length < 3 || busyShot === cur.id + "refine"}>
                      {busyShot === cur.id + "refine" || updating ? <Loader2 size={18} className="animate-spin" /> : <Wand2 size={18} />} Apply change
                    </button>
                  </form>
                ) : null}
                {album.paid && !updating ? (
                  <div className="flex flex-wrap justify-center gap-2">
                    {["Make the flowers white", "Add more greenery", "Fewer flowers, simpler", "Warmer, golden light"].map((t) => (
                      <button key={t} type="button" className="rounded-full border border-white/25 px-3 py-1 text-xs text-white/85 hover:bg-white/10" onClick={() => setRefineText(t)}>
                        {t}
                      </button>
                    ))}
                  </div>
                ) : null}
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button type="button" className="btn btn-sm bg-white text-ink" onClick={() => shotAction(cur, "favorite")}>
                    <Heart size={16} className={cur.favorite ? "fill-kumkum text-kumkum" : ""} /> {cur.favorite ? "Favorited" : "Favorite"}
                  </button>
                  <a className="btn btn-sm bg-white text-ink" href={`/api/img?u=${encodeURIComponent(cur.url!)}`} download>
                    <Download size={16} /> Download
                  </a>
                  {album.paid ? (
                    <button type="button" className="btn btn-sm bg-white/15 text-white" disabled={updating} onClick={() => shotAction(cur, "regenerate")}>
                      <RefreshCw size={16} /> Start over
                    </button>
                  ) : null}
                  {album.paid ? <span className="text-xs text-white/70">{album.regensLeft} free changes left</span> : null}
                </div>
                {cur.versions?.length ? (
                  <div className="flex items-center justify-center gap-2 overflow-x-auto pb-1">
                    <span className="flex-none text-xs text-white/70">Earlier versions</span>
                    {cur.versions.map((v) => (
                      <button
                        key={v.url}
                        type="button"
                        disabled={updating}
                        onClick={() => shotAction(cur, "use", { url: v.url })}
                        className="group relative h-14 w-20 flex-none overflow-hidden rounded-md ring-1 ring-white/30 hover:ring-2 hover:ring-gold-light"
                        title={v.note ? `Changed: ${v.note}. Click to use this version.` : "Click to use this version"}
                        aria-label="Use this earlier version"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={v.url} alt="" className="h-full w-full object-cover" />
                        <span className="absolute inset-x-0 bottom-0 bg-ink/70 py-0.5 text-[10px] text-white opacity-0 group-hover:opacity-100">Use this</span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })()}
        </div>
      ) : null}
    </div>
  );
}

function FilterRow({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][] }) {
  if (options.length < 2) return null;
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label={`Filter by ${label.toLowerCase()}`}>
      <span className="w-16 text-sm font-medium text-ink-soft">{label}</span>
      <button type="button" className="chip !min-h-9 !text-sm" aria-pressed={value === "all"} onClick={() => onChange("all")}>
        All
      </button>
      {options.map(([v, l]) => (
        <button key={v} type="button" className="chip !min-h-9 !text-sm" aria-pressed={value === v} onClick={() => onChange(v)}>
          {l}
        </button>
      ))}
    </div>
  );
}

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div role="alert" className="mt-5 flex items-start gap-3 rounded-2xl border border-kumkum/30 bg-[#fdecee] px-4 py-3 text-kumkum-deep">
      <AlertCircle className="mt-0.5 flex-none" size={18} />
      <p>{msg}</p>
    </div>
  );
}

