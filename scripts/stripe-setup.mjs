#!/usr/bin/env node
/**
 * One-time Stripe setup for MandapCanvas. Safe to run more than once: it skips anything that exists.
 *
 * Creates:
 *  - the webhook endpoint with the 5 events the site listens to (prints its signing secret)
 *  - FOUNDING: $20 off once, 25 uses, promotion code needs a $29 minimum (so it can't zero a Look Pack)
 *  - FOUNDINGPRO: 50% off for 6 months, 10 uses (decorator Pro plans)
 *
 * Run from the project folder (the key is typed, not saved in shell history):
 *   read -s STRIPE_SECRET_KEY && export STRIPE_SECRET_KEY && node scripts/stripe-setup.mjs
 * Optional: WEBHOOK_URL=https://www.mandapcanvas.com/api/stripe/webhook (default: the vercel.app URL).
 */
import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error("Set STRIPE_SECRET_KEY first (see the comment at the top of this file).");
  process.exit(1);
}
const live = key.startsWith("sk_live_") || key.startsWith("rk_live_");
const stripe = new Stripe(key);
const url = process.env.WEBHOOK_URL || "https://mandap-canvas.vercel.app/api/stripe/webhook";
const EVENTS = [
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "invoice.paid",
  "customer.subscription.updated",
  "customer.subscription.deleted",
];

console.log(`\nStripe ${live ? "LIVE" : "TEST"} mode\n`);

// 1. Webhook
const hooks = await stripe.webhookEndpoints.list({ limit: 100 });
const existing = hooks.data.find((h) => h.url === url);
if (existing) {
  const missing = EVENTS.filter((e) => !existing.enabled_events.includes(e) && !existing.enabled_events.includes("*"));
  if (missing.length) {
    await stripe.webhookEndpoints.update(existing.id, { enabled_events: [...new Set([...existing.enabled_events, ...EVENTS])] });
    console.log(`✓ Webhook already existed; added ${missing.length} missing event(s).`);
  } else console.log("✓ Webhook already exists with all 5 events.");
  console.log("  Its signing secret is in Stripe → Developers → Webhooks → this endpoint → Reveal secret.");
} else {
  const hook = await stripe.webhookEndpoints.create({ url, enabled_events: EVENTS, description: "MandapCanvas site" });
  console.log("✓ Webhook created:", url);
  console.log("\n  Paste this into Vercel as STRIPE_WEBHOOK_SECRET (Sensitive):\n");
  console.log("  " + hook.secret + "\n");
}

// 2. Coupons + promotion codes
async function ensureCoupon(id, params) {
  try {
    await stripe.coupons.retrieve(id);
    console.log(`✓ Coupon ${id} already exists.`);
  } catch {
    await stripe.coupons.create({ id, ...params });
    console.log(`✓ Coupon ${id} created.`);
  }
}
async function ensurePromo(code, coupon, restrictions) {
  const found = await stripe.promotionCodes.list({ code, limit: 1 });
  if (found.data.length) return console.log(`✓ Promotion code ${code} already exists.`);
  await stripe.promotionCodes.create({ code, promotion: { type: "coupon", coupon }, ...(restrictions ? { restrictions } : {}) });
  console.log(`✓ Promotion code ${code} created.`);
}

await ensureCoupon("FOUNDING", { name: "Founding couple: $20 off", amount_off: 2000, currency: "usd", duration: "once", max_redemptions: 25 });
await ensurePromo("FOUNDING", "FOUNDING", { minimum_amount: 2900, minimum_amount_currency: "usd" });

await ensureCoupon("FOUNDINGPRO", { name: "Founding decorator: 50% off for 6 months", percent_off: 50, duration: "repeating", duration_in_months: 6, max_redemptions: 10 });
await ensurePromo("FOUNDINGPRO", "FOUNDINGPRO");

console.log("\nDone. Next: add STRIPE_WEBHOOK_SECRET in Vercel, then Redeploy.\n");
