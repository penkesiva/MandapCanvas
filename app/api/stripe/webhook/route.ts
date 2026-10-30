import { NextResponse } from "next/server";
import { handleStripeEvent, stripe } from "@/lib/billing";

export const runtime = "nodejs";

/**
 * Stripe webhook. In the Stripe dashboard, send these events to /api/stripe/webhook:
 * checkout.session.completed, checkout.session.async_payment_succeeded, invoice.paid,
 * customer.subscription.updated, customer.subscription.deleted
 */
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook secret not configured." }, { status: 500 });
  const sig = request.headers.get("stripe-signature");
  const body = await request.text();
  let event;
  try {
    event = stripe().webhooks.constructEvent(body, sig ?? "", secret);
  } catch (e) {
    console.error("stripe signature check failed", e);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }
  try {
    await handleStripeEvent(event);
  } catch (e) {
    // Returning 500 makes Stripe retry; fulfillment is idempotent.
    console.error("stripe event failed", event.type, event.id, e);
    return NextResponse.json({ error: "Handler failed." }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}
