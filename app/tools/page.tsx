import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/SiteChrome";
import { SectionTitle } from "@/components/Ornaments";
import { Breadcrumbs, JsonLd, breadcrumbLd } from "@/components/tools/ToolPage";
import { FREE_TOOLS } from "@/lib/tools";
import { ToolArt } from "@/components/tools/ToolArt";
import { SITE } from "@/lib/config";

export const metadata: Metadata = {
  title: "Free Desi Wedding Planning Tools",
  description:
    "Free tools for Indian and Desi weddings: see yourself as a bride or groom with AI, make a wedding invitation in 13 styles, get a palette from your outfit photo, find color palettes by event and season, match outfit colors for the bride, groom and family, and generate wedding hashtags for every event.",
  alternates: { canonical: "/tools" },
  keywords: ["free wedding planning tools", "AI bridal look", "wedding invitation maker", "Indian wedding tools", "Desi wedding planner", "Indian wedding color palette", "wedding hashtag generator", "outfit color combination"],
  openGraph: {
    title: "Free Desi Wedding Planning Tools · MandapCanvas",
    description: "AI bridal look try-on, AI wedding invitation maker, color palette finder, outfit color matcher and wedding hashtag generator for Desi weddings. Free, no sign-up.",
    url: "/tools",
  },
};

export default function ToolsPage() {
  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Free Desi wedding planning tools",
    itemListElement: FREE_TOOLS.map((t, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE.url}/tools/${t.slug}`, name: t.name })),
  };
  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-4 pb-24 pt-8 sm:px-6">
        <Breadcrumbs items={[["Home", "/"], ["Free tools", "/tools"]]} />
        <div className="mt-8">
          <SectionTitle
            title="Free tools for your Desi wedding"
            intro="Small, useful tools for the decisions every family argues about. Free, instant, and most need no sign-up."
          />
        </div>
        <ul className="mt-12 grid gap-6 md:grid-cols-2">
          {FREE_TOOLS.map((t) => (
            <li key={t.slug}>
              <Link href={`/tools/${t.slug}`} className="group block overflow-hidden rounded-[24px] border border-gold/40 bg-white transition hover:border-gold hover:shadow-[0_30px_60px_-40px_rgba(74,13,26,0.6)]">
                <ToolArt slug={t.slug} />
                <span className="block p-6">
                  <span className="block font-display text-2xl text-maroon group-hover:text-kumkum">{t.name}</span>
                  <span className="mt-2 block text-ink-soft">{t.blurb}</span>
                  <span className="mt-4 inline-block font-semibold text-kumkum underline underline-offset-4">Open the tool</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-12 flex flex-col items-center gap-3 rounded-[24px] bg-maroon p-8 text-center text-[#fff8ef]">
          <p className="font-display text-2xl text-gold-light">The big one: see your wedding before you book</p>
          <p className="max-w-xl text-[#f3e3d3]">Sketch your mandap, upload a photo or pick a style. Two photo-real previews, free.</p>
          <Link href="/create" className="btn btn-gold mt-2">
            Make a free preview
          </Link>
        </div>
      </div>
      <JsonLd data={itemList} />
      <JsonLd data={breadcrumbLd([["Home", "/"], ["Free tools", "/tools"]])} />
    </PageShell>
  );
}
