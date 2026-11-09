import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/SiteChrome";
import { DECOR_PRESETS, SAMPLES, STYLE_TIERS } from "@/lib/catalog";
import { Divider, SectionTitle } from "@/components/Ornaments";
import { AI_LABEL } from "@/lib/config";

export const metadata: Metadata = {
  alternates: { canonical: "/gallery" },
  title: "Gallery: Desi wedding decor and outfit ideas",
  description:
    "Mandap, Haldi, Mehndi, Sangeet, Anand Karaj, Nikah, Muhurtham and reception decor ideas, with bride and groom looks matched to each palette.",
};

export default function Gallery() {
  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-4 pb-24 pt-12 sm:px-6">
        <div className="text-center">
          <Divider />
          <h1 className="mt-4 text-[2.8rem] text-maroon sm:text-[3.4rem]">Gallery</h1>
          <p className="mx-auto mt-3 max-w-2xl text-lg text-ink-soft">
            Images from MandapCanvas albums across traditions and events. Yours start from your own sketch, photo or style.
          </p>
        </div>

        <SectionTitle className="mt-16" title="Mandap styles" intro="From a simple garden frame to a ceiling of flowers. Tap one to start your album from it." />
        <div className="mt-10 space-y-12">
          {STYLE_TIERS.map((t) => (
            <div key={t.id}>
              <p className="mb-4 flex items-baseline gap-3">
                <span className="font-display text-2xl text-maroon">{t.name}</span>
                <span className="text-sm text-ink-soft">{t.note}</span>
              </p>
              <ul className="grid gap-5 sm:grid-cols-3">
                {DECOR_PRESETS.filter((p) => p.tier === t.id).map((p) => (
                  <li key={p.id}>
                    <Link href={`/create?style=${p.id}`} className="group block rounded-[20px] border border-gold/40 bg-white p-1.5 transition hover:border-gold">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.image} alt={`${p.name} mandap`} className="aspect-[4/3] w-full rounded-[15px] object-cover" loading="lazy" />
                      <span className="block px-3 py-3">
                        <span className="block font-display text-xl group-hover:text-kumkum">{p.name}</span>
                        <span className="block text-sm text-ink-soft">{p.description}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <SectionTitle className="mt-20" title="Every event, every look" />
        <ul className="mt-10 columns-1 gap-5 sm:columns-2 lg:columns-3">
          {SAMPLES.map((s) => (
            <li key={s.src} className="mb-5 break-inside-avoid">
              <figure className="overflow-hidden rounded-[20px] border border-gold/40 bg-white p-1.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.src} alt={`${s.event}, ${s.palette}`} className="w-full rounded-[15px]" loading="lazy" />
                <figcaption className="px-4 py-3">
                  <span className="font-display text-xl">{s.event}</span>
                  <span className="block text-sm text-ink-soft">
                    {s.tradition}, {s.palette}
                  </span>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
        <p className="text-xs text-ink-soft">{AI_LABEL}</p>
        <div className="mt-10 text-center">
          <Link href="/create" className="btn btn-primary">Make your free preview</Link>
        </div>
      </div>
    </PageShell>
  );
}
