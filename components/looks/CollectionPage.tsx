import { PageShell } from "@/components/SiteChrome";
import { Breadcrumbs, JsonLd, ToolFaq, breadcrumbLd, faqLd } from "@/components/tools/ToolPage";
import { PACKS, formatUSD } from "@/lib/config";
import { LOOK_COLLECTIONS, type CollectionId } from "@/lib/lookCollections";
import { CollectionGallery, CollectionOrder } from "./CollectionLook";
import { LooksSwitcher } from "./LooksSwitcher";
import { NavratriStrip } from "./NavratriStrip";

/** The shared layout for the Maharani and Navratri pages. */
export function CollectionPage({
  id,
  title,
  intro,
  galleryTitle,
  steps,
  faq,
}: {
  id: CollectionId;
  title: string;
  intro: string;
  galleryTitle: string;
  steps: [string, string][];
  faq: { q: string; a: string }[];
}) {
  const c = LOOK_COLLECTIONS[id];
  const from = Math.min(...c.packs.map((p) => PACKS[p].priceCents));
  const crumbs: [string, string][] = [["Home", "/"], ["Looks", "/looks"], [c.name, c.path]];
  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-4 pb-24 pt-8 sm:px-6">
        <Breadcrumbs items={crumbs} />
        <div className="mt-5">
          <LooksSwitcher current={c.path as "/looks/maharani" | "/looks/navratri"} />
        </div>
        <header className="mt-6 max-w-3xl">
          <h1 className="text-[2.4rem] text-maroon sm:text-[3.2rem]">{title}</h1>
          <p className="mt-4 text-lg text-ink-soft">{intro}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="#order" className="btn btn-primary">
              Get my portraits from {formatUSD(from)}
            </a>
            {id === "navratri" ? null : (
              <a href="#gallery" className="btn btn-ghost">
                See the looks
              </a>
            )}
          </div>
        </header>
        {id === "navratri" ? (
          <div className="mt-10">
            <NavratriStrip />
          </div>
        ) : null}

        <section id="gallery" className={`mt-14 scroll-mt-24 ${id === "navratri" ? "hidden" : ""}`} aria-labelledby="gallery-h">
          <h2 id="gallery-h" className="text-[2rem]">
            {galleryTitle}
          </h2>
          <p className="mt-1 text-ink-soft">Examples made from one photo of an AI model. Yours are made from your own photos.</p>
          <div className="mt-6">
            <CollectionGallery id={id} />
          </div>
        </section>

        <section className="mt-16 grid gap-8 md:grid-cols-3" aria-labelledby="how-h">
          <h2 id="how-h" className="sr-only">
            How it works
          </h2>
          {steps.map(([t, d]) => (
            <div key={t}>
              <h3 className="text-xl">{t}</h3>
              <p className="mt-2 text-ink-soft">{d}</p>
            </div>
          ))}
        </section>

        <div className="mt-16">
          <CollectionOrder id={id} />
        </div>

        <ToolFaq faq={faq} />
      </div>
      <JsonLd data={faqLd(faq)} />
      <JsonLd data={breadcrumbLd(crumbs)} />
    </PageShell>
  );
}
