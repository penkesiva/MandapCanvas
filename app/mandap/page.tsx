import type { Metadata } from "next";
import { PACKS, PLANS, formatUSD } from "@/lib/config";
import Link from "next/link";
import { PageShell } from "@/components/SiteChrome";
import { BeforeAfter } from "@/components/BeforeAfter";
import { PricingCards } from "@/components/PricingCards";
import { Corner, Divider, Mandala, SectionTitle } from "@/components/Ornaments";
import { FAQ } from "@/lib/faq";
import { DECOR_PRESETS, PALETTES, STYLE_TIERS } from "@/lib/catalog";

const EVENTS_STRIP = [
  { src: "/samples/haldi.jpg", name: "Haldi", note: "Marigold strings, brass urlis, morning light" },
  { src: "/samples/mehndi.jpg", name: "Mehndi", note: "Floral swing, jewel-tone lounge, umbrellas" },
  { src: "/samples/sangeet.jpg", name: "Sangeet", note: "Dance floor, draping, warm uplighting" },
  { src: "/samples/south-indian.jpg", name: "Muhurtham", note: "Temple pillars, jasmine, banana leaves" },
  { src: "/samples/sikh.jpg", name: "Anand Karaj", note: "Ivory and peach, a calm, bright hall" },
  { src: "/samples/nikah.jpg", name: "Nikah", note: "Mughal arches, orchids, antique gold" },
  { src: "/samples/reception.jpg", name: "Reception", note: "Floral wall, chandeliers, couple's sofa" },
];

const PALETTE_COMPARE = [
  { src: "/samples/palette-blush.jpg", id: "blush_ivory" },
  { src: "/samples/palette-emerald.jpg", id: "emerald_gold" },
  { src: "/samples/palette-red.jpg", id: "red_gold" },
];

export const metadata: Metadata = {
  title: { absolute: "Mandap Designs: See Your Wedding Decor Photo-Real Before You Book · MandapCanvas" },
  description:
    `Sketch your mandap, upload a photo you love or pick one of 12 styles. See your decor photo-real for every event, from the Haldi to the reception, with the two of you in it. Two free previews, albums from ${formatUSD(PACKS.starter.priceCents)}.`,
  alternates: { canonical: "/mandap" },
  openGraph: { title: "See your mandap before the first flower is ordered", url: "/mandap", type: "website", images: [{ url: "/og-mandap.jpg", width: 1200, height: 630, alt: "A mandap sketch beside its photo-real preview" }] },
};

export default function MandapPage() {
  return (
    <PageShell>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="bg-jaali absolute inset-0 [mask-image:linear-gradient(180deg,#000_0%,transparent_85%)]" aria-hidden="true" />
        <Mandala className="absolute -right-48 -top-40 hidden h-[760px] w-[760px] md:block" opacity={0.28} />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pb-14 pt-8 sm:px-6 sm:pb-20 md:grid-cols-[0.9fr_1.1fr] md:gap-12 md:pt-20">
          <div>
            <h1 className="text-[2.4rem] leading-tight text-maroon sm:text-[3.5rem] md:text-[4rem]">See your mandap before you book.</h1>
            <Divider className="mt-6 !justify-start" />
            <p className="mt-5 max-w-[34rem] text-lg text-ink-soft">
              Sketch it, upload a photo or pick a style. Get a photo-real album of every event, in the colors you&apos;re choosing between.
            </p>
            <div className="cta-row mt-9 flex flex-wrap gap-4">
              <Link href="/create" className="btn btn-primary">Make a free preview</Link>
              <Link href="/gallery" className="btn btn-ghost">See sample albums</Link>
            </div>
            <p className="mt-6 text-sm text-ink-soft">Two free images, no account needed. Albums from {formatUSD(PACKS.starter.priceCents)}.</p>
          </div>
          <div className="relative">
            <div className="frame-gold">
              <BeforeAfter
                before="/samples/hero-before.jpg"
                after="/samples/hero-after.jpg"
                beforeAlt="A decorator's hand-drawn sketch of a four-pillar mandap with a jaali backdrop"
                afterAlt="The same mandap as a photo-real preview in blush and ivory roses"
                priority
              />
            </div>
            <Corner className="absolute -left-5 -top-5 hidden sm:block" />
            <Corner className="absolute -bottom-5 -right-5 hidden rotate-180 sm:block" />
            <p className="mt-5 text-center text-sm text-ink-soft">Drag the garland. This preview was made from the sketch on the left.</p>
          </div>
        </div>
      </section>

      {/* From simple to grand */}
      <section className="relative border-y border-gold/30 bg-silk">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <SectionTitle
            title="From simple to grand"
            intro="Twelve starting styles, from a few white roses to a ceiling of flowers. Or start from your own sketch."
          />
          <div className="mt-12 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {STYLE_TIERS.map((t, ti) => (
              <div key={t.id}>
                <div className="mb-5 flex items-center gap-3">
                  <span className="flex gap-1" aria-label={`${ti + 1} of 4 on the scale from simple to grand`}>
                    {STYLE_TIERS.map((_, i) => (
                      <span key={i} className={`h-2 w-2 rotate-45 ${i <= ti ? "bg-gold" : "border border-gold/60"}`} />
                    ))}
                  </span>
                  <span className="font-display text-xl text-maroon">{t.name}</span>
                </div>
                <ul className="grid grid-cols-3 gap-3 sm:grid-cols-1 sm:gap-6">
                  {DECOR_PRESETS.filter((p) => p.tier === t.id).map((p) => (
                    <li key={p.id}>
                      <Link href={`/create?style=${p.id}`} className="group block">
                        <span className="block overflow-hidden border border-gold/40 bg-white p-1.5 arch transition group-hover:border-gold">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={p.image} alt={`${p.name} mandap`} className="arch aspect-[4/5] w-full object-cover" loading="lazy" />
                        </span>
                        <span className="mt-3 block text-center">
                          <span className="block text-sm font-semibold leading-tight text-ink group-hover:text-kumkum sm:text-base">{p.name}</span>
                          <span className="hidden text-sm text-ink-soft sm:block">{p.description}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-14 text-center">
            <Link href="/create" className="btn btn-primary">Start from your own idea</Link>
          </div>
        </div>
      </section>

      {/* One sketch, every palette */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <SectionTitle
          title="One design. Every palette you're torn between."
          intro="Put the options side by side on your mandap, then send the link to the family."
        />
        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {PALETTE_COMPARE.map(({ src, id }) => {
            const p = PALETTES.find((x) => x.id === id)!;
            return (
              <figure key={id} className="rounded-[22px] border border-gold/40 bg-white p-2 shadow-[0_24px_40px_-30px_rgba(74,13,26,0.5)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={`The mandap in ${p.name}`} className="aspect-[4/3] w-full rounded-[16px] object-cover" loading="lazy" />
                <figcaption className="flex items-center justify-center gap-3 px-3 py-3">
                  <span className="flex">
                    {p.swatches.map((c) => (
                      <span key={c} className="-ml-1 h-5 w-5 rounded-full border-2 border-white ring-1 ring-ink/10 first:ml-0" style={{ background: c }} />
                    ))}
                  </span>
                  <span className="font-medium">{p.name}</span>
                </figcaption>
              </figure>
            );
          })}
        </div>
      </section>

      {/* Every event */}
      <section className="relative overflow-hidden bg-maroon text-[#fff8ef]">
        <div className="bg-jaali-dark absolute inset-0" aria-hidden="true" />
        <div className="toran absolute inset-x-0 top-0 opacity-90" aria-hidden="true" />
        <div className="relative mx-auto max-w-6xl px-4 pt-20 sm:px-6">
          <SectionTitle
            tone="light"
            title="The whole week, not just the mandap"
            intro="Named the way your family does it: Pheras or Muhurtham, Anand Karaj or Nikah."
          />
        </div>
        <div className="relative mx-auto mt-10 flex max-w-6xl snap-x scroll-px-4 gap-5 overflow-x-auto px-4 pb-20 sm:scroll-px-6 sm:px-6">
          {EVENTS_STRIP.map((e) => (
            <figure key={e.name} className="w-[78%] flex-none snap-start sm:w-[42%] md:w-[30%]">
              <div className="rounded-[20px] bg-gradient-to-br from-[#f3dc9c] via-gold to-[#9c7628] p-[3px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={e.src} alt={`${e.name} decor preview`} className="aspect-[4/3] w-full rounded-[17px] object-cover" loading="lazy" />
              </div>
              <figcaption className="mt-3 text-center">
                <span className="font-display text-2xl text-gold-light">{e.name}</span>
                <span className="block text-sm text-[#f3e3d3]">{e.note}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <SectionTitle title="How it works" />
        <ol className="mt-12 grid gap-10 md:grid-cols-3">
          {[
            ["Start from your idea", "Draw it, upload a photo, or pick one of 12 styles."],
            ["Tell us about the wedding", "Your tradition, events, colors and, if you like, your photos."],
            ["Get your album", "Two free previews in a minute. Then pick a pack."],
          ].map(([t, d], i) => (
            <li key={t} className="text-center">
              <span className="relative mx-auto grid h-16 w-16 place-items-center">
                <span className="absolute inset-0 rotate-45 rounded-[14px] border border-gold bg-silk" />
                <span className="absolute inset-[5px] rotate-45 rounded-[10px] bg-kumkum" />
                <span className="relative font-display text-2xl text-[#fff8ef]">{i + 1}</span>
              </span>
              <h3 className="mt-6 text-2xl">{t}</h3>
              <p className="mx-auto mt-2 max-w-xs text-ink-soft">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Outfits */}
      <section className="border-y border-gold/30 bg-silk">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-14 sm:px-6 sm:py-20 md:grid-cols-2">
          <div className="grid grid-cols-2 gap-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/samples/bride.jpg" alt="Bride in an emerald lehenga for the Sangeet" className="arch aspect-[3/4] w-full border-4 border-white object-cover shadow-[0_24px_40px_-24px_rgba(74,13,26,0.55)]" loading="lazy" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/samples/groom.jpg" alt="Groom in an ivory and gold sherwani" className="arch mt-12 aspect-[3/4] w-full border-4 border-white object-cover shadow-[0_24px_40px_-24px_rgba(74,13,26,0.55)]" loading="lazy" />
          </div>
          <div>
            <Divider className="!justify-start" />
            <h2 className="mt-4 text-[2.2rem] sm:text-[2.8rem]">The two of you, in your decor</h2>
            <p className="mt-4 text-ink-soft">
              Outfits matched to each event&apos;s decor, so the lehenga stands out and the family photographs as one.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "Lehenga, saree, Kanjeevaram, sharara, gharara, anarkali",
                "Sherwani, achkan, bandhgala, veshti, kurta and safa",
                "Optional likeness from your own photos, deleted within 7 days",
              ].map((x) => (
                <li key={x} className="flex gap-3">
                  <span className="mt-2.5 h-2 w-2 flex-none rotate-45 bg-gold" aria-hidden="true" />
                  {x}
                </li>
              ))}
            </ul>
            <div className="cta-row mt-9 flex flex-wrap gap-3">
              <Link href="/create" className="btn btn-primary">Make a free preview</Link>
              <Link href="/looks" className="btn btn-ghost">Just want portraits? See Looks</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="relative" id="pricing">
        <div className="bg-jaali absolute inset-0 opacity-70 [mask-image:linear-gradient(180deg,transparent,#000_30%,#000_70%,transparent)]" aria-hidden="true" />
        <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <SectionTitle title="Simple, one-time pricing" intro="Try two images free before you choose." />
          <div className="mt-14">
            <PricingCards />
          </div>
        </div>
      </section>

      {/* Decorators */}
      {/* (kept on the product page too: decorators land here from search) */}
      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6 sm:pb-20">
        <div className="relative overflow-hidden rounded-[30px] bg-maroon p-2">
          <div className="relative overflow-hidden rounded-[24px] border border-gold-light/50 p-6 sm:p-12">
            <div className="bg-jaali-dark absolute inset-0" aria-hidden="true" />
            <Mandala className="absolute -right-24 -top-24 h-[360px] w-[360px]" color="#ecd08a" opacity={0.25} />
            <div className="relative grid items-center gap-8 md:grid-cols-[1.3fr_1fr]">
              <div>
                <h2 className="text-[1.8rem] text-[#fff8ef] sm:text-[2.5rem]">Decorators: close the booking in the first meeting</h2>
                <p className="mt-3 text-[#f3e3d3]">Sketch with the couple, show a photo-real mandap, send a branded proposal. From {formatUSD(PLANS.pro.monthlyCents)} a month.</p>
              </div>
              <div className="cta-row flex flex-wrap gap-3 md:justify-end">
                <Link href="/pro" className="btn btn-gold">See MandapCanvas Pro</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 pb-24 sm:px-6">
        <SectionTitle title="Questions couples ask" />
        <div className="mt-8 divide-y divide-gold/30 border-y border-gold/40">
          {FAQ.slice(0, 6).map((f) => (
            <details key={f.q} className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-medium">
                {f.q}
                <span className="grid h-7 w-7 flex-none rotate-45 place-items-center border border-gold text-kumkum transition group-open:bg-kumkum group-open:text-white" aria-hidden="true">
                  <span className="-rotate-45 text-lg leading-none">+</span>
                </span>
              </summary>
              <p className="mt-2 text-ink-soft">{f.a}</p>
            </details>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link href="/faq" className="btn btn-ghost">All questions</Link>
        </div>
      </section>
    </PageShell>
  );
}
