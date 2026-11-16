import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/SiteChrome";
import { PRODUCTS, fromPrice, type Product } from "@/lib/products";

export const metadata: Metadata = {
  title: "What would you like to make?",
  description: "Wedding looks, Maharani and Navratri saree portraits, art portraits, mandap designs and your venue decorated, all from your own photos.",
  alternates: { canonical: "/new" },
};

function Card({ c }: { c: Product }) {
  return (
    <li>
      <Link href={c.start ?? c.href} className="group flex h-full flex-col overflow-hidden rounded-[22px] border border-line bg-white transition hover:-translate-y-0.5 hover:border-gold hover:shadow-lg">
        <div className="aspect-[4/3] overflow-hidden bg-silk sm:aspect-[4/5]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={c.img} alt="" className="h-full w-full object-cover object-top transition duration-500 group-hover:scale-[1.03]" loading="lazy" />
        </div>
        <div className="flex flex-1 flex-col p-4">
          <h3 className="text-[1.3rem] leading-tight">{c.name}</h3>
          <p className="mt-1 flex-1 text-[0.95rem] leading-snug text-ink-soft">{c.line}</p>
          <p className="mt-3 flex items-center justify-between gap-3 text-sm">
            <span className="font-semibold text-mehndi">Try it free</span>
            <span className="text-ink-soft">from {fromPrice(c)}</span>
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
          {PRODUCTS.filter((p) => p.group === "you").map((c) => (
            <Card key={c.href} c={c} />
          ))}
        </ul>

        <h2 className="mt-12 text-[1.6rem]">Your decor and venue</h2>
        <ul className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PRODUCTS.filter((p) => p.group === "decor").map((c) => (
            <Card key={c.href} c={c} />
          ))}
        </ul>
      </div>
    </PageShell>
  );
}
