#!/usr/bin/env node
/**
 * One-time Stripe setup for MandapCanvas. Safe to run more than once: it skips anything that exists.
 *
 * Creates:
 *  - the webhook endpoint with the 5 events the site listens to (prints its signing secret)
 *  - FOUNDING: 25% off one order, 25 uses, created SWITCHED OFF as a backup (turn it on in Stripe → Coupons when wanted);
 *    the old $20-off version of the code is switched off
 *  - FOUNDINGPRO: 10% off for 6 months, 10 uses (decorator Pro plans; coupon FOUNDINGPRO10)
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

// FOUNDING used to be $20 off (coupon "FOUNDING"). With albums from $9.99 it is now 25% off (coupon "FOUNDING25").
// Stripe can't change a coupon's amount, so the old promotion code is switched off and the same code re-created.
await ensureCoupon("FOUNDING25", { name: "Founding couple: 25% off", percent_off: 25, duration: "once", max_redemptions: 25 });
{
  const old = await stripe.promotionCodes.list({ code: "FOUNDING", active: true, limit: 10 });
  for (const pc of old.data) {
    const couponId = typeof pc.promotion?.coupon === "string" ? pc.promotion.coupon : pc.promotion?.coupon?.id ?? pc.coupon?.id;
    if (couponId !== "FOUNDING25") {
      await stripe.promotionCodes.update(pc.id, { active: false });
      console.log("✓ Switched off the old $20-off FOUNDING code.");
    }
  }
  // Kept as a backup: created switched off. Turn it on in Stripe (Product catalog → Coupons → FOUNDING25 → the code) when wanted.
  const all = await stripe.promotionCodes.list({ code: "FOUNDING", limit: 10 });
  const backup = all.data.find((pc) => (typeof pc.promotion?.coupon === "string" ? pc.promotion.coupon : pc.promotion?.coupon?.id ?? pc.coupon?.id) === "FOUNDING25");
  if (backup) console.log(`✓ Backup code FOUNDING (25% off) exists, currently ${backup.active ? "ON" : "off"}.`);
  else {
    await stripe.promotionCodes.create({ code: "FOUNDING", active: false, promotion: { type: "coupon", coupon: "FOUNDING25" } });
    console.log("✓ Backup code FOUNDING (25% off) created, switched off.");
  }
}

// Was 50% off (coupon "FOUNDINGPRO", now archived). Stripe can't change a coupon's percent, so 10% is a new coupon.
await ensureCoupon("FOUNDINGPRO10", { name: "Founding decorator: 10% off for 6 months", percent_off: 10, duration: "repeating", duration_in_months: 6, max_redemptions: 10 });
{
  const codes = await stripe.promotionCodes.list({ code: "FOUNDINGPRO", active: true, limit: 10 });
  const on = codes.data.find((pc) => (typeof pc.promotion?.coupon === "string" ? pc.promotion.coupon : pc.promotion?.coupon?.id ?? pc.coupon?.id) === "FOUNDINGPRO10");
  for (const pc of codes.data) if (pc !== on) await stripe.promotionCodes.update(pc.id, { active: false });
  if (on) console.log("✓ Promotion code FOUNDINGPRO (10% off) already exists.");
  else {
    await stripe.promotionCodes.create({ code: "FOUNDINGPRO", promotion: { type: "coupon", coupon: "FOUNDINGPRO10" } });
    console.log("✓ Promotion code FOUNDINGPRO created: 10% off for 6 months.");
  }
}

console.log("\nDone. Next: add STRIPE_WEBHOOK_SECRET in Vercel, then Redeploy.\n");
