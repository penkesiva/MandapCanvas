import type { Metadata } from "next";
import { PageShell } from "@/components/SiteChrome";
import { HashtagGenerator } from "@/components/tools/HashtagGenerator";
import { Breadcrumbs, JsonLd, MoreTools, ToolFaq, appLd, breadcrumbLd, faqLd } from "@/components/tools/ToolPage";
import { generateHashtags } from "@/lib/hashtags";
import { getTool } from "@/lib/tools";

const tool = getTool("wedding-hashtag-generator");
const path = `/tools/${tool.slug}`;

export const metadata: Metadata = {
  title: { absolute: `${tool.title} · MandapCanvas` },
  description: tool.description,
  keywords: tool.keywords,
  alternates: { canonical: path },
  openGraph: { title: tool.title, description: tool.description, url: path, type: "website" },
  twitter: { card: "summary_large_image", title: tool.title, description: tool.description },
};

const EXAMPLES: [string, string][] = [
  ["Priya", "Arjun"],
  ["Simran", "Kabir"],
  ["Ananya", "Rohan"],
];

const FAQ = [
  {
    q: "How do I make a unique Indian wedding hashtag?",
    a: "Start with both first names, then add something only you have: a name blend, your wedding year, your city or a family name. Check the hashtag on Instagram before you print it on signs; this tool links each one straight to Instagram so you can check in a tap.",
  },
  {
    q: "Should we have a different hashtag for each event?",
    a: "Many Desi couples do: one main hashtag plus event versions like #PrijunMehndi and #PrijunSangeet. Guests can then find the photos from each function separately.",
  },
  {
    q: "Where should we put our wedding hashtag?",
    a: "On the invitation or wedding website, a sign at the entrance and the photo booth, the table cards at the reception, and the Instagram bio of whoever is running the wedding page.",
  },
  {
    q: "Is the hashtag generator free?",
    a: "Yes. It runs in your browser, needs no sign-up, and nothing you type is saved.",
  },
  {
    q: "What is a name blend hashtag?",
    a: "A made-up word from both names, like Prijun for Priya and Arjun or Simbir for Simran and Kabir. Blends are short, easy to type and usually not taken yet.",
  },
];

export default function HashtagPage() {
  return (
    <PageShell>
      <div className="mx-auto max-w-5xl px-4 pb-24 pt-8 sm:px-6">
        <Breadcrumbs items={[["Home", "/"], ["Free tools", "/tools"], [tool.name, path]]} />
        <header className="mt-6 max-w-3xl">
          <h1 className="text-[2.4rem] text-maroon sm:text-[3.2rem]">Desi wedding hashtag generator</h1>
          <p className="mt-4 text-lg text-ink-soft">
            Type both names and get Indian wedding hashtags in seconds: #NameWedsName classics, Shaadi hashtags, name blends, and one for every
            event from Haldi and Mehndi to the Sangeet, Baraat and reception. Tap any hashtag to copy it.
          </p>
        </header>

        <div className="mt-10">
          <HashtagGenerator />
        </div>

        <section className="mt-20" aria-labelledby="ex-h">
          <h2 id="ex-h" className="text-[2rem]">Wedding hashtag ideas: examples</h2>
          <p className="mt-2 max-w-3xl text-ink-soft">What the generator makes for a few couples.</p>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {EXAMPLES.map(([a, b]) => {
              const tags = generateHashtags({ name1: a, name2: b }).flatMap((g) => g.tags);
              return (
                <div key={a} className="rounded-2xl border border-line bg-white p-5">
                  <h3 className="text-xl">
                    {a} and {b}
                  </h3>
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {tags.slice(0, 10).map((t) => (
                      <li key={t} className="rounded-full bg-silk px-2.5 py-1 text-sm">
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-16" aria-labelledby="tips-h">
          <h2 id="tips-h" className="text-[2rem]">What makes a good wedding hashtag</h2>
          <ul className="mt-5 grid gap-4 sm:grid-cols-2">
            {[
              ["Easy to spell", "If guests have to ask how to spell it, they won't use it. Short beats clever."],
              ["Not already taken", "Search it on Instagram first. A used hashtag mixes your photos with strangers'."],
              ["Capitalized words", "#PriyaWedsArjun is far easier to read than #priyawedsarjun, and it works the same."],
              ["One main tag, event tags after", "Pick one to print everywhere, then add event versions for Mehndi, Sangeet and the reception."],
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
