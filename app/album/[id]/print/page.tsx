import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { anonId, currentUser } from "@/lib/auth";
import { canEdit, getAlbum } from "@/lib/albums";
import { CATEGORIES, eventLabel, getPalette, getTradition } from "@/lib/catalog";
import { AI_LABEL, SITE } from "@/lib/config";
import { ART_STYLES } from "@/lib/artStyles";
import { VENUE_STYLES } from "@/lib/venueDecor";
import { collectionShot, getCollection } from "@/lib/lookCollections";
import { Divider, Mandala } from "@/components/Ornaments";
import { PrintButton } from "@/components/album/PrintButton";
import type { Album, EventId, Shot } from "@/lib/types";

export const metadata: Metadata = { title: "Lookbook", robots: { index: false } };

/**
 * The lookbook: a cover, a spread per event and a closing page, laid out as letter-landscape sheets.
 * On screen the sheets sit on a table; "Save as PDF" prints them edge to edge.
 */
export default async function PrintPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const [album, user, anon] = await Promise.all([getAlbum(id), currentUser(), anonId(false)]);
  if (!album || !canEdit(album, user, anon)) notFound();

  const done = album.shots.filter((s) => s.status === "done" && s.url);
  const favorites = done.filter((s) => s.favorite);
  const shots = favorites.length >= 6 ? favorites : done;
  const byEvent = new Map<EventId, Shot[]>();
  for (const s of shots) byEvent.set(s.event, [...(byEvent.get(s.event) ?? []), s]);
  const single = !!(album.config.artPack || album.config.venuePack || album.config.look);
  const groups: [string, Shot[]][] = single ? [[sectionName(album), shots]] : [...byEvent.entries()].map(([e, l]) => [eventLabel(e, album.config.tradition), l]);
  const tradition = getTradition(album.config.tradition);
  const brand = album.brand;
  const accent = brand?.accent ?? "#9E1B32";
  const portrait = isPortrait(album);
  const cover = (favorites[0] ?? done.find((s) => s.category === "decor") ?? done[0])?.url;
  const number = new Map(shots.map((s, i) => [s.id, i + 1]));
  const made = new Date(album.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "America/Los_Angeles" });
  const subtitle = album.config.artPack
    ? "Art portrait"
    : album.config.venuePack
      ? "Venue"
      : album.config.look
        ? (getCollection(album.config.look.collection)?.name ?? "Wedding looks")
        : `${tradition.name} wedding`;

  return (
    <div className="lookbook min-h-screen bg-[#e9e1da] text-ink">
      <style>{`
        @page { size: letter landscape; margin: 0; }
        .sheet { width: 11in; height: 8.5in; }
        @media print {
          .lookbook { background: white !important; }
          .sheet { margin: 0 !important; box-shadow: none !important; border-radius: 0 !important; break-after: page; }
          .sheet:last-child { break-after: auto; }
        }
        @media screen and (max-width: 1100px) {
          .sheet { width: 100%; height: auto; aspect-ratio: 11 / 8.5; }
        }
      `}</style>

      <div className="no-print sticky top-0 z-10 border-b border-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[11in] flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-4">
            <Link href={`/album/${album.id}`} className="text-sm font-medium text-kumkum underline underline-offset-2">
              Back to the album
            </Link>
            <p className="text-sm text-ink-soft">
              {favorites.length >= 6
                ? `Your ${favorites.length} favorites.`
                : `All ${done.length} images. Heart 6 or more in the album for a favorites-only lookbook.`}
            </p>
          </div>
          <PrintButton />
        </div>
      </div>

      <div className="mx-auto flex max-w-[11in] flex-col gap-8 px-4 py-8 print:gap-0 print:p-0">
        {/* cover */}
        <section className="sheet relative mx-auto grid overflow-hidden rounded-md bg-white shadow-[0_30px_60px_-30px_rgba(42,11,20,0.45)] [grid-template-columns:58%_42%]">
          <div className="relative h-full overflow-hidden bg-silk">
            {cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cover} alt="" className="absolute inset-0 h-full w-full object-cover" />
            ) : null}
          </div>
          <div className="relative flex h-full flex-col justify-between overflow-hidden bg-[#fbf5ef] px-[0.6in] py-[0.55in]">
            <Mandala className="pointer-events-none absolute -right-24 -top-24 h-72 w-72" color={accent} opacity={0.1} />
            <div className="relative flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {brand?.logoUrl ? <img src={brand.logoUrl} alt="" className="h-10 w-10 rounded-full object-cover" /> : null}
              <span className="font-display text-xl" style={{ color: accent }}>
                {brand?.businessName ?? "MandapCanvas"}
              </span>
            </div>
            <div className="relative">
              <p className="text-sm text-ink-soft">{subtitle} lookbook</p>
              <h1 className="mt-2 text-[2.9rem] leading-[1.05]" style={{ color: accent }}>
                {album.title}
              </h1>
              {album.clientName ? <p className="mt-3 text-lg">Prepared for {album.clientName}</p> : null}
              <Divider className="my-6 w-48" />
              {!single ? (
                <p className="text-ink-soft">{album.config.events.map((e) => eventLabel(e, album.config.tradition)).join(" · ")}</p>
              ) : null}
              {!album.config.artPack && !album.config.look ? (
                <div className="mt-5 space-y-2.5">
                  {album.config.palettes.map((p) => {
                    const pal = getPalette(p);
                    return (
                      <div key={p} className="flex items-center gap-2">
                        {pal.swatches.map((c) => (
                          <span key={c} className="h-6 w-6 rounded-full ring-1 ring-black/10" style={{ background: c }} />
                        ))}
                        <span className="ml-1 text-sm font-medium">{pal.name}</span>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
            <div className="relative flex items-end justify-between gap-4 border-t border-gold/40 pt-4 text-sm">
              <span>
                <span className="font-display text-2xl" style={{ color: accent }}>
                  {shots.length}
                </span>{" "}
                <span className="text-ink-soft">{shots.length === 1 ? "design" : "designs"}</span>
              </span>
              <span className="text-ink-soft">{made}</span>
            </div>
          </div>
        </section>

        {/* spreads: three images a sheet, the first one large */}
        {groups.map(([name, list]) =>
          chunk(list, 3).map((page, pi) => (
            <section key={`${name}-${pi}`} className="sheet relative mx-auto flex flex-col overflow-hidden rounded-md bg-white px-[0.5in] pb-[0.4in] pt-[0.45in] shadow-[0_30px_60px_-30px_rgba(42,11,20,0.45)]">
              <header className="mb-4 flex items-end justify-between gap-4 border-b border-gold/40 pb-3">
                <h2 className="text-[1.9rem] leading-none" style={{ color: accent }}>
                  {name}
                </h2>
                <span className="text-sm text-ink-soft">
                  {list.length > 3 ? `${pi * 3 + 1}–${Math.min(list.length, pi * 3 + 3)} of ${list.length}` : `${list.length} ${list.length === 1 ? "design" : "designs"}`}
                </span>
              </header>
              <div className={`grid min-h-0 flex-1 gap-3 ${layout(page.length, portrait)}`}>
                {page.map((s, i) => (
                  <figure key={s.id} className={`relative min-h-0 overflow-hidden rounded-lg bg-silk ${cell(page.length, i, portrait)}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={s.url} alt="" className="absolute inset-0 h-full w-full object-cover" />
                    <figcaption className="absolute inset-x-0 bottom-0 flex items-baseline gap-2 bg-gradient-to-t from-black/70 to-transparent px-3 pb-2 pt-8 text-white">
                      <span className="font-display text-lg leading-none text-gold-light">{String(number.get(s.id)).padStart(2, "0")}</span>
                      <span className="text-xs leading-tight text-white/90">{caption(album, s)}</span>
                    </figcaption>
                  </figure>
                ))}
              </div>
              <footer className="mt-3 flex justify-between text-[10px] text-ink-soft">
                <span>{album.title}</span>
                <span>{brand?.businessName ?? "MandapCanvas"}</span>
              </footer>
            </section>
          )),
        )}

        {/* closing */}
        <section className="sheet relative mx-auto flex flex-col items-center justify-center overflow-hidden rounded-md bg-[#fbf5ef] px-[1in] text-center shadow-[0_30px_60px_-30px_rgba(42,11,20,0.45)]">
          <Mandala className="pointer-events-none absolute left-1/2 top-1/2 h-[6in] w-[6in] -translate-x-1/2 -translate-y-1/2" color={accent} opacity={0.07} />
          <p className="relative font-display text-[2.4rem]" style={{ color: accent }}>
            {brand ? `With love, ${brand.businessName}` : "Made for your celebration"}
          </p>
          <Divider className="relative my-6 w-56" />
          <p className="relative max-w-md text-ink-soft">
            {brand
              ? [brand.website, brand.phone].filter(Boolean).join(" · ") || "Talk to us about bringing these to life."
              : "Show these to your decorator and family. Every design was made for you on MandapCanvas."}
          </p>
          <p className="relative mt-10 text-xs text-ink-soft">
            {AI_LABEL} {brand ? "" : new URL(SITE.url).host}
          </p>
        </section>
      </div>
    </div>
  );
}

function sectionName(album: Album): string {
  if (album.config.artPack) return "Your art portraits";
  if (album.config.venuePack) return "Your venue";
  const c = getCollection(album.config.look?.collection);
  return c ? `${c.name} portraits` : "Your looks";
}

function isPortrait(album: Album): boolean {
  const own = album.config.artPack?.aspect ?? album.config.venuePack?.aspect;
  if (own) return own === "3:4" || own === "9:16";
  return !!album.config.look;
}

function caption(album: Album, s: Shot): string {
  const art = album.config.artPack;
  if (art) return ART_STYLES.find((x) => x.id === art.styles[(s.scene ?? 0) % art.styles.length])?.name ?? "";
  const venue = album.config.venuePack;
  if (venue) return VENUE_STYLES.find((x) => x.id === venue.styles[(s.scene ?? 0) % venue.styles.length])?.name ?? "";
  const c = getCollection(album.config.look?.collection);
  if (c) return collectionShot(c, s.scene ?? 0).scene.name;
  return `${CATEGORIES.find((x) => x.id === s.category)?.name ?? ""}, ${getPalette(s.paletteId).name}`;
}

/** Landscape images: one large on the left, two stacked on the right. Portraits: three side by side. */
function layout(n: number, portrait: boolean): string {
  if (portrait) return n === 1 ? "grid-cols-1" : n === 2 ? "grid-cols-2" : "grid-cols-3";
  if (n === 1) return "grid-cols-1";
  return "grid-cols-[1.9fr_1fr] grid-rows-2";
}

function cell(n: number, i: number, portrait: boolean): string {
  if (portrait || n === 1) return portrait && n === 1 ? "mx-auto aspect-[3/4] h-full" : "";
  if (i === 0) return "row-span-2";
  return n === 2 ? "row-span-2" : "";
}

function chunk<T>(arr: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}
