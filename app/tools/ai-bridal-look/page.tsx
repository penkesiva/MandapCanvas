import type { Metadata } from "next";
import { PageShell } from "@/components/SiteChrome";
import { BridalLook } from "@/components/tools/BridalLook";
import { Breadcrumbs, JsonLd, MoreTools, ToolFaq, appLd, breadcrumbLd, faqLd } from "@/components/tools/ToolPage";
import { getTool } from "@/lib/tools";
import { LOOK_TRADITIONS } from "@/lib/bridalLooks";
import { PACKS, formatUSD } from "@/lib/config";

const tool = getTool("ai-bridal-look");
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
    q: "Is it really free?",
    a: "Yes. Your first look is free with no sign-up. Create a free account and you get one more, so you can try a second tradition or color.",
  },
  {
    q: "Will it still look like me?",
    a: "That's the point. The portrait keeps your face, skin tone and features and changes only the outfit, jewelry, hair styling and setting. A clear, front-facing photo in good light gives the closest likeness.",
  },
  {
    q: "What happens to my photo?",
    a: "It's used only to create your look. Your photo and your portrait are deleted automatically after 7 days, and they are never shown in our gallery or used for anything else.",
  },
  {
    q: "Which looks can I try?",
    a: `${LOOK_TRADITIONS.map((t) => t.name).join(", ")}. Pick the outfit color, how much jewelry, and a setting: the mandap, a studio, a palace courtyard or a garden at golden hour.`,
  },
  {
    q: "Can we try it as a couple?",
    a: "Yes. Choose “Us as a couple” and upload a photo of you both. You'll get a wedding portrait of the two of you, side by side, in matching outfits.",
  },
  {
    q: "Can I get portraits for every event?",
    a: `Yes. The Wedding Look Pack turns your photos into portraits at the Haldi, Mehndi, Sangeet, the wedding and the reception, in outfits made for each event. ${PACKS.look12.images} portraits for ${formatUSD(PACKS.look12.priceCents)} or ${PACKS.look30.images} for ${formatUSD(PACKS.look30.priceCents)}, with no watermark. Upload up to 5 photos per person for the closest likeness.`,
  },
  {
    q: "Why is there a MandapCanvas mark on the picture?",
    a: "Free looks carry a small mark so friends know where to make their own. Look Pack portraits and full albums come without it.",
  },
];

export default function BridalLookPage() {
  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-4 pb-24 pt-8 sm:px-6">
        <Breadcrumbs items={[["Home", "/"], ["Free tools", "/tools"], [tool.name, path]]} />
        <header className="mt-6 max-w-3xl">
          <h1 className="text-[2.4rem] text-maroon sm:text-[3.2rem]">See yourself as a bride or groom</h1>
          <p className="mt-4 text-lg text-ink-soft">
            Upload a photo of yourself, or of you both. Pick a tradition, a color and a setting, and get a photo-real wedding portrait that still looks like you.
            Your first look is free.
          </p>
        </header>

        <div className="mt-10">
          <BridalLook
            example={{
              before: "/samples/look-before.jpg",
              after: "/samples/look-after.jpg",
              caption: "One everyday photo, North Indian look, classic red, classic jewelry, at the mandap. Same face, same smile.",
            }}
          />
        </div>

        <section className="mt-16 grid gap-8 md:grid-cols-3" aria-labelledby="how-h">
          <h2 id="how-h" className="sr-only">How it works</h2>
          {[
            ["Add a clear photo", "A selfie or a photo of you both, face to the camera, in good light. It's deleted after 7 days."],
            ["Choose your look", "Eight traditions, from a red North Indian lehenga to a Kanjeevaram saree, a Bengali shola mukut or a Nikah sharara. Add your color, jewelry and setting."],
            ["Save and share", "Your portrait is ready in about 20 seconds. Save it, send it to the family group, or take it to your designer."],
          ].map(([t, d]) => (
            <div key={t}>
              <h3 className="text-xl">{t}</h3>
              <p className="mt-2 text-ink-soft">{d}</p>
            </div>
          ))}
        </section>

        <section className="mt-16" aria-labelledby="ideas-h">
          <h2 id="ideas-h" className="text-[2rem]">Ways couples use it</h2>
          <ul className="mt-5 grid gap-4 sm:grid-cols-2">
            {[
              ["Settle the color debate", "Try your lehenga in red, then in pastel, before the first designer appointment."],
              ["Mix two traditions", "Planning a Punjabi and South Indian wedding? Try one look for each ceremony."],
              ["Plan the groom's look", "See the sherwani and safa colors that go with the bride's outfit."],
              ["Share the excitement", "A fun surprise for the family group chat or a save-the-date teaser."],
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
