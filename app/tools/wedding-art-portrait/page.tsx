import type { Metadata } from "next";
import { PageShell } from "@/components/SiteChrome";
import { ArtPortrait } from "@/components/tools/ArtPortrait";
import { Breadcrumbs, JsonLd, MoreTools, ToolFaq, appLd, breadcrumbLd, faqLd } from "@/components/tools/ToolPage";
import { getTool } from "@/lib/tools";
import { ART_STYLES } from "@/lib/artStyles";

const tool = getTool("wedding-art-portrait");
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
    a: "Yes. Try for free, no sign-up. A free account gets you one more, to try another style.",
  },
  {
    q: "Which styles are there?",
    a: `${ART_STYLES.length} styles: ${ART_STYLES.map((s) => s.name).join(", ")}.`,
  },
  {
    q: "Will it still look like us?",
    a: "The AI keeps your faces, skin tones, hair and glasses, the number of people and how you're standing, and redraws everything in the style. Clear, well-lit photos give the closest likeness.",
  },
  {
    q: "Can it dress us for the wedding?",
    a: "Yes. Pick \"Dress us for the wedding\" for a lehenga or saree and a sherwani, or \"Keep our clothes\" to keep what you're wearing in the photo.",
  },
  {
    q: "What can I use it for?",
    a: "A save the date, your wedding website, a WhatsApp or Instagram profile picture, a welcome sign or a framed gift for your parents.",
  },
  {
    q: "What happens to my photo?",
    a: "Your photo and your portrait are deleted automatically after 7 days. Save the portrait to keep it.",
  },
];

export default function ArtPortraitPage() {
  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-4 pb-24 pt-8 sm:px-6">
        <Breadcrumbs items={[["Home", "/"], ["Free tools", "/tools"], [tool.name, path]]} />
        <header className="mt-6 max-w-3xl">
          <h1 className="text-[2.4rem] text-maroon sm:text-[3.2rem]">Turn your photo into art</h1>
          <p className="mt-4 text-lg text-ink-soft">
            Upload a photo of the two of you. Pick dreamy anime, 80s retro, a Bollywood poster, Tanjore and {ART_STYLES.length - 4} more styles, and get a
            painted portrait for your save the date or profile picture. Try for free.
          </p>
        </header>

        <div className="mt-10">
          <ArtPortrait />
        </div>

        <section className="mt-16 grid gap-8 md:grid-cols-3" aria-labelledby="how-h">
          <h2 id="how-h" className="sr-only">How it works</h2>
          {[
            ["Add your photo", "An engagement photo or a selfie together. Faces clear, good light."],
            ["Pick a style", "From dreamy anime and 80s retro to Mughal miniature and Madhubani."],
            ["Save and share", "Drag the slider to compare, then save it or send it to the family group."],
          ].map(([t, d]) => (
            <div key={t}>
              <h3 className="text-xl">{t}</h3>
              <p className="mt-2 text-ink-soft">{d}</p>
            </div>
          ))}
        </section>

        <section className="mt-16" aria-labelledby="ideas-h">
          <h2 id="ideas-h" className="text-[2rem]">Ways to use your portrait</h2>
          <ul className="mt-5 grid gap-4 sm:grid-cols-2">
            {[
              ["Save the date", "A painted portrait makes a save the date people keep. Add your date and send it on WhatsApp."],
              ["Wedding website", "Use it as the header photo, or one style per event page."],
              ["Profile pictures", "A matching pair for the countdown to the wedding."],
              ["A gift for the parents", "Print the Tanjore or classic oil version and frame it."],
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
