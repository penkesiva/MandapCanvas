import Link from "next/link";
import { PageShell } from "@/components/SiteChrome";
import { BeforeAfter } from "@/components/BeforeAfter";
import { Divider, Mandala, SectionTitle } from "@/components/Ornaments";
import { LookExamples } from "@/components/looks/LookExamples";
import { NavratriStrip } from "@/components/looks/NavratriStrip";
import { Bride, Groom } from "@/components/tools/Figures";
import { ToolArt } from "@/components/tools/ToolArt";
import { FAQ } from "@/lib/faq";
import { ALBUM_PACKS, LOOK_PACKS, PACKS, PLANS, formatUSD } from "@/lib/config";
import { DECOR_PRESETS } from "@/lib/catalog";
import { FREE_TOOLS, toolHref } from "@/lib/tools";

const LOOK_EVENTS = [
  { name: "Haldi", bride: "#F2C14E", dupatta: "#F2A33A", groom: "#FFF3C4", safa: "#F2A33A", bg: "#FFF4D6" },
  { name: "Mehndi", bride: "#3E8E41", dupatta: "#E7849B", groom: "#F4E3B5", safa: "#3E8E41", bg: "#E9F4E4" },
  { name: "Sangeet", bride: "#B03A84", dupatta: "#E5B8D6", groom: "#22335E", safa: "#B03A84", bg: "#F6E6F1" },
  { name: "Wedding", bride: "#B3131B", dupatta: "#C2185B", groom: "#F6EFE2", safa: "#B3131B", bg: "#FBE7E1" },
  { name: "Reception", bride: "#1F3A6B", dupatta: "#C9A24B", groom: "#1E1E2A", safa: "#1E1E2A", bg: "#E5EAF4" },
];

const MANDAP_EVENTS = [
  { src: "/samples/haldi.jpg", name: "Haldi" },
  { src: "/samples/mehndi.jpg", name: "Mehndi" },
  { src: "/samples/sangeet.jpg", name: "Sangeet" },
  { src: "/samples/reception.jpg", name: "Reception" },
];

export default function Home() {
  const freeTools = FREE_TOOLS.filter((t) => t.slug !== "ai-bridal-look");
  return (
    <PageShell>
      {/* Hero: two front doors */}
      <section className="relative overflow-hidden">
        <div className="bg-jaali absolute inset-0 [mask-image:linear-gradient(180deg,#000_0%,transparent_80%)]" aria-hidden="true" />
        <Mandala className="absolute -right-56 -top-48 hidden h-[760px] w-[760px] md:block" opacity={0.22} />
        <div className="relative mx-auto max-w-6xl px-4 pb-12 pt-8 sm:px-6 sm:pb-16 md:pt-16">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-[2.6rem] text-maroon sm:text-[3.4rem] md:text-[4rem]">See your Desi wedding before it happens.</h1>
            <Divider className="mt-5" />
            <p className="mx-auto mt-4 max-w-2xl text-lg text-ink-soft">Two ways to start, both free.</p>
          </div>

          <div className="mt-8 grid gap-5 md:mt-10 md:grid-cols-2 md:gap-6">
            <Door
              href="/looks"
              title="See yourself"
              text="Upload a selfie. See yourself as a bride, groom or couple at every event."
              meta={`Try for free · Look Packs from ${formatUSD(PACKS.look12.priceCents)}`}
              cta="Try your look free"
              more={{ href: "/looks", label: "How it works" }}
            >
              <div className="p-4">
                <LookExamples compact />
              </div>
            </Door>
            <Door
              href="/create"
              title="See your mandap"
              text="Sketch it, upload a photo or pick a style. See your decor photo-real, event by event."
              meta={`Two previews free · Albums from ${formatUSD(PACKS.starter.priceCents)}`}
              cta="Design my mandap free"
              more={{ href: "/mandap", label: "How it works" }}
            >
              <div className="grid h-full grid-cols-[0.8fr_1fr] items-center gap-2 p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/samples/hero-before.jpg" alt="A hand-drawn mandap sketch" className="aspect-[3/4] w-full -rotate-2 rounded-lg border-4 border-white object-cover shadow-md" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/samples/hero-after.jpg" alt="The same mandap as a photo-real preview" className="aspect-[3/4] w-full rotate-1 rounded-xl border-4 border-gold-light object-cover shadow-lg" />
              </div>
            </Door>
          </div>

          <ul className="mx-auto mt-8 grid max-w-5xl grid-cols-2 gap-x-4 gap-y-4 text-center text-sm text-ink-soft sm:mt-10 sm:grid-cols-4">
            {[
              ["Made for Desi weddings", "in the U.S."],
              ["Every tradition", "Pheras to Nikah"],
              ["Free to try", "no card needed"],
              ["Private", "photos deleted in 7 days"],
            ].map(([a, b]) => (
              <li key={a}>
                <span className="block font-semibold text-ink">{a}</span>
                {b}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Product 1: Looks */}
      <section className="relative border-y border-gold/30 bg-silk">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1fr_1.05fr] lg:gap-12">
          <div>
            <p className="font-semibold text-kumkum">Bridal looks</p>
            <h2 className="mt-2 text-[2.1rem] sm:text-[2.8rem]">You, at every event. Still you.</h2>
            <p className="mt-4 text-ink-soft">One photo, a portrait for each event, in the outfit made for it. For the bride, the groom, or both.</p>
            <ul className="mt-6 grid grid-cols-5 gap-2" aria-label="Events in a Look Pack">
              {LOOK_EVENTS.map((e) => (
                <li key={e.name} className="flex flex-col items-center rounded-2xl pb-2 pt-2 text-xs font-semibold" style={{ background: e.bg }}>
                  <span className="flex h-16 items-end" aria-hidden="true">
                    <Groom outfit={e.groom} safa={e.safa} className="-mr-2.5 h-16 w-8" />
                    <Bride outfit={e.bride} dupatta={e.dupatta} className="h-16 w-8" />
                  </span>
                  {e.name}
                </li>
              ))}
            </ul>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link href="/looks" className="btn btn-primary">
                Try your look free
              </Link>
              <span className="text-sm text-ink-soft">
                Then {PACKS.look12.images} for {formatUSD(PACKS.look12.priceCents)} or {PACKS.look30.images} for {formatUSD(PACKS.look30.priceCents)}.
              </span>
            </div>
          </div>
          <LookExamples />
        </div>
      </section>

      {/* Festival looks: the nine-day strip is the one bold moment for the new collections */}
      <section className="bg-maroon-deep py-14 text-[#fff8ef] sm:py-20" aria-labelledby="navratri-h">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-xl">
              <h2 id="navratri-h" className="text-[2.2rem] text-gold-light sm:text-[2.8rem]">
                Nine days. Nine sarees. All you.
              </h2>
              <p className="mt-3 text-lg text-[#f3e3d3]">
                A Navratri portrait for every day, in that day&apos;s color, from a few of your selfies. Post one each morning.
              </p>
            </div>
            <div className="flex flex-col items-start gap-2 sm:items-end">
              <Link href="/looks/navratri" className="btn btn-gold">
                {PACKS.navratri9.images} portraits for {formatUSD(PACKS.navratri9.priceCents)}
              </Link>
              <Link href="/looks/maharani" className="text-sm font-semibold text-gold-light underline underline-offset-4">
                Or see yourself as a maharani
              </Link>
            </div>
          </div>
          <div className="mt-9">
            <NavratriStrip dark />
          </div>
          <p className="mt-4 text-xs text-[#cdb6a8]">Made from one photo of an AI model.</p>
        </div>
      </section>

      {/* Product 2: Mandap designs */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-12">
          <div className="frame-gold">
            <BeforeAfter
              before="/samples/hero-before.jpg"
              after="/samples/hero-after.jpg"
              beforeAlt="A decorator's hand-drawn sketch of a four-pillar mandap with a jaali backdrop"
              afterAlt="The same mandap as a photo-real preview in blush and ivory roses"
            />
          </div>
          <div>
            <p className="font-semibold text-kumkum">Mandap designs</p>
            <h2 className="mt-2 text-[2.1rem] sm:text-[2.8rem]">See your mandap before you book.</h2>
            <p className="mt-4 text-ink-soft">
              Draw it, upload a photo or pick one of {DECOR_PRESETS.length} styles. Compare palettes for every event, then share the link with the family.
            </p>
            <ul className="mt-6 grid grid-cols-4 gap-2">
              {MANDAP_EVENTS.map((e) => (
                <li key={e.name}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={e.src} alt={`${e.name} decor preview`} className="aspect-square w-full rounded-xl object-cover" loading="lazy" />
                  <span className="mt-1 block text-center text-xs font-semibold">{e.name}</span>
                </li>
              ))}
            </ul>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link href="/create" className="btn btn-primary">
                Design my mandap free
              </Link>
              <Link href="/mandap" className="btn btn-ghost">
                See the {DECOR_PRESETS.length} styles
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing at a glance */}
      <section className="relative overflow-hidden bg-maroon text-[#fff8ef]">
        <div className="bg-jaali-dark absolute inset-0" aria-hidden="true" />
        <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <SectionTitle tone="light" title="Try free. Pay once if you love it." intro="No subscriptions for couples." />
          <div className="mt-10 grid gap-5 md:mt-12 md:grid-cols-2 md:gap-6">
            <PriceColumn
              title="Bridal looks"
              note="Portraits of you at every event"
              rows={LOOK_PACKS.map((id) => [`${PACKS[id].images} portraits`, PACKS[id].priceCents, PACKS[id].listCents])}
              href="/looks"
              cta="Try your look free"
            />
            <PriceColumn
              title="Mandap designs"
              note="Your decor at every event, with you in it"
              rows={ALBUM_PACKS.map((id) => [`${PACKS[id].name}, ${PACKS[id].images} images`, PACKS[id].priceCents, undefined])}
              href="/create"
              cta="Design my mandap free"
            />
          </div>
          <p className="mt-8 text-center">
            <Link href="/pricing" className="font-semibold text-gold-light underline underline-offset-4">
              Compare everything on the pricing page
            </Link>
          </p>
        </div>
      </section>

      {/* Free tools */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <SectionTitle title="Free planning tools" intro="For the decisions every family argues about." />
        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:mt-12 lg:grid-cols-3">
          {freeTools.map((t) => (
            <li key={t.slug} className="flex">
              <Link href={toolHref(t)} className="group flex w-full flex-col overflow-hidden rounded-[20px] border border-gold/40 bg-white transition hover:border-gold">
                <ToolArt slug={t.slug} />
                <span className="flex flex-1 flex-col p-4">
                  <span className="block font-display text-xl text-maroon group-hover:text-kumkum">{t.name}</span>
                  <span className="mt-1 line-clamp-2 block text-sm text-ink-soft">{t.blurb}</span>
                  <span className="mt-auto self-end pt-3 text-sm font-semibold text-kumkum underline underline-offset-4">Open the tool</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-8 text-center">
          <Link href="/tools" className="btn btn-ghost">
            All free tools
          </Link>
        </div>
      </section>

      {/* Decorators */}
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
              <div className="flex flex-wrap gap-3 md:justify-end">
                <Link href="/pro" className="btn btn-gold">
                  See MandapCanvas Pro
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 pb-16 sm:px-6 sm:pb-24">
        <SectionTitle title="Questions couples ask" />
        <div className="mt-8 divide-y divide-gold/30 border-y border-gold/40">
          {FAQ.slice(0, 4).map((f) => (
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
          <Link href="/faq" className="btn btn-ghost">
            All questions
          </Link>
        </div>
      </section>
    </PageShell>
  );
}

function Door({
  href,
  title,
  text,
  meta,
  cta,
  more,
  children,
}: {
  href: string;
  title: string;
  text: string;
  meta: string;
  cta: string;
  more: { href: string; label: string };
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col overflow-hidden rounded-[28px] border border-gold/50 bg-white shadow-[0_30px_60px_-40px_rgba(74,13,26,0.55)]">
      <div className="bg-[linear-gradient(135deg,#fbf1ee,#f6e7c8)]">{children}</div>
      <div className="flex flex-1 flex-col p-6 sm:p-7">
        <h2 className="text-[2rem] text-maroon">{title}</h2>
        <p className="mt-2 text-ink-soft">{text}</p>
        <p className="mt-3 text-sm font-semibold text-mehndi">{meta}</p>
        <div className="mt-auto flex flex-wrap items-center gap-4 pt-5">
          <Link href={href} className="btn btn-primary">
            {cta}
          </Link>
          <Link href={more.href} className="font-semibold text-kumkum underline underline-offset-4">
            {more.label}
          </Link>
        </div>
      </div>
    </div>
  );
}

function PriceColumn({
  title,
  note,
  rows,
  href,
  cta,
}: {
  title: string;
  note: string;
  rows: [string, number, number | undefined][];
  href: string;
  cta: string;
}) {
  return (
    <div className="flex flex-col rounded-[24px] border border-gold-light/40 bg-white/5 p-6 backdrop-blur-sm">
      <p className="font-display text-2xl text-gold-light">{title}</p>
      <p className="text-sm text-[#f3e3d3]">{note}</p>
      <ul className="mt-4 divide-y divide-gold-light/20">
        {rows.map(([label, price, list]) => (
          <li key={label} className="flex items-baseline justify-between gap-3 py-2.5">
            <span>{label}</span>
            <span className="flex-none">
              {list ? <s className="mr-1.5 text-sm text-[#d9c3b3]">{formatUSD(list)}</s> : null}
              <span className="font-display text-xl text-gold-light">{formatUSD(price)}</span>
            </span>
          </li>
        ))}
      </ul>
      <Link href={href} className="btn btn-gold mt-5 self-start">
        {cta}
      </Link>
    </div>
  );
}
