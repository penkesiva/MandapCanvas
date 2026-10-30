import { notFound } from "next/navigation";
import { PageShell } from "@/components/SiteChrome";
import { DevCheckoutForm } from "@/components/DevCheckoutForm";
import { flags, PACKS, PLANS, formatUSD, type PackId, type PlanId } from "@/lib/config";
import { currentUser } from "@/lib/auth";

export default async function DevCheckout(props: { searchParams: Promise<Record<string, string>> }) {
  if (!flags.devCheckout()) notFound();
  const sp = await props.searchParams;
  const user = await currentUser();
  const item =
    sp.kind === "plan"
      ? `${PLANS[sp.planId as PlanId]?.name} plan, ${formatUSD(PLANS[sp.planId as PlanId]?.monthlyCents ?? 0)}/month`
      : `${PACKS[sp.packId as PackId]?.name} pack, ${formatUSD(PACKS[sp.packId as PackId]?.priceCents ?? 0)}`;
  return (
    <PageShell>
      <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
        <p className="rounded-full bg-marigold/30 px-3 py-1 text-center text-sm font-semibold">Test checkout — no card is charged</p>
        <h1 className="mt-6 text-[2.2rem]">Checkout</h1>
        <p className="mt-2 text-ink-soft">{item}</p>
        <p className="mt-1 text-sm text-ink-soft">This page only appears while Stripe isn&apos;t configured. Add STRIPE_SECRET_KEY to use real checkout.</p>
        <DevCheckoutForm params={sp} defaultEmail={user?.email ?? ""} />
      </div>
    </PageShell>
  );
}
