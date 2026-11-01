import Link from "next/link";
import { SITE } from "@/lib/config";
import { FREE_TOOLS, type FreeTool, toolHref } from "@/lib/tools";
import { Divider } from "@/components/Ornaments";

/** JSON-LD script tag. */
export function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

export function breadcrumbLd(items: [string, string][]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map(([name, path], i) => ({ "@type": "ListItem", position: i + 1, name, item: `${SITE.url}${path}` })),
  };
}

export function faqLd(faq: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
}

export function appLd(tool: FreeTool) {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: tool.name,
    url: `${SITE.url}${toolHref(tool)}`,
    description: tool.description,
    applicationCategory: "LifestyleApplication",
    operatingSystem: "Any",
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    publisher: { "@type": "Organization", name: "MandapCanvas", url: SITE.url },
  };
}

export function Breadcrumbs({ items }: { items: [string, string][] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-ink-soft">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map(([name, path], i) => (
          <li key={path} className="flex items-center gap-1.5">
            {i > 0 ? <span aria-hidden="true">›</span> : null}
            {i < items.length - 1 ? (
              <Link href={path} className="hover:text-ink hover:underline">
                {name}
              </Link>
            ) : (
              <span aria-current="page" className="text-ink">
                {name}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function ToolFaq({ faq }: { faq: { q: string; a: string }[] }) {
  return (
    <section className="mx-auto mt-20 max-w-3xl" aria-labelledby="faq-h">
      <div className="text-center">
        <Divider />
        <h2 id="faq-h" className="mt-3 text-[2rem]">Questions</h2>
      </div>
      <div className="mt-6 divide-y divide-gold/30 border-y border-gold/40">
        {faq.map((f) => (
          <details key={f.q} className="group py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-medium">
              <h3 className="font-sans text-lg font-medium">{f.q}</h3>
              <span className="text-2xl leading-none text-kumkum transition group-open:rotate-45" aria-hidden="true">+</span>
            </summary>
            <p className="mt-2 text-ink-soft">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

export function MoreTools({ current }: { current: string }) {
  const others = FREE_TOOLS.filter((t) => t.slug !== current);
  return (
    <section className="mt-20 rounded-[26px] border border-gold/40 bg-silk p-6 sm:p-8" aria-labelledby="more-h">
      <h2 id="more-h" className="text-[1.8rem]">More free tools</h2>
      <ul className="mt-4 grid gap-4 sm:grid-cols-2">
        {others.map((t) => (
          <li key={t.slug}>
            <Link href={toolHref(t)} className="block rounded-2xl border border-line bg-white p-5 hover:border-gold">
              <span className="font-display text-xl text-maroon">{t.name}</span>
              <span className="mt-1 block text-sm text-ink-soft">{t.blurb}</span>
            </Link>
          </li>
        ))}
        <li>
          <Link href="/create" className="block rounded-2xl border border-kumkum/40 bg-white p-5 hover:border-kumkum">
            <span className="font-display text-xl text-maroon">Free mandap preview</span>
            <span className="mt-1 block text-sm text-ink-soft">Sketch, upload or pick a style and see your decor photo-real. Two images free.</span>
          </Link>
        </li>
      </ul>
    </section>
  );
}
