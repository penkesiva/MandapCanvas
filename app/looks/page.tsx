import type { Metadata } from "next";
import { PageShell } from "@/components/SiteChrome";
import { BridalLook } from "@/components/tools/BridalLook";
import { LookExamples } from "@/components/looks/LookExamples";
import { Breadcrumbs, JsonLd, MoreTools, ToolFaq, appLd, breadcrumbLd, faqLd } from "@/components/tools/ToolPage";
import { getTool } from "@/lib/tools";
import { LOOK_TRADITIONS } from "@/lib/bridalLooks";
import { PACKS, formatUSD } from "@/lib/config";

const tool = getTool("ai-bridal-look");
const path = "/looks";

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
    a: "Yes. Try for free, no sign-up. A free account gets you one more, to try a second tradition or color.",
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
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6 sm:pb-24 sm:pt-8">
        <Breadcrumbs items={[["Home", "/"], ["Bridal looks", path]]} />
        <header className="mt-5 grid items-center gap-10 lg:mt-6 lg:grid-cols-[1fr_440px]">
          <div>
            <h1 className="text-[2.3rem] leading-tight text-maroon sm:text-[3.4rem]">See yourself as a bride or groom</h1>
            <p className="mt-3 max-w-xl text-lg text-ink-soft">Upload a selfie. Get photo-real portraits of you at every event, still unmistakably you.</p>
            <div className="mt-6 lg:hidden">
              <LookExamples compact />
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="#try" className="btn btn-primary">
                Try your look free
              </a>
              <a href="#look-pack" className="btn btn-ghost">
                Every event from {formatUSD(PACKS.look12.priceCents)}
              </a>
            </div>
          </div>
          <div className="hidden lg:block">
            <LookExamples />
          </div>
        </header>

        <div id="try" className="mt-12 scroll-mt-24 sm:mt-16">
          <h2 className="mb-5 text-[1.9rem] sm:text-[2rem]">Try your look, free</h2>
          <BridalLook />
        </div>

        <section className="mt-14 grid gap-6 sm:grid-cols-3" aria-labelledby="how-h">
          <h2 id="how-h" className="sr-only">How it works</h2>
          {[
            ["Add a clear photo", "Face to the camera, good light. Deleted after 7 days."],
            ["Choose your look", "8 traditions, your color, jewelry and setting."],
            ["Save and share", "Ready in about 20 seconds. Send it to the family."],
          ].map(([t, d], i) => (
            <div key={t} className="flex gap-3">
              <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-maroon text-sm font-semibold text-gold-light">{i + 1}</span>
              <span>
                <h3 className="text-lg">{t}</h3>
                <p className="text-ink-soft">{d}</p>
              </span>
            </div>
          ))}
        </section>

        <ToolFaq faq={FAQ} />
        <MoreTools current={tool.slug} />
      </div>
      <JsonLd data={appLd(tool)} />
      <JsonLd data={faqLd(FAQ)} />
      <JsonLd data={breadcrumbLd([["Home", "/"], ["Bridal looks", path]])} />
    </PageShell>
  );
}
