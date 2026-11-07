import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/SiteChrome";
import { BeforeAfter } from "@/components/BeforeAfter";
import { PlanButton } from "@/components/PlanButton";
import { currentUser } from "@/lib/auth";
import { PLANS, SITE, formatUSD, type PlanId } from "@/lib/config";

export const metadata: Metadata = {
  title: "For decorators and planners",
  description:
    "Turn a sketch into a photo-real mandap during the client meeting. Branded proposals and share links for South Asian wedding decorators, florists and planners.",
};

export default async function Pro(props: { searchParams: Promise<{ interval?: string }> }) {
  const user = await currentUser();
  const sp = await props.searchParams;
  const interval = sp.interval === "year" ? "year" : "month";
  return (
    <PageShell>
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-10 sm:px-6 md:grid-cols-[1fr_1.05fr] md:pt-16">
        <div>
          <h1 className="text-[2.5rem] sm:text-[3.3rem]">Show the couple their mandap before they leave the meeting.</h1>
          <p className="mt-5 max-w-xl text-lg text-ink-soft">
            Sketch on an iPad or paper, snap a photo, and in under a minute your client sees it photo-real — in their colors, at their
            venue. Then send a proposal with your logo. Couples book what they can see.
          </p>
          <div className="cta-row mt-8 flex flex-wrap gap-3">
            <a href="#plans" className="btn btn-primary">See plans</a>
            <Link href="/create" className="btn btn-ghost">Try a free preview</Link>
          </div>
        </div>
        <BeforeAfter
          before="/samples/hero-before.jpg"
          after="/samples/hero-after.jpg"
          beforeAlt="A decorator's mandap sketch"
          afterAlt="The mandap as a photo-real preview"
        />
      </section>

      <section className="border-y border-line bg-silk">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-3">
          {[
            ["Faster than a 3D render", "Rendering studios take days and charge per image. Previews here take seconds and cost cents, so you can show five options instead of one."],
            ["Your brand, not ours", "Client links and PDF proposals carry your logo, colors, website and phone number. MandapCanvas stays out of the way."],
            ["Built for Desi weddings", "Mandaps, Anand Karaj halls, Nikah stages, Haldi and Sangeet setups — with tradition-correct details and U.S.-sourceable florals."],
          ].map(([t, d]) => (
            <div key={t}>
              <h2 className="text-2xl">{t}</h2>
              <p className="mt-2 text-ink-soft">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-[2.1rem] sm:text-[2.5rem]">How decorators use it</h2>
        <ol className="mt-8 grid gap-8 md:grid-cols-4">
          {[
            ["Sketch in the consult", "Draw on screen or photograph your paper sketch."],
            ["Show it live", "Two palettes side by side while the family is in the room."],
            ["Send the proposal", "A branded link the couple forwards to parents. They heart favorites."],
            ["Book the job", "Follow up with the looks they loved most."],
          ].map(([t, d], i) => (
            <li key={t} className="relative pl-12">
              <span className="absolute left-0 top-0 grid h-9 w-9 place-items-center rounded-full bg-kumkum font-display text-lg text-white">{i + 1}</span>
              <h3 className="text-xl">{t}</h3>
              <p className="mt-1 text-ink-soft">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section id="plans" className="scroll-mt-20 border-t border-line bg-silk">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-[2.1rem] sm:text-[2.5rem]">Plans</h2>
              <p className="mt-2 text-ink-soft">Cancel any time. Unused images roll over while your plan is active.</p>
            </div>
            <div className="inline-flex rounded-full border border-line bg-white p-1" role="group" aria-label="Billing interval">
              <Link href="/pro?interval=month#plans" aria-current={interval === "month"} className={`rounded-full px-4 py-1.5 text-sm font-medium ${interval === "month" ? "bg-ink text-white" : "text-ink-soft"}`}>Monthly</Link>
              <Link href="/pro?interval=year#plans" aria-current={interval === "year"} className={`rounded-full px-4 py-1.5 text-sm font-medium ${interval === "year" ? "bg-ink text-white" : "text-ink-soft"}`}>Yearly, 2 months free</Link>
            </div>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {(Object.keys(PLANS) as PlanId[]).map((id) => {
              const p = PLANS[id];
              const price = interval === "year" ? p.yearlyCents / 12 : p.monthlyCents;
              return (
                <div key={id} className={`flex flex-col rounded-[22px] border p-7 ${id === "pro" ? "border-kumkum bg-white" : "border-line bg-white"}`}>
                  <h3 className="text-[1.9rem]">{p.name}</h3>
                  <p className="text-ink-soft">{p.blurb}</p>
                  <p className="mt-5 flex items-baseline gap-2">
                    <span className="font-display text-5xl">{formatUSD(Math.round(price))}</span>
                    <span className="text-sm text-ink-soft">per month{interval === "year" ? `, billed ${formatUSD(p.yearlyCents)} yearly` : ""}</span>
                  </p>
                  <ul className="mt-5 space-y-2">
                    {p.includes.map((i) => (
                      <li key={i} className="flex gap-2.5">
                        <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-marigold" aria-hidden="true" />
                        {i}
                      </li>
                    ))}
                  </ul>
                  <PlanButton planId={id} interval={interval} signedIn={!!user} current={user?.plan === id} primary={id === "pro"} />
                </div>
              );
            })}
          </div>
          <p className="mt-6 text-sm text-ink-soft">
            Founding offer for the first 10 decorators: 10% off for 6 months. Email{" "}
            <a className="underline" href={`mailto:${SITE.supportEmail}?subject=Founding%20decorator`}>{SITE.supportEmail}</a> for your code.
          </p>
        </div>
      </section>
    </PageShell>
  );
}
