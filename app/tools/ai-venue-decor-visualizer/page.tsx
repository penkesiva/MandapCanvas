import type { Metadata } from "next";
import { PageShell } from "@/components/SiteChrome";
import { VenueDecor } from "@/components/tools/VenueDecor";
import { VenueExamples } from "@/components/tools/VenueExamples";
import { Breadcrumbs, JsonLd, MoreTools, ToolFaq, appLd, breadcrumbLd, faqLd } from "@/components/tools/ToolPage";
import { getTool } from "@/lib/tools";
import { VENUE_STYLES } from "@/lib/venueDecor";

const tool = getTool("ai-venue-decor-visualizer");
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
    q: "Is it free?",
    a: "Yes. Try for free, no sign-up. A free account gets you one more, to try another style or event.",
  },
  {
    q: "Will it change my venue?",
    a: "No. The AI keeps your walls, windows, ceiling, floor and camera angle, and adds decor on top. Drag the slider to compare the two photos.",
  },
  {
    q: "What kind of photo works best?",
    a: "A wide photo taken from the back of the space, in daylight, with the room mostly empty. A photo from the venue's website or Instagram works well too.",
  },
  {
    q: "Which styles can I try?",
    a: `${VENUE_STYLES.length} styles: ${VENUE_STYLES.map((s) => s.name).join(", ")}. You can also pick a color palette, or keep the style's own colors.`,
  },
  {
    q: "Does it work for a backyard or a temple?",
    a: "Yes. Banquet halls, hotel ballrooms, backyards, lawns, barns, temples and gurdwara halls all work.",
  },
  {
    q: "Can I show this to my decorator?",
    a: "Yes. Save the image and share it. To get every event designed in your venue, with close-ups of the mandap, stage and entrance, continue to a full album.",
  },
];

export default function VenueDecorPage() {
  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-4 pb-24 pt-8 sm:px-6">
        <Breadcrumbs items={[["Home", "/"], ["Free tools", "/tools"], [tool.name, path]]} />
        <header className="mt-6 max-w-3xl">
          <h1 className="text-[2.4rem] text-maroon sm:text-[3.2rem]">See your venue, decorated</h1>
          <p className="mt-4 text-lg text-ink-soft">
            Upload a photo of your hall, backyard or temple. Pick the event and a style, and AI decorates your own space, walls and all. Try for free.
          </p>
        </header>

        <div className="mt-10">
          <VenueDecor />
        </div>

        <VenueExamples />

        <section className="mt-16 grid gap-8 md:grid-cols-3" aria-labelledby="how-h">
          <h2 id="how-h" className="sr-only">How it works</h2>
          {[
            ["Snap the space", "A wide photo of the empty hall or backyard. The venue's own photo works too."],
            ["Pick the event and style", "Mandap, reception, Sangeet, Mehndi or Haldi, in Royal, South Indian, Floral and more."],
            ["Compare and share", "Drag the slider from before to after. Save it for your family and your decorator."],
          ].map(([t, d]) => (
            <div key={t}>
              <h3 className="text-xl">{t}</h3>
              <p className="mt-2 text-ink-soft">{d}</p>
            </div>
          ))}
        </section>

        <section className="mt-16" aria-labelledby="tips-h">
          <h2 id="tips-h" className="text-[2rem]">Tips for decorating your venue</h2>
          <ul className="mt-5 grid gap-4 sm:grid-cols-2">
            {[
              ["Low ceilings", "Skip tall domes. A floral ceiling or hanging strands make a low room feel full and festive."],
              ["Busy carpets", "Pick a style with a raised, carpeted mandap platform so the floor pattern doesn't fight the decor."],
              ["Backyards", "Plan the mandap against the best backdrop, like trees or the house, and add a canopy for shade."],
              ["One venue, many events", "Change the colors, not the structure. Reuse the stage for the Sangeet and the reception."],
            ].map(([t, d]) => (
              <li key={t} className="rounded-2xl bg-silk p-5">
                <h3 className="text-lg">{t}</h3>
                <p className="mt-1 text-ink-soft">{d}</p>
              </li>
            ))}
          </ul>
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
