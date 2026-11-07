import Link from "next/link";
import { PACKS, formatUSD } from "@/lib/config";
import { LOOK_COLLECTIONS } from "@/lib/lookCollections";

/** Links to the Maharani and Navratri collections, with each one's colors as a strip. */
export function MoreLooks({ heading = "More ways to see yourself" }: { heading?: string }) {
  const items = [
    { c: LOOK_COLLECTIONS.maharani, line: "Heritage silk sarees at palaces and temples.", from: PACKS.maharani12 },
    { c: LOOK_COLLECTIONS.navratri, line: "Nine days, nine saree colors, at a temple, lawn or garba night.", from: PACKS.navratri9 },
  ];
  return (
    <section className="mt-14" aria-labelledby="more-looks-h">
      <h2 id="more-looks-h" className="text-[1.8rem]">
        {heading}
      </h2>
      <ul className="mt-5 grid gap-4 sm:grid-cols-2">
        {items.map(({ c, line, from }) => (
          <li key={c.id} className="flex">
            <Link href={c.path} className="group flex w-full flex-col overflow-hidden rounded-[20px] border border-gold/40 bg-white transition hover:border-gold">
              {c.id === "navratri" ? (
                <span className="grid grid-cols-5 gap-0.5 bg-white" aria-hidden="true">
                  {[1, 3, 4, 6, 8].map((d) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={d} src={`/samples/navratri/day-${d}.jpg`} alt="" className="aspect-[3/4] w-full object-cover object-top" loading="lazy" />
                  ))}
                </span>
              ) : (
                <span className="flex h-16" aria-hidden="true">
                  {c.scenes.slice(0, 9).map((s) => (
                    <span key={s.name} className="flex-1" style={{ background: s.hex }} />
                  ))}
                </span>
              )}
              <span className="flex flex-1 flex-col p-5">
                <span className="font-display text-2xl text-maroon group-hover:text-kumkum">{c.name} portraits</span>
                <span className="mt-1 text-ink-soft">{line}</span>
                <span className="mt-auto flex items-center justify-between pt-4 text-sm">
                  <span className="text-ink-soft">
                    {from.images} portraits, {formatUSD(from.priceCents)}
                  </span>
                  <span className="font-semibold text-kumkum underline underline-offset-4">See the looks</span>
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
