import { NextResponse } from "next/server";
import { anonId, currentUser, findOrCreateUser, isValidEmail, startSession } from "@/lib/auth";
import { claimAnonAlbums as claimAnonAlbumsFor } from "@/lib/albums";
import { flags, PACKS, PLANS, type PackId, type PlanId } from "@/lib/config";
import { activatePlan, fulfillPack, grantPlanCredits } from "@/lib/billing";
import { jsonError } from "@/lib/http";

export const runtime = "nodejs";

/** Test-only checkout used when Stripe isn't configured. Disabled automatically once STRIPE_SECRET_KEY is set. */
export async function POST(request: Request) {
  if (!flags.devCheckout()) return jsonError("Test checkout is disabled.", 404);
  const body = (await request.json().catch(() => null)) as Record<string, string> | null;
  if (!body) return jsonError("Invalid request.");
  const ref = `dev_${crypto.randomUUID()}`;

  if (body.kind === "pack") {
    const packId = body.packId as PackId;
    if (!(packId in PACKS)) return jsonError("Unknown pack.");
    const email = (body.email || "").trim();
    if (!isValidEmail(email)) return jsonError("Enter a valid email.");
    const res = await fulfillPack({ ref, email, packId, albumId: body.albumId, amountCents: PACKS[packId].priceCents });
    if (!res) return jsonError("Order failed.", 500);
    await claimAnonAlbumsFor(await anonId(false), res.userId);
    await startSession(res.userId);
    return NextResponse.json({ ok: true, redirect: `/album/${res.albumId}?welcome=1` });
  }

  if (body.kind === "plan") {
    const planId = body.planId as PlanId;
    if (!(planId in PLANS)) return jsonError("Unknown plan.");
    let user = await currentUser();
    if (!user) {
      if (!isValidEmail(body.email || "")) return jsonError("Enter a valid email.");
      user = await findOrCreateUser(body.email);
      await startSession(user.id);
    }
    await activatePlan({ userId: user.id, planId });
    await grantPlanCredits({ ref, userId: user.id, planId, amountCents: PLANS[planId].monthlyCents });
    return NextResponse.json({ ok: true, redirect: "/account?welcome=pro" });
  }
  return jsonError("Unknown checkout type.");
}
