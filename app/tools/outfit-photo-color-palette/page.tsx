import type { Metadata } from "next";
import { PageShell } from "@/components/SiteChrome";
import { PhotoPalette } from "@/components/tools/PhotoPalette";
import { Breadcrumbs, JsonLd, MoreTools, ToolFaq, appLd, breadcrumbLd, faqLd } from "@/components/tools/ToolPage";
import { getTool } from "@/lib/tools";

const tool = getTool("outfit-photo-color-palette");
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
    q: "Is my photo uploaded anywhere?",
    a: "No. The colors are worked out in your browser on your own device. The photo is never sent to MandapCanvas or anyone else, and nothing is saved.",
  },
  {
    q: "What kind of photo works best?",
    a: "A well-lit photo where the outfit fills most of the frame: a store or designer photo, a trial-room picture by a window, or a close-up of the fabric. Avoid strong colored lighting, which shifts the colors.",
  },
  {
    q: "The main color it found isn't my outfit. What do I do?",
    a: "Tap the outfit in the photo. The tool takes the exact color where you tapped and updates the groom, family and decor suggestions to match it.",
  },
  {
    q: "Can I use it for the groom's sherwani or for bridesmaids?",
    a: "Yes. Upload any outfit or fabric. For the groom, it suggests the colors that sit well beside it; for bridesmaids, use the family colors.",
  },
  {
    q: "What do I do with the palette?",
    a: "Save the palette card and share it with your designer, decorator and family. Or open a decor palette in MandapCanvas and see your mandap in those colors, photo-real and free.",
  },
];

export default function PhotoPalettePage() {
  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-4 pb-24 pt-8 sm:px-6">
        <Breadcrumbs items={[["Home", "/"], ["Free tools", "/tools"], [tool.name, path]]} />
        <header className="mt-6 max-w-3xl">
          <h1 className="text-[2.4rem] text-maroon sm:text-[3.2rem]">Get a wedding palette from your outfit photo</h1>
          <p className="mt-4 text-lg text-ink-soft">
            Upload a photo of your lehenga, saree, sherwani or fabric swatch. In a second you&apos;ll see its exact colors with names and hex codes,
            the colors the groom and family should wear beside it, and mandap decor palettes that make it stand out.
          </p>
        </header>

        <div className="mt-10">
          <PhotoPalette />
        </div>

        <section className="mt-16 grid gap-8 md:grid-cols-3" aria-labelledby="how-h">
          <h2 id="how-h" className="sr-only">How it works</h2>
          {[
            ["Upload or snap a photo", "A designer's product photo, a trial-room picture or a fabric close-up. It never leaves your phone or computer."],
            ["See every color, named", "The tool finds the main colors, names them the way families do (rani pink, mehndi green, zari gold) and spots gold or silver work."],
            ["Match the whole wedding", "Get colors for the groom and family, and decor palettes you can open straight into a free MandapCanvas preview."],
          ].map(([t, d]) => (
            <div key={t}>
              <h3 className="text-xl">{t}</h3>
              <p className="mt-2 text-ink-soft">{d}</p>
            </div>
          ))}
        </section>

        <section className="mt-16" aria-labelledby="tips-h">
          <h2 id="tips-h" className="text-[2rem]">Tips for an accurate palette</h2>
          <ul className="mt-5 grid gap-4 sm:grid-cols-2">
            {[
              ["Use daylight", "Indoor yellow light turns ivory into cream and red into orange. A photo near a window is truest."],
              ["Fill the frame", "The more of the photo is outfit, the less the background and skin tones get in the way."],
              ["Tap to correct", "If the main color isn't right, tap the outfit; the suggestions follow the color you pick."],
              ["Check the embroidery", "Zari and gota show up as gold. Carry that metal into the decor for a matched look."],
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
