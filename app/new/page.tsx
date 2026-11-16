import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/SiteChrome";
import { PACKS, formatUSD, type PackId } from "@/lib/config";

export const metadata: Metadata = {
  title: "What would you like to make?",
  description: "Wedding looks, Maharani and Navratri saree portraits, art portraits, mandap designs and your venue decorated, all from your own photos.",
  alternates: { canonical: "/new" },
};

interface Choice {
  href: string;
  title: string;
  text: string;
  img: string;
  pack: PackId;
  /** Free to try before paying. */
  free: string;
}

const PEOPLE: Choice[] = [
  {
    href: "/looks",
    title: "Wedding looks",
    text: "See yourself as a bride, groom or couple at every event, Haldi to reception.",
    img: "/samples/look-after.jpg",
    pack: "look12",
    free: "Try one look free",
  },
  {
    href: "/looks/maharani",
    title: "Maharani portraits",
    text: "Heritage silk sarees at palaces and temples, from your own photo.",
    img: "/samples/maharani/scene-1.jpg",
    pack: "maharani12",
    free: "See examples first",
  },
  {
    href: "/looks/navratri",
    title: "Navratri portraits",
    text: "Nine days, nine saree colors, at the temple, the lawn and garba night.",
    img: "/samples/navratri/day-1.jpg",
    pack: "navratri9",
    free: "See examples first",
  },
  {
    href: "/tools/wedding-art-portrait",
    title: "Art portraits",
    text: "Your photo as anime, 80s retro, Mughal, Tanjore, a Bollywood poster and more.",
    img: "/samples/art/anime.jpg",
    pack: "art10",
    free: "One style free",
  },
];

const DECOR: Choice[] = [
  {
    href: "/create",
    title: "Mandap and decor album",
    text: "Sketch it, upload a photo or pick a style. See every event's decor photo-real.",
    img: "/samples/hero-after.jpg",
    pack: "starter",
    free: "Two previews free",
  },
  {
    href: "/tools/ai-venue-decor-visualizer",
    title: "Your venue, decorated",
    text: "Upload your hall or backyard and see it dressed for your wedding.",
    img: "/samples/venue-after.jpg",
    pack: "venue9",
    free: "Try it free",
  },
];

function Card({ c }: { c: Choice }) {
  return (
    <li>
      <Link href={c.href} className="group flex h-full flex-col overflow-hidden rounded-[22px] border border-line bg-white transition hover:-translate-y-0.5 hover:border-gold hover:shadow-lg">
        <div className="aspect-[16/9] overflow-hidden bg-silk sm:aspect-[4/3]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={c.img} alt="" className="h-full w-full object-cover object-top transition duration-500 group-hover:scale-[1.03]" loading="lazy" />
        </div>
        <div className="flex flex-1 flex-col p-5">
          <h3 className="text-[1.45rem]">{c.title}</h3>
          <p className="mt-1.5 flex-1 text-ink-soft">{c.text}</p>
          <p className="mt-4 flex items-center justify-between gap-3 text-sm">
            <span className="font-semibold text-mehndi">{c.free}</span>
            <span className="text-ink-soft">from {formatUSD(PACKS[c.pack].priceCents)}</span>
          </p>
        </div>
      </Link>
    </li>
  );
}

export default function NewPage() {
  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-4 pb-24 pt-10 sm:px-6">
        <h1 className="text-[2.2rem] sm:text-[2.8rem]">What would you like to make?</h1>
        <p className="mt-2 max-w-2xl text-ink-soft">Everything starts from your own photos. Try it free, then pick a pack for the full set without watermarks.</p>

        <h2 className="mt-10 text-[1.6rem]">You, in every look</h2>
        <ul className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PEOPLE.map((c) => (
            <Card key={c.href} c={c} />
          ))}
        </ul>

        <h2 className="mt-12 text-[1.6rem]">Your decor and venue</h2>
        <ul className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {DECOR.map((c) => (
            <Card key={c.href} c={c} />
          ))}
        </ul>
      </div>
    </PageShell>
  );
}
