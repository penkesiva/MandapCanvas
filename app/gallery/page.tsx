import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/SiteChrome";
import { SAMPLES } from "@/lib/catalog";
import { AI_LABEL } from "@/lib/config";

export const metadata: Metadata = {
  title: "Gallery: Desi wedding decor and outfit ideas",
  description:
    "Mandap, Haldi, Mehndi, Sangeet, Anand Karaj, Nikah, Muhurtham and reception decor ideas, with bride and groom looks matched to each palette.",
};

export default function Gallery() {
  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-4 pb-24 pt-12 sm:px-6">
        <h1 className="text-[2.6rem] sm:text-[3.2rem]">Gallery</h1>
        <p className="mt-3 max-w-2xl text-lg text-ink-soft">
          A few images from MandapCanvas albums across traditions and events. Yours start from your own sketch, photo or style.
        </p>
        <ul className="mt-10 columns-1 gap-5 sm:columns-2 lg:columns-3">
          {SAMPLES.map((s) => (
            <li key={s.src} className="mb-5 break-inside-avoid">
              <figure className="overflow-hidden rounded-[20px] bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.src} alt={`${s.event}, ${s.palette}`} className="w-full" loading="lazy" />
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
