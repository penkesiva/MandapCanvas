import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { albumByShareToken } from "@/lib/albums";
import { kv } from "@/lib/kv";
import { eventLabel, getPalette, CATEGORIES, getTradition } from "@/lib/catalog";
import { AI_LABEL } from "@/lib/config";
import { SharedGrid } from "@/components/album/SharedGrid";

export async function generateMetadata(props: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await props.params;
  const album = await albumByShareToken(token);
  if (!album) return { title: "Album not found" };
  const cover = album.shots.find((s) => s.status === "done" && s.category === "decor")?.url;
  return {
    title: `${album.title} — help choose`,
    description: "Heart your favorite looks for the wedding.",
    robots: { index: false },
    openGraph: cover && cover.startsWith("http") ? { images: [{ url: cover }] } : undefined,
  };
}

/** Read-only album for family (or a decorator's client). Visitors can heart favorites. */
export default async function SharedAlbum(props: { params: Promise<{ token: string }> }) {
  const { token } = await props.params;
  const album = await albumByShareToken(token);
  if (!album) notFound();
  const votesRaw = await kv().hgetall(`votes:${album.id}`);
  const tradition = album.config.tradition;
  const shots = album.shots
    .filter((s) => s.status === "done" && s.url)
    .map((s) => ({
      id: s.id,
      url: s.url!,
      portrait: s.category === "bride" || s.category === "groom",
      caption: `${eventLabel(s.event, tradition)}, ${CATEGORIES.find((c) => c.id === s.category)?.name.toLowerCase()}, ${getPalette(s.paletteId).name}`,
      votes: Number(votesRaw[s.id] ?? 0),
    }));
  const brand = album.brand;
  const accent = brand?.accent ?? "#9E1B32";

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-line bg-silk">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-4 sm:px-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {brand?.logoUrl ? <img src={brand.logoUrl} alt="" className="h-10 w-10 rounded-full object-cover" /> : null}
          <span className="font-display text-2xl" style={{ color: accent }}>
            {brand?.businessName ?? "MandapCanvas"}
          </span>
          {brand?.website ? (
            <a href={brand.website.startsWith("http") ? brand.website : `https://${brand.website}`} className="ml-auto text-sm text-ink-soft underline" rel="noopener noreferrer" target="_blank">
              {brand.website.replace(/^https?:\/\//, "")}
            </a>
          ) : null}
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-20 pt-8 sm:px-6">
        <h1 className="text-[2.2rem] sm:text-[2.8rem]" style={{ color: brand ? accent : undefined }}>{album.title}</h1>
        <p className="mt-2 max-w-2xl text-ink-soft">
          {album.clientName ? `Prepared for ${album.clientName}. ` : ""}
          {getTradition(tradition).name} wedding. Tap the heart on the looks you love — {brand ? "your decorator" : "the couple"} will see your picks.
        </p>
        <SharedGrid token={token} shots={shots} />
        <p className="mt-8 text-xs text-ink-soft">{AI_LABEL}</p>
      </main>
      {!brand ? (
        <footer className="border-t border-line bg-silk">
          <p className="mx-auto max-w-6xl px-4 py-5 text-sm text-ink-soft sm:px-6">
            Planning your own wedding? <Link className="font-medium text-kumkum underline" href="/create">Make a free preview on MandapCanvas</Link>.
          </p>
        </footer>
      ) : null}
    </div>
  );
}
