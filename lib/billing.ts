import "server-only";
import Stripe from "stripe";
import { COLLECTION_PACKS, LOOK_PACKS, PACKS, VENUE_PACKS, PLANS, SITE, type PackId, type PlanId } from "./config";
import { kv } from "./kv";
import { findOrCreateUser, getUserById, saveUser } from "./auth";
import { addCredits, attachAlbumToUser, fundAlbum, getAlbum, saveAlbum, spendCredits } from "./albums";
import { recordStat } from "./stats";
import { sendReceiptNote } from "./email";
import type { User } from "./types";

let stripeClient: Stripe | null = null;
export function stripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("Stripe is not configured.");
  if (!stripeClient) stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
  return stripeClient;
}

/* ---------------------------------------------------------------- checkout */

export async function packCheckoutUrl(opts: { packId: PackId; albumId: string; user: User | null }): Promise<string> {
  const pack = PACKS[opts.packId];
  const session = await stripe().checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: pack.priceCents,
          product_data: {
            name: VENUE_PACKS.includes(pack.id)
              ? `MandapCanvas Venue pack, your space ${pack.images} ways`
              : LOOK_PACKS.includes(pack.id)
              ? `MandapCanvas Wedding Look Pack, ${pack.images} portraits`
              : COLLECTION_PACKS.includes(pack.id)
                ? `MandapCanvas ${pack.name.replace(/ \d+$/, "")} portraits, ${pack.images}`
                : `MandapCanvas ${pack.name}${pack.id === "topup" ? "" : " album"}`,
            description: VENUE_PACKS.includes(pack.id)
              ? `${pack.images} AI decor designs of your own venue photo`
              : LOOK_PACKS.includes(pack.id)
              ? `${pack.images} AI wedding portraits from your photos`
              : COLLECTION_PACKS.includes(pack.id)
                ? `${pack.images} AI saree portraits from your photos`
                : `${pack.images} AI wedding concept images`,
          },
        },
      },
    ],
    customer_email: opts.user?.email,
    allow_promotion_codes: true,
    metadata: { kind: "pack", packId: pack.id, albumId: opts.albumId, userId: opts.user?.id ?? "" },
    payment_intent_data: { metadata: { kind: "pack", packId: pack.id, albumId: opts.albumId } },
    success_url: `${SITE.url}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${SITE.url}/album/${opts.albumId}?checkout=canceled`,
  });
  if (!session.url) throw new Error("Stripe did not return a checkout URL.");
  return session.url;
}

export async function planCheckoutUrl(opts: { planId: PlanId; interval: "month" | "year"; user: User }): Promise<string> {
  const plan = PLANS[opts.planId];
  const session = await stripe().checkout.sessions.create({
    mode: "subscription",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: opts.interval === "year" ? plan.yearlyCents : plan.monthlyCents,
          recurring: { interval: opts.interval },
          product_data: { name: `MandapCanvas ${plan.name}`, description: `${plan.monthlyImages} images per month` },
        },
      },
    ],
    ...(opts.user.stripeCustomerId ? { customer: opts.user.stripeCustomerId } : { customer_email: opts.user.email }),
    allow_promotion_codes: true,
    subscription_data: {
      metadata: { userId: opts.user.id, planId: plan.id, interval: opts.interval },
      trial_period_days: Number(process.env.PRO_TRIAL_DAYS) || undefined,
    },
    metadata: { kind: "plan", planId: plan.id, userId: opts.user.id, interval: opts.interval },
    success_url: `${SITE.url}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${SITE.url}/pro?checkout=canceled`,
  });
  if (!session.url) throw new Error("Stripe did not return a checkout URL.");
  return session.url;
}

export async function billingPortalUrl(user: User): Promise<string> {
  if (!user.stripeCustomerId) throw new Error("No billing account yet.");
  const s = await stripe().billingPortal.sessions.create({ customer: user.stripeCustomerId, return_url: `${SITE.url}/account` });
  return s.url;
}

/* ---------------------------------------------------------------- fulfillment (shared by webhook, success page, dev checkout) */

async function once(key: string): Promise<boolean> {
  return kv().set(`fulfilled:${key}`, String(Date.now()), { nx: true });
}

export async function fulfillPack(opts: {
  ref: string;
  email: string;
  packId: PackId;
  albumId: string;
  amountCents: number;
}): Promise<{ userId: string; albumId: string } | null> {
  const album = await getAlbum(opts.albumId);
  if (!album) throw new Error(`Album ${opts.albumId} not found for order ${opts.ref}`);
  const user = album.ownerUserId ? await getUserById(album.ownerUserId) : await findOrCreateUser(opts.email);
  if (!user) throw new Error("Album owner missing.");
  if (!(await once(opts.ref))) return { userId: user.id, albumId: album.id };

  const pack = PACKS[opts.packId];
  await attachAlbumToUser(album, user.id);
  if (opts.packId !== "topup") album.packId = opts.packId;
  await saveAlbum(album);
  await addCredits(user.id, { at: Date.now(), delta: pack.images, reason: "purchase", ref: opts.ref, amountCents: opts.amountCents });
  await spendCredits(user.id, pack.images, { at: Date.now(), reason: "album_allocation", ref: album.id });
  const fresh = (await getAlbum(album.id)) ?? album;
  if (opts.packId !== "topup") fresh.packId = opts.packId;
  await fundAlbum(fresh, pack.images, pack.freeRegens);
  await recordStat({ revenueCents: opts.amountCents, orders: 1 });
  await sendReceiptNote(user.email, `your ${pack.name} pack (${pack.images} images) for "${album.title}" is being created`).catch(() => {});
  return { userId: user.id, albumId: album.id };
}

export async function activatePlan(opts: {
  userId: string;
  planId: PlanId;
  customerId?: string;
  subscriptionId?: string;
}): Promise<User | null> {
  const user = await getUserById(opts.userId);
  if (!user) return null;
  user.plan = opts.planId;
  user.planStatus = "active";
  if (opts.customerId) user.stripeCustomerId = opts.customerId;
  if (opts.subscriptionId) user.subscriptionId = opts.subscriptionId;
  if (!user.brand) user.brand = { businessName: user.email.split("@")[0], accent: "#9E1B32" };
  await saveUser(user);
  return user;
}

export async function grantPlanCredits(opts: { ref: string; userId: string; planId: PlanId; amountCents: number }): Promise<void> {
  if (!(await once(opts.ref))) return;
  const plan = PLANS[opts.planId];
  await addCredits(opts.userId, { at: Date.now(), delta: plan.monthlyImages, reason: "subscription", ref: opts.ref, amountCents: opts.amountCents });
  await recordStat({ revenueCents: opts.amountCents, subscriptions: 1 });
}

export async function deactivatePlan(userId: string, status: User["planStatus"]): Promise<void> {
  const user = await getUserById(userId);
  if (!user) return;
  user.planStatus = status;
  if (status === "canceled") user.plan = null;
  await saveUser(user);
}

/* ---------------------------------------------------------------- webhook */

export async function handleStripeEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      const s = event.data.object as Stripe.Checkout.Session;
      await fulfillCheckoutSession(s);
      break;
    }
    case "invoice.paid": {
      const inv = event.data.object as Stripe.Invoice;
      const meta = inv.parent?.subscription_details?.metadata ?? {};
      const userId = meta.userId;
      const planId = meta.planId as PlanId | undefined;
      if (userId && planId && planId in PLANS) {
        await grantPlanCredits({ ref: `inv_${inv.id}`, userId, planId, amountCents: inv.amount_paid });
      }
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const userId = sub.metadata?.userId;
      if (!userId) break;
      if (event.type === "customer.subscription.deleted" || sub.status === "canceled") await deactivatePlan(userId, "canceled");
      else if (sub.status === "past_due" || sub.status === "unpaid") await deactivatePlan(userId, "past_due");
      else if (sub.status === "active" || sub.status === "trialing") {
        const planId = sub.metadata?.planId as PlanId | undefined;
        if (planId && planId in PLANS) await activatePlan({ userId, planId, subscriptionId: sub.id });
      }
      break;
    }
  }
}

export async function fulfillCheckoutSession(s: Stripe.Checkout.Session): Promise<{ userId?: string; albumId?: string; kind?: string }> {
  const meta = s.metadata ?? {};
  if (meta.kind === "pack") {
    if (s.payment_status !== "paid" && s.payment_status !== "no_payment_required") return { kind: "pack" };
    const email = s.customer_details?.email || s.customer_email;
    if (!email) throw new Error(`Checkout ${s.id} has no email`);
    const res = await fulfillPack({
      ref: s.id,
      email,
      packId: meta.packId as PackId,
      albumId: meta.albumId,
      amountCents: s.amount_total ?? 0,
    });
    return { ...res, kind: "pack" };
  }
  if (meta.kind === "plan") {
    const user = await activatePlan({
      userId: meta.userId,
      planId: meta.planId as PlanId,
      customerId: typeof s.customer === "string" ? s.customer : s.customer?.id,
      subscriptionId: typeof s.subscription === "string" ? s.subscription : s.subscription?.id,
    });
    return { userId: user?.id, kind: "plan" };
  }
  return {};
}
