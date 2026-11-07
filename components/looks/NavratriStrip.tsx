import { LOOK_COLLECTIONS } from "@/lib/lookCollections";

/** The nine Navratri example portraits in a row, each with its day and color. Swipes sideways on phones. */
export function NavratriStrip({ dark = false }: { dark?: boolean }) {
  const days = LOOK_COLLECTIONS.navratri.scenes;
  return (
    <ol className="-mx-4 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:-mx-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-9 lg:gap-2 lg:overflow-visible lg:px-0 [&::-webkit-scrollbar]:hidden">
      {days.map((d, i) => {
        const [day, color] = d.name.split(" · ");
        return (
          <li key={d.name} className="w-[38vw] max-w-[180px] flex-none snap-start lg:w-auto lg:max-w-none">
            <figure className="overflow-hidden rounded-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/samples/navratri/day-${i + 1}.jpg`}
                alt={`${day}: the same woman in a ${color.toLowerCase()} saree`}
                className="aspect-[3/4] w-full object-cover"
                loading="lazy"
              />
              <figcaption className="flex items-center gap-1.5 px-0.5 pt-2 text-[13px] leading-tight">
                <span className="h-2.5 w-2.5 flex-none rounded-full ring-1 ring-black/15" style={{ background: d.hex }} aria-hidden="true" />
                <span className={dark ? "text-[#f3e3d3]" : "text-ink"}>
                  <span className="font-semibold">{day}</span> <span className={dark ? "text-[#cdb6a8]" : "text-ink-soft"}>{color}</span>
                </span>
              </figcaption>
            </figure>
          </li>
        );
      })}
    </ol>
  );
}
