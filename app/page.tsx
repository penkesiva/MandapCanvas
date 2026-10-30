import Link from "next/link";
import { PageShell } from "@/components/SiteChrome";
import { BeforeAfter } from "@/components/BeforeAfter";
import { PricingCards } from "@/components/PricingCards";
import { FAQ } from "@/lib/faq";
import { PALETTES } from "@/lib/catalog";

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

export default function Home() {
  return (
    <PageShell>
      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-10 sm:px-6 md:grid-cols-[0.92fr_1.08fr] md:gap-12 md:pt-16">
        <div>
          <h1 className="text-[2.6rem] sm:text-[3.4rem] md:text-[3.9rem]">See your wedding before the first flower is ordered.</h1>
          <p className="mt-5 max-w-[34rem] text-lg text-ink-soft">
            Sketch your mandap, upload a photo you love, or pick a style. MandapCanvas turns it into a photo-real album of every
            event — decor, outfits and the two of you — in the colors you&apos;re choosing between.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/create" className="btn btn-primary">Make a free preview</Link>
            <Link href="/gallery" className="btn btn-ghost">See sample albums</Link>
          </div>
          <p className="mt-6 text-sm text-ink-soft">
            Two free images, no account needed. Albums from $29.
          </p>
        </div>
        <div>
          <BeforeAfter
            before="/samples/hero-before.jpg"
            after="/samples/hero-after.jpg"
            beforeAlt="A decorator's hand-drawn sketch of a four-pillar mandap with a jaali backdrop"
            afterAlt="The same mandap as a photo-real preview in blush and ivory roses"
            priority
          />
          <p className="mt-3 text-center text-sm text-ink-soft">Drag the garland. This preview was made from the sketch on the left.</p>
        </div>
      </section>

      {/* One sketch, every palette */}
      <section className="border-y border-line bg-silk">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="max-w-2xl">
            <h2 className="text-[2.1rem] sm:text-[2.6rem]">One design. Every palette you&apos;re torn between.</h2>
            <p className="mt-3 text-ink-soft">
              Families debate colors for months. Put the options side by side on your actual mandap, then send the link to everyone
              who has an opinion.
            </p>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {PALETTE_COMPARE.map(({ src, id }) => {
              const p = PALETTES.find((x) => x.id === id)!;
              return (
                <figure key={id} className="overflow-hidden rounded-[20px] bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`The mandap in ${p.name}`} className="aspect-[4/3] w-full object-cover" loading="lazy" />
                  <figcaption className="flex items-center gap-3 px-4 py-3">
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
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <h2 className="text-[2.1rem] sm:text-[2.6rem]">How it works</h2>
        <ol className="mt-10 grid gap-10 md:grid-cols-3">
          {[
            ["Start from your idea", "Draw on screen, upload a sketch or a photo from Instagram, or pick one of our styles. No drawing skills needed."],
            ["Tell us about your wedding", "Your tradition, the events you're having, up to six palettes, indoor or outdoor — and, if you like, photos of the two of you."],
            ["Get your album", "See two free previews in about a minute. Choose a pack and your full album fills in while you watch."],
          ].map(([t, d], i) => (
            <li key={t} className="relative pl-14">
              <span className="absolute left-0 top-0 grid h-10 w-10 place-items-center rounded-full bg-kumkum font-display text-xl text-white">{i + 1}</span>
              <h3 className="text-2xl">{t}</h3>
              <p className="mt-2 text-ink-soft">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Every event */}
      <section className="bg-ink text-white">
        <div className="mx-auto max-w-6xl px-4 pt-16 sm:px-6">
          <h2 className="text-[2.1rem] text-white sm:text-[2.6rem]">The whole week, not just the mandap</h2>
          <p className="mt-3 max-w-2xl text-white/75">
            Named and styled the way your family does it — Pheras or Muhurtham, Anand Karaj or Nikah, Garba or Sangeet.
          </p>
        </div>
        <div className="mx-auto mt-8 flex max-w-6xl snap-x scroll-px-4 gap-4 overflow-x-auto px-4 pb-16 sm:scroll-px-6 sm:px-6">
          {EVENTS_STRIP.map((e) => (
            <figure key={e.name} className="w-[78%] flex-none snap-start sm:w-[42%] md:w-[30%]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={e.src} alt={`${e.name} decor preview`} className="aspect-[4/3] w-full rounded-[18px] object-cover" loading="lazy" />
              <figcaption className="mt-3">
                <span className="font-display text-xl">{e.name}</span>
                <span className="block text-sm text-white/70">{e.note}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* Outfits */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 sm:px-6 md:grid-cols-2">
        <div className="grid grid-cols-2 gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/samples/bride.jpg" alt="Bride in an emerald lehenga for the Sangeet" className="aspect-[3/4] w-full rounded-[18px] object-cover" loading="lazy" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/samples/groom.jpg" alt="Groom in an ivory and gold sherwani" className="mt-10 aspect-[3/4] w-full rounded-[18px] object-cover" loading="lazy" />
        </div>
        <div>
          <h2 className="text-[2.1rem] sm:text-[2.6rem]">Outfits that belong in the room</h2>
          <p className="mt-4 text-ink-soft">
            Every look is matched to the decor palette of its event: a lehenga that doesn&apos;t disappear into the backdrop, a safa
            that picks up the florals, a bridal party that photographs as one family.
          </p>
          <ul className="mt-6 space-y-2">
            <li>Lehenga, saree, Kanjeevaram, sharara, gharara, anarkali</li>
            <li>Sherwani, achkan, bandhgala, veshti, kurta and safa</li>
            <li>Optional likeness from your own photos, deleted within 7 days</li>
          </ul>
          <Link href="/create" className="btn btn-primary mt-8">Make a free preview</Link>
        </div>
      </section>

      {/* Pricing */}
      <section className="border-t border-line bg-silk" id="pricing">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <h2 className="text-[2.1rem] sm:text-[2.6rem]">Simple, one-time pricing</h2>
          <p className="mt-3 max-w-2xl text-ink-soft">Less than a single decor consultation. Try two images free before you choose.</p>
          <div className="mt-10">
            <PricingCards />
          </div>
        </div>
      </section>

      {/* Decorators */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="grid items-center gap-10 rounded-[28px] bg-kumkum p-8 text-white sm:p-12 md:grid-cols-[1.3fr_1fr]">
          <div>
            <h2 className="text-[2rem] text-white sm:text-[2.5rem]">Decorators: close the booking in the first meeting</h2>
            <p className="mt-4 text-white/85">
              Sketch while the couple talks, show them a photo-real mandap before they leave, and send a proposal with your logo.
              Plans from $99 a month.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 md:justify-end">
            <Link href="/pro" className="btn bg-white text-kumkum hover:bg-milk">See MandapCanvas Pro</Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 pb-24 sm:px-6">
        <h2 className="text-[2.1rem] sm:text-[2.6rem]">Questions couples ask</h2>
        <div className="mt-6 divide-y divide-line border-y border-line">
          {FAQ.slice(0, 6).map((f) => (
            <details key={f.q} className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-medium">
                {f.q}
                <span className="text-2xl leading-none text-kumkum transition group-open:rotate-45" aria-hidden="true">+</span>
              </summary>
              <p className="mt-2 text-ink-soft">{f.a}</p>
            </details>
          ))}
        </div>
        <Link href="/faq" className="mt-6 inline-block font-medium text-kumkum underline underline-offset-4">All questions</Link>
      </section>
    </PageShell>
  );
}
