import type { Metadata } from "next";
import { PageShell } from "@/components/SiteChrome";
import { WeddingCard } from "@/components/tools/WeddingCard";
import { Breadcrumbs, JsonLd, MoreTools, ToolFaq, appLd, breadcrumbLd, faqLd } from "@/components/tools/ToolPage";
import { getTool } from "@/lib/tools";
import { CARD_TEMPLATES } from "@/lib/weddingCards";

const tool = getTool("wedding-invitation-maker");
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
    a: "Yes. Try for free, no sign-up. A free account gets you one more, for another event or style.",
  },
  {
    q: "Will the names be spelled correctly?",
    a: "Always. The AI paints only the artwork. Your names, date and venue are set on top in real fonts, exactly as you typed them, so there are no garbled letters.",
  },
  {
    q: "Can I change the words after the card is made?",
    a: "Yes, for free. Edit any detail and the card updates instantly. Only painting new artwork uses a free try.",
  },
  {
    q: "Which styles are there?",
    a: `${CARD_TEMPLATES.length} styles: ${CARD_TEMPLATES.map((t) => t.name).join(", ")}.`,
  },
  {
    q: "Can I send it on WhatsApp?",
    a: "Yes. Pick the phone size (9:16) for WhatsApp and Instagram stories, or the card size (3:4) for printing and email. Tap Share on your phone to send it straight to a chat.",
  },
  {
    q: "Does it work for Mehndi, Sangeet, Haldi and the reception?",
    a: "Yes. Choose the event and the wording and artwork change to match. Make one card for each event in the same style for a matching set.",
  },
];

export default function WeddingInvitationPage() {
  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-4 pb-24 pt-8 sm:px-6">
        <Breadcrumbs items={[["Home", "/"], ["Free tools", "/tools"], [tool.name, path]]} />
        <header className="mt-6 max-w-3xl">
          <h1 className="text-[2.4rem] text-maroon sm:text-[3.2rem]">Make your wedding invitation</h1>
          <p className="mt-4 text-lg text-ink-soft">
            Type your names, date and venue, pick one of {CARD_TEMPLATES.length} styles, and get a one-of-a-kind card painted by AI, with every word spelled exactly
            right. For the wedding, the save the date, or every event from Haldi to the reception. Try for free.
          </p>
        </header>

        <div className="mt-10">
          <WeddingCard />
        </div>

        <section className="mt-16 grid gap-8 md:grid-cols-3" aria-labelledby="how-h">
          <h2 id="how-h" className="sr-only">How it works</h2>
          {[
            ["Type the details", "Names, date, venue, dress code and RSVP. Watch them appear on the card as you type."],
            ["Pick a style", "Royal Rajasthani to anime, Madhubani to Gen Z. Add a personal touch like peacocks or your dog."],
            ["Paint and send", "AI paints unique artwork in about 15 seconds. Download it or share it straight to WhatsApp."],
          ].map(([t, d]) => (
            <div key={t}>
              <h3 className="text-xl">{t}</h3>
              <p className="mt-2 text-ink-soft">{d}</p>
            </div>
          ))}
        </section>

        <section className="mt-16" aria-labelledby="tips-h">
          <h2 id="tips-h" className="text-[2rem]">Wording tips for Desi invitations</h2>
          <ul className="mt-5 grid gap-4 sm:grid-cols-2">
            {[
              ["Name the hosts", "Traditional cards open with the parents: “Mr & Mrs Rajesh Sharma and Mr & Mrs Anil Rao invite you…”. Modern couples often write “Together with their families”."],
              ["Give a dress code", "Guests appreciate a hint: Indian festive, pastels, or shades of yellow for the Haldi."],
              ["Make a set", "Use the same style for the Mehndi, Sangeet and wedding so the invitations feel like a family."],
              ["Send the story size on WhatsApp", "A 9:16 card fills the phone screen and is easy to forward to the family group."],
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
