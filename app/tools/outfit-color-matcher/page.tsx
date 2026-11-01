import type { Metadata } from "next";
import { PageShell } from "@/components/SiteChrome";
import { OutfitMatcher } from "@/components/tools/OutfitMatcher";
import { Breadcrumbs, JsonLd, MoreTools, ToolFaq, appLd, breadcrumbLd, faqLd } from "@/components/tools/ToolPage";
import { OUTFIT_COLORS } from "@/lib/outfitColors";
import { getPalette } from "@/lib/catalog";
import { getTool } from "@/lib/tools";

const tool = getTool("outfit-color-matcher");
const path = `/tools/${tool.slug}`;

export const metadata: Metadata = {
  title: { absolute: `${tool.title} · MandapCanvas` },
  description: tool.description,
  keywords: tool.keywords,
  alternates: { canonical: path },
  openGraph: { title: tool.title, description: tool.description, url: path, type: "website" },
  twitter: { card: "summary_large_image", title: tool.title, description: tool.description },
};

const FAQ = [
  {
    q: "What color should the groom wear with a red lehenga?",
    a: "Ivory, champagne gold or a deep maroon. Ivory with a red safa or dupatta is the classic choice: it ties the couple together without competing with the bride.",
  },
  {
    q: "Should the bride and groom match exactly?",
    a: "No. Photos look best when the groom picks up one color from the bride's outfit, usually in the safa, dupatta or embroidery, and stays a shade lighter or more neutral overall.",
  },
  {
    q: "What colors should the bridal party and family wear?",
    a: "Colors that sit next to the bride's color on the wheel or contrast with it gently, so she stays the brightest in the frame. For a red lehenga, marigold, rani pink and emerald work well. Avoid the exact bridal shade.",
  },
  {
    q: "How do I choose decor colors that don't clash with my outfit?",
    a: "Keep the decor a shade lighter or a contrast to your outfit, never the same color. A red lehenga against an all-red stage disappears; against ivory and gold it glows.",
  },
  {
    q: "Does this work for sarees, sharara and gowns too?",
    a: "Yes. The tool goes by color, not the outfit type, so it works for lehengas, sarees, Kanjeevarams, shararas, anarkalis and reception gowns.",
  },
];

export default function OutfitMatcherPage() {
  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-4 pb-24 pt-8 sm:px-6">
        <Breadcrumbs items={[["Home", "/"], ["Free tools", "/tools"], [tool.name, path]]} />
        <header className="mt-6 max-w-3xl">
          <h1 className="text-[2.4rem] text-maroon sm:text-[3.2rem]">Wedding outfit color matcher</h1>
          <p className="mt-4 text-lg text-ink-soft">
            Pick the bride&apos;s lehenga or saree color and get matching colors for the groom, the family and the bridal party, plus a mandap decor
            palette that makes her stand out. Made for Desi weddings: Haldi, Mehndi, Sangeet, the ceremony and the reception.
          </p>
        </header>

        <div className="mt-10">
          <OutfitMatcher />
        </div>

        <section className="mt-20" aria-labelledby="combos-h">
          <h2 id="combos-h" className="text-[2rem]">Indian wedding color combinations at a glance</h2>
          <p className="mt-2 max-w-3xl text-ink-soft">The pairings stylists and decorators reach for most, by the bride&apos;s outfit color.</p>
          <div className="mt-6 overflow-x-auto rounded-2xl border border-line bg-white">
            <table className="w-full min-w-[720px] text-left text-[0.95rem]">
              <thead className="bg-silk text-sm">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">Bride wears</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Groom</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Family and bridal party</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Decor palette</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {OUTFIT_COLORS.map((c) => (
                  <tr key={c.id}>
                    <th scope="row" className="px-4 py-3 font-medium">
                      <span className="flex items-center gap-2.5">
                        <span className="h-5 w-5 flex-none rounded-md ring-1 ring-ink/10" style={{ background: c.hex }} aria-hidden="true" />
                        {c.name}
                      </span>
                    </th>
                    <td className="px-4 py-3">{c.groom.map((s) => s.name).join(", ")}</td>
                    <td className="px-4 py-3">{c.family.map((s) => s.name).join(", ")}</td>
                    <td className="px-4 py-3">{getPalette(c.decorPalette).name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-16 grid gap-8 md:grid-cols-3" aria-labelledby="how-h">
          <h2 id="how-h" className="sr-only">How to use the outfit color matcher</h2>
          {[
            ["Start with the bride", "Her outfit is the anchor. Pick its color, or match an exact shade from a photo of the fabric."],
            ["Choose the event", "A Haldi outfit and a reception outfit follow different rules. The tool adjusts its advice."],
            ["See it on your mandap", "Take the decor palette into a free MandapCanvas preview and see the whole setup photo-real."],
          ].map(([t, d]) => (
            <div key={t}>
              <h3 className="text-xl">{t}</h3>
              <p className="mt-2 text-ink-soft">{d}</p>
            </div>
          ))}
        </section>

        <ToolFaq faq={FAQ} />
        <MoreTools current={tool.slug} />
      </div>
      <JsonLd data={appLd(tool)} />
      <JsonLd data={faqLd(FAQ)} />
      <JsonLd data={breadcrumbLd([["Home", "/"], ["Free tools", "/tools"], [tool.name, path]])} />
    </PageShell>
  );
}
