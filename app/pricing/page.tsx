import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/SiteChrome";
import { PricingCards } from "@/components/PricingCards";
import { PACKS, PLANS, formatUSD } from "@/lib/config";

export const metadata: Metadata = {
  title: "Pricing",
  description: "One-time album packs for couples from $29. Monthly plans for decorators from $99. Two free previews before you pay.",
};

export default function Pricing() {
  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-4 pb-24 pt-12 sm:px-6">
        <h1 className="text-[2.6rem] sm:text-[3.2rem]">Pricing</h1>
        <p className="mt-3 max-w-2xl text-lg text-ink-soft">
          See two free images first. If you like them, pick a pack. No subscription for couples.
        </p>
        <div className="mt-10">
          <PricingCards />
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
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
