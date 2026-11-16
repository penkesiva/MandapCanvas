import { Check, Clapperboard } from "lucide-react";
import { PACKS, formatUSD, type PackId } from "@/lib/config";

/**
 * "What you get for $4.99": the pack's portraits plus a ready-to-post Instagram Reel, shown playing in a phone.
 * The reels in public/samples/reels were made with the album Reel Maker from the site's sample portraits.
 */
export function ReelShowcase({
  reel,
  pack: packId,
  unit,
  orderHref = "#order",
  cta = "Try it free",
}: {
  reel: "navratri" | "maharani" | "art";
  pack: PackId;
  /** What each image is, e.g. "portraits, one for each day". */
  unit: string;
  orderHref?: string;
  cta?: string;
}) {
  const pack = PACKS[packId];
  const items = [
    `${pack.images} ${unit}, no watermark`,
    "An Instagram Reel of them, made in one click",
    "4 transition styles; pick the length and the opening line",
    "A private album to share with family",
    `${pack.freeRegens} free redos if one isn't right`,
  ];
  return (
    <section className="overflow-hidden rounded-[28px] bg-maroon text-[#fff8ef]" aria-labelledby={`get-${reel}`}>
      <div className="grid items-center gap-8 p-6 sm:p-10 md:grid-cols-[1fr_auto] md:gap-12">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-gold-light">
            <Clapperboard size={16} aria-hidden="true" /> Reel included
          </p>
          <h2 id={`get-${reel}`} className="mt-2 text-[2rem] leading-tight text-[#fff8ef] sm:text-[2.6rem]">
            What you get for {formatUSD(pack.priceCents)}
          </h2>
          <p className="mt-2 max-w-lg text-[#f3e3d3]">Your portraits, plus a ready-to-post Reel for Instagram or YouTube Shorts. Add a trending sound and share.</p>
          <ul className="mt-6 space-y-2.5">
            {items.map((t) => (
              <li key={t} className="flex gap-3">
                <span className="mt-0.5 grid h-6 w-6 flex-none place-items-center rounded-full bg-gold-light text-maroon-deep">
                  <Check size={15} strokeWidth={3} aria-hidden="true" />
                </span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
          <a href={orderHref} className="btn btn-gold mt-8">
            {cta}
          </a>
        </div>
        <figure className="mx-auto w-[230px] sm:w-[260px]">
          <div className="rounded-[38px] bg-[#1a0509] p-2.5 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.7)] ring-1 ring-gold/40">
            <video
              src={`/samples/reels/${reel}.mp4`}
              poster={`/samples/reels/${reel}.jpg`}
              className="aspect-[9/16] w-full rounded-[30px] bg-black object-cover"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              aria-label="A sample Reel made with MandapCanvas"
            />
          </div>
          <figcaption className="mt-3 text-center text-xs text-[#f3e3d3]">A sample Reel, made in one click from an album.</figcaption>
        </figure>
      </div>
    </section>
  );
}
