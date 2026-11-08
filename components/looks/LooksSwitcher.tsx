import Link from "next/link";
import { PACKS, formatUSD } from "@/lib/config";

type Path = "/looks" | "/looks/maharani" | "/looks/navratri" | "/tools/wedding-art-portrait";

const CARDS: { href: Path; name: string; line: string; price: string; photos: string[] }[] = [
  {
    href: "/looks",
    name: "Wedding",
    line: "Bride, groom or couple, at every event.",
    price: `Try free · from ${formatUSD(PACKS.look12.priceCents)}`,
    photos: ["/samples/look-after.jpg", "/samples/look-groom-after.jpg", "/samples/look-couple-after.jpg"],
  },
  {
    href: "/looks/maharani",
    name: "Maharani",
    line: "Heritage silk sarees at palaces and temples.",
    price: `${PACKS.maharani12.images} portraits · ${formatUSD(PACKS.maharani12.priceCents)}`,
    photos: ["/samples/maharani/scene-1.jpg", "/samples/maharani/scene-3.jpg", "/samples/maharani/scene-4.jpg"],
  },
  {
    href: "/looks/navratri",
    name: "Navratri",
    line: "Nine days, nine saree colors.",
    price: `${PACKS.navratri9.images} portraits · ${formatUSD(PACKS.navratri9.priceCents)}`,
    photos: ["/samples/navratri/day-1.jpg", "/samples/navratri/day-4.jpg", "/samples/navratri/day-6.jpg"],
  },
  {
    href: "/tools/wedding-art-portrait",
    name: "Art portraits",
    line: "Anime, 80s, Tanjore and 7 more styles.",
    price: `All ${PACKS.art10.images} · ${formatUSD(PACKS.art10.priceCents)}`,
    photos: ["/samples/art/anime.jpg", "/samples/art/eighties.jpg", "/samples/art/tanjore.jpg"],
  },
];

/** The Looks collections and Art portraits as picture cards, in the style of the share images. Swipes on phones. */
export function LooksSwitcher({ current }: { current: Path }) {
  return (
    <nav aria-label="Looks collections">
      <ul className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:-mx-6 sm:px-6 md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 xl:grid-cols-4 [&::-webkit-scrollbar]:hidden">
        {CARDS.map((c) => {
          const on = c.href === current;
          return (
            <li key={c.href} className="w-[82%] max-w-sm flex-none snap-start md:w-auto md:max-w-none">
              <Link
                href={c.href}
                aria-current={on ? "page" : undefined}
                className={`group relative block h-36 overflow-hidden rounded-[20px] bg-[#2a0b14] transition ${
                  on ? "ring-[3px] ring-gold" : "ring-1 ring-black/5 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_-18px_rgba(42,11,20,0.8)]"
                }`}
              >
                <span className="absolute inset-y-0 right-0 flex w-[58%] gap-0.5" aria-hidden="true">
                  {c.photos.map((src) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={src} src={src} alt="" className="h-full min-w-0 flex-1 object-cover object-top" loading="lazy" />
                  ))}
                </span>
                <span className="absolute inset-0 bg-[linear-gradient(90deg,#2a0b14_0%,#2a0b14_42%,rgba(42,11,20,0.55)_58%,rgba(42,11,20,0)_80%)]" aria-hidden="true" />
                <span className="relative flex h-full max-w-[62%] flex-col justify-center px-4 pt-3">
                  <span className="font-display text-[1.6rem] leading-tight text-[#fff8ef]">{c.name}</span>
                  <span className="mt-1 text-[13px] leading-snug text-[#f3e3d3]">{c.line}</span>
                  <span className="mt-2.5 w-max rounded-full bg-[linear-gradient(#f2d98c,#c9a24b)] px-2.5 py-0.5 text-xs font-semibold text-[#3b0a15]">{c.price}</span>
                </span>
                {on ? (
                  <span className="absolute left-4 top-2.5 rounded-full bg-gold px-2 py-0.5 text-[10px] font-semibold leading-tight text-maroon-deep">You&apos;re here</span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
