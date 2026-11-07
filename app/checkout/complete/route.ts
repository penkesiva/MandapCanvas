import { NextResponse } from "next/server";
import { claimAnonCreations } from "@/lib/creations";
import { anonId, startSession } from "@/lib/auth";
import { claimAnonAlbums } from "@/lib/albums";
import { stripe } from "@/lib/billing";
import { flags, SITE } from "@/lib/config";
import { getJSON, kv } from "@/lib/kv";
import type { User } from "@/lib/types";

export const runtime = "nodejs";

/** Signs the buyer in after a verified, paid Stripe session (pages can't set cookies, route handlers can). */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get("session_id") ?? "";
  const to = url.searchParams.get("to") ?? "/account";
  const safeTo = to.startsWith("/") && !to.startsWith("//") ? to : "/account";
  if (!flags.stripeEnabled() || !sessionId) return NextResponse.redirect(`${SITE.url}/account`);

  // Only allow a session to sign someone in once, shortly after purchase.
  const first = await kv().set(`checkout-login:${sessionId}`, "1", { nx: true, ex: 60 * 60 * 24 * 30 });
  const s = await stripe().checkout.sessions.retrieve(sessionId).catch(() => null);
  const fresh = s && Date.now() / 1000 - s.created < 60 * 60 * 2;
  const paid = s && (s.payment_status === "paid" || s.payment_status === "no_payment_required" || s.status === "complete");
  if (first && s && fresh && paid) {
    const email = (s.customer_details?.email || s.customer_email || "").toLowerCase();
    const userId = s.metadata?.userId || (email ? await kv().get(`user:email:${email}`) : null);
    const user = userId ? await getJSON<User>(`user:${userId}`) : null;
    if (user) {
      await Promise.all([claimAnonAlbums(await anonId(false), user.id), claimAnonCreations(await anonId(false), user.id)]);
      await startSession(user.id);
    }
  }
  return NextResponse.redirect(`${SITE.url}${safeTo}`);
}
