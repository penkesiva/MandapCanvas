import { redirect } from "next/navigation";
import Link from "next/link";
import { PageShell } from "@/components/SiteChrome";
import { fulfillCheckoutSession, stripe } from "@/lib/billing";
import { flags } from "@/lib/config";

export const dynamic = "force-dynamic";

/**
 * Stripe sends buyers here. Fulfillment also runs from the webhook; both paths are idempotent,
 * so the album starts even if the webhook is slow. Session cookie is set by /checkout/complete.
 */
export default async function CheckoutSuccess(props: { searchParams: Promise<{ session_id?: string }> }) {
  const { session_id } = await props.searchParams;
  if (!session_id || !flags.stripeEnabled()) redirect("/account");

  let dest: string | null = null;
  try {
    const session = await stripe().checkout.sessions.retrieve(session_id);
    const res = await fulfillCheckoutSession(session);
    if (res.userId) {
      const q = new URLSearchParams({ session_id, to: res.albumId ? `/album/${res.albumId}?welcome=1` : "/account?welcome=pro" });
      dest = `/checkout/complete?${q}`;
    }
  } catch (e) {
    console.error("checkout success failed", e);
  }
  if (dest) redirect(dest);

  return (
    <PageShell>
      <div className="mx-auto max-w-xl px-4 py-24 text-center sm:px-6">
        <h1 className="text-[2.2rem]">Thank you</h1>
        <p className="mt-3 text-ink-soft">
          Your payment is confirmed and we&apos;re setting things up. This usually takes a few seconds. We&apos;ve also emailed you a link.
        </p>
        <Link href="/account" className="btn btn-primary mt-8">Go to my albums</Link>
      </div>
    </PageShell>
  );
}
