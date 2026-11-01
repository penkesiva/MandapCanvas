import type { Metadata } from "next";
import { PageShell } from "@/components/SiteChrome";
import { PaletteFinder } from "@/components/tools/PaletteFinder";
import { Breadcrumbs, JsonLd, MoreTools, ToolFaq, appLd, breadcrumbLd, faqLd } from "@/components/tools/ToolPage";
import { FINDER_EVENTS, SEASONS, SEASON_FLOWERS, bestByEventAndSeason } from "@/lib/paletteFinder";
import { getTool } from "@/lib/tools";

const tool = getTool("wedding-color-palette-finder");
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
    q: "What are the best colors for a Haldi?",
    a: "Marigold yellow and saffron orange with fresh greens. Haldi is a daytime, playful event, and warm yellows hide turmeric stains and photograph brightly in sunlight.",
  },
  {
    q: "What colors work for a Mehndi?",
    a: "Bright, relaxed palettes: marigold and saffron, or mint and pastels for a softer daytime look. Prints, mirror-work and colorful umbrellas suit the mood.",
  },
  {
    q: "What colors suit a fall or winter Indian wedding?",
    a: "Jewel tones. Emerald and antique gold, wine and champagne, and sindoor red with gold all look rich in cooler months and under evening light, and fall flowers like dahlias and amaranthus fit them well.",
  },
  {
    q: "Should every event have a different color palette?",
    a: "Most Desi weddings do: a bright Haldi, a colorful Mehndi, a glamorous Sangeet and a classic ceremony. Repeating one accent color across events, like gold, ties the week together.",
  },
  {
    q: "How do I make sure the decor doesn't clash with my outfit?",
    a: "Add your outfit color in the finder. It lifts palettes that frame your outfit and flags the ones where you'd blend into the backdrop.",
  },
];

export default function PaletteFinderPage() {
  const table = bestByEventAndSeason();
  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-4 pb-24 pt-8 sm:px-6">
        <Breadcrumbs items={[["Home", "/"], ["Free tools", "/tools"], [tool.name, path]]} />
        <header className="mt-6 max-w-3xl">
          <h1 className="text-[2.4rem] text-maroon sm:text-[3.2rem]">Wedding color palette finder</h1>
          <p className="mt-4 text-lg text-ink-soft">
            Find the right Indian wedding color palette for each event. Choose Haldi, Mehndi, Sangeet, the ceremony or the reception, then the
            season, the time of day and, if you know it, the bride&apos;s outfit color. You&apos;ll get the three best palettes with flowers that are in
            season.
          </p>
        </header>

        <div className="mt-10">
          <PaletteFinder />
        </div>

        <section className="mt-20" aria-labelledby="table-h">
          <h2 id="table-h" className="text-[2rem]">Best wedding colors by event and season</h2>
          <p className="mt-2 max-w-3xl text-ink-soft">
            Our top pick for each event in each season. Haldi, Mehndi and the ceremony assume daytime; Sangeet and the reception assume evening.
          </p>
          <div className="mt-6 overflow-x-auto rounded-2xl border border-line bg-white">
            <table className="w-full min-w-[680px] text-left text-[0.95rem]">
              <thead className="bg-silk text-sm">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">Event</th>
                  {SEASONS.map((s) => (
                    <th key={s.id} scope="col" className="px-4 py-3 font-semibold">
                      {s.name} <span className="font-normal text-ink-soft">({s.months})</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {table.map((row) => (
                  <tr key={row.event}>
                    <th scope="row" className="px-4 py-3 font-medium">{FINDER_EVENTS.find((e) => e.id === row.event)!.name}</th>
                    {SEASONS.map((s) => (
                      <td key={s.id} className="px-4 py-3">{row.bySeason[s.id]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-16" aria-labelledby="flowers-h">
          <h2 id="flowers-h" className="text-[2rem]">Wedding flowers in season in the U.S.</h2>
          <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SEASONS.map((s) => (
              <li key={s.id} className="rounded-2xl bg-silk p-5">
                <h3 className="text-xl">
                  {s.name} <span className="font-sans text-sm text-ink-soft">{s.months}</span>
                </h3>
                <p className="mt-2 text-ink-soft">{SEASON_FLOWERS[s.id]}</p>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-ink-soft">Availability varies by region and florist; ask yours what&apos;s best the week of your wedding.</p>
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
