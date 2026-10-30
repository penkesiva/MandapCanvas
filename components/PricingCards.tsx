import Link from "next/link";
import { ALBUM_PACKS, PACKS, formatUSD } from "@/lib/config";

export function PricingCards() {
  return (
    <div className="grid gap-5 md:grid-cols-3">
      {ALBUM_PACKS.map((id) => {
        const p = PACKS[id];
        return (
          <div
            key={id}
            className={`relative flex flex-col rounded-[22px] border p-6 sm:p-7 ${
              p.highlight ? "border-kumkum bg-white shadow-[0_24px_48px_-28px_rgba(110,16,34,0.5)]" : "border-line bg-silk"
            }`}
          >
            {p.highlight ? (
              <span className="absolute -top-3 left-6 rounded-full bg-marigold px-3 py-0.5 text-xs font-semibold text-ink">Most couples choose this</span>
            ) : null}
            <h3 className="text-[1.75rem]">{p.name}</h3>
            <p className="mt-1 text-ink-soft">{p.blurb}</p>
            <p className="mt-5 flex items-baseline gap-2">
              <span className="font-display text-5xl">{formatUSD(p.priceCents)}</span>
              <span className="text-sm text-ink-soft">one time, {p.images} images</span>
            </p>
            <p className="mt-1 text-sm text-ink-soft">About {formatUSD(Math.round(p.priceCents / p.images))} per image</p>
            <ul className="mb-7 mt-5 space-y-2 text-[0.97rem]">
              {p.includes.map((i) => (
                <li key={i} className="flex gap-2.5">
                  <svg className="mt-1 h-4 w-4 flex-none text-mehndi" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-8 8a1 1 0 01-1.4 0l-4-4a1 1 0 111.4-1.4L8 12.6l7.3-7.3a1 1 0 011.4 0z" clipRule="evenodd" />
                  </svg>
                  {i}
                </li>
              ))}
              <li className="flex gap-2.5">
                <svg className="mt-1 h-4 w-4 flex-none text-mehndi" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-8 8a1 1 0 01-1.4 0l-4-4a1 1 0 111.4-1.4L8 12.6l7.3-7.3a1 1 0 011.4 0z" clipRule="evenodd" />
                </svg>
                {p.freeRegens} free new versions
              </li>
            </ul>
            <Link href={`/create?pack=${id}`} className={`btn mt-auto ${p.highlight ? "btn-primary" : "btn-ghost"}`}>
              Start with a free preview
            </Link>
          </div>
        );
      })}
    </div>
  );
}
