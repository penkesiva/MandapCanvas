import type { Metadata } from "next";
import { PageShell } from "@/components/SiteChrome";
import { FAQ } from "@/lib/faq";

export const metadata: Metadata = { title: "Questions", description: "How MandapCanvas works, what you get, privacy, pricing and refunds." };

export default function FaqPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
  return (
    <PageShell>
      <div className="mx-auto max-w-3xl px-4 pb-24 pt-12 sm:px-6">
        <h1 className="text-[2.6rem] sm:text-[3.2rem]">Questions</h1>
        <div className="mt-8 divide-y divide-line border-y border-line">
          {FAQ.map((f) => (
            <section key={f.q} className="py-6">
              <h2 className="text-2xl">{f.q}</h2>
              <p className="mt-2 text-ink-soft">{f.a}</p>
            </section>
          ))}
        </div>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </div>
    </PageShell>
  );
}
