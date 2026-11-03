import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/SiteChrome";
import { PricingCards } from "@/components/PricingCards";
import { PACKS, PLANS, formatUSD } from "@/lib/config";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Bridal Look Packs from $10. Mandap design albums from $29. Monthly plans for decorators from $99. Two free previews before you pay.",
};

export default function Pricing() {
  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6 sm:pb-24 sm:pt-12">
        <h1 className="text-[2.6rem] sm:text-[3.2rem]">Pricing</h1>
        <p className="mt-3 max-w-2xl text-lg text-ink-soft">
          Try free first. Pay once if you love it. No subscriptions for couples.
        </p>
        <nav className="mt-6 flex flex-wrap gap-2" aria-label="Products">
          <a href="#looks" className="chip">Bridal looks</a>
          <a href="#mandap" className="chip">Mandap designs</a>
          <a href="#decorators" className="chip">Decorators</a>
        </nav>

        <section id="looks" className="mt-12 scroll-mt-24">
          <h2 className="text-[2rem] text-maroon">Bridal looks</h2>
          <p className="mt-1 max-w-2xl text-ink-soft">
            Portraits of you at every event, from your own photos. One free look first.{" "}
            <Link href="/looks" className="font-medium text-kumkum underline">How it works</Link>
          </p>
          <div className="mt-10">
            <PricingCards product="looks" />
          </div>
        </section>

        <section id="mandap" className="mt-20 scroll-mt-24">
          <h2 className="text-[2rem] text-maroon">Mandap designs</h2>
          <p className="mt-1 max-w-2xl text-ink-soft">
            Your decor for every event, photo-real, with the two of you in it. Two free previews first.{" "}
            <Link href="/mandap" className="font-medium text-kumkum underline">How it works</Link>
          </p>
          <div className="mt-10">
            <PricingCards />
          </div>
        </section>

        <div id="decorators" className="mt-12 grid scroll-mt-24 gap-4 md:grid-cols-2">
          <div className="rounded-[22px] border border-line bg-silk p-6">
            <p className="font-semibold">Need more images later?</p>
            <p className="mt-1 text-ink-soft">Add {PACKS.topup.images} images to any album for {formatUSD(PACKS.topup.priceCents)}.</p>
          </div>
          <div className="rounded-[22px] border border-line bg-silk p-6">
            <p className="font-semibold">Decorators and planners</p>
            <p className="mt-1 text-ink-soft">
              {PLANS.pro.name} is {formatUSD(PLANS.pro.monthlyCents)}/month for {PLANS.pro.monthlyImages} images and branded proposals.{" "}
              <Link href="/pro" className="font-medium text-kumkum underline">See plans</Link>
            </p>
          </div>
        </div>
        <p className="mt-8 text-sm text-ink-soft">
          Prices in USD. Payments are handled by Stripe. Not happy with your album? Email us within 14 days for a fix or a refund.
        </p>
      </div>
    </PageShell>
  );
}
