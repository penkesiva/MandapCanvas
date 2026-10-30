import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { anonId, currentUser } from "@/lib/auth";
import { canEdit, getAlbum } from "@/lib/albums";
import { CATEGORIES, eventLabel, getPalette, getTradition } from "@/lib/catalog";
import { AI_LABEL } from "@/lib/config";
import { PrintButton } from "@/components/album/PrintButton";
import type { EventId } from "@/lib/types";

export const metadata: Metadata = { title: "Lookbook", robots: { index: false } };

/** Print-optimized lookbook. "Save as PDF" from the browser's print dialog. */
export default async function PrintPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const [album, user, anon] = await Promise.all([getAlbum(id), currentUser(), anonId(false)]);
  if (!album || !canEdit(album, user, anon)) notFound();

  const done = album.shots.filter((s) => s.status === "done" && s.url);
  const favorites = done.filter((s) => s.favorite);
  const shots = favorites.length >= 6 ? favorites : done;
  const byEvent = new Map<EventId, typeof shots>();
  for (const s of shots) byEvent.set(s.event, [...(byEvent.get(s.event) ?? []), s]);
  const tradition = getTradition(album.config.tradition);
  const brand = album.brand;
  const accent = brand?.accent ?? "#9E1B32";

  return (
    <div className="bg-white text-ink">
      <style>{`@page { size: letter landscape; margin: 0.4in; } .page { break-after: page; }`}</style>
      <div className="no-print sticky top-0 z-10 flex items-center justify-between border-b border-line bg-white px-6 py-3">
        <p className="text-sm text-ink-soft">
          {favorites.length >= 6 ? `Showing your ${favorites.length} favorites.` : `Showing all ${done.length} images. Heart 6 or more to make a favorites-only lookbook.`}
        </p>
        <PrintButton />
      </div>

      <section className="page flex min-h-[7.5in] flex-col justify-between p-10">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {brand?.logoUrl ? <img src={brand.logoUrl} alt="" className="h-12 w-12 rounded-full object-cover" /> : null}
          <span className="font-display text-2xl" style={{ color: accent }}>{brand?.businessName ?? "MandapCanvas"}</span>
        </div>
        <div>
          <h1 className="text-6xl" style={{ color: accent }}>{album.title}</h1>
          <p className="mt-4 text-xl text-ink-soft">
            {album.clientName ? `Prepared for ${album.clientName}. ` : ""}
            {tradition.name} wedding: {album.config.events.map((e) => eventLabel(e, album.config.tradition)).join(", ")}.
          </p>
          <div className="mt-8 flex flex-wrap gap-6">
            {album.config.palettes.map((p) => {
              const pal = getPalette(p);
              return (
                <div key={p} className="flex items-center gap-2">
                  {pal.swatches.map((c) => (
                    <span key={c} className="h-8 w-8 rounded-full border border-line" style={{ background: c }} />
                  ))}
                  <span className="ml-1 font-medium">{pal.name}</span>
                </div>
              );
            })}
          </div>
        </div>
        <p className="text-xs text-ink-soft">
          {AI_LABEL}
          {brand?.website ? ` ${brand.website}` : ""}
          {brand?.phone ? ` ${brand.phone}` : ""}
        </p>
      </section>

      {[...byEvent.entries()].map(([event, list]) =>
        chunk(list, 4).map((group, gi) => (
          <section key={`${event}-${gi}`} className="page p-8">
            <h2 className="mb-4 text-3xl" style={{ color: accent }}>
              {eventLabel(event, album.config.tradition)}
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {group.map((s) => (
                <figure key={s.id}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.url} alt="" className="aspect-[4/3] w-full rounded-lg object-cover" />
                  <figcaption className="mt-1 text-xs text-ink-soft">
                    {CATEGORIES.find((c) => c.id === s.category)?.name}, {getPalette(s.paletteId).name}
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
        )),
      )}
    </div>
  );
}

function chunk<T>(arr: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}
