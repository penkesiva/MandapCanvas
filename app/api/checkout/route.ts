import { NextResponse } from "next/server";
import { anonId, currentUser } from "@/lib/auth";
import { canEdit, getAlbum } from "@/lib/albums";
import { flags, PACKS, PLANS, type PackId, type PlanId } from "@/lib/config";
import { packCheckoutUrl, planCheckoutUrl } from "@/lib/billing";
import { jsonError } from "@/lib/http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, string> | null;
  if (!body) return jsonError("Invalid request.");
  const user = await currentUser();

  if (body.kind === "pack") {
    const packId = body.packId as PackId;
    if (!(packId in PACKS)) return jsonError("Unknown pack.");
    const album = await getAlbum(body.albumId ?? "");
    if (!album) return jsonError("Album not found.", 404);
    if (!canEdit(album, user, await anonId(false))) return jsonError("You don't have access to this album.", 403);
    if (packId === "topup" && !album.paid) return jsonError("Choose a full pack first.");
    if (packId !== "topup" && album.paid) return jsonError("This album is already paid for.", 409);

    if (flags.devCheckout()) {
      const q = new URLSearchParams({ kind: "pack", packId, albumId: album.id });
      return NextResponse.json({ ok: true, url: `/checkout/dev?${q}` });
    }
    if (!flags.stripeEnabled()) return jsonError("Payments aren't set up yet.", 503);
    try {
      return NextResponse.json({ ok: true, url: await packCheckoutUrl({ packId, albumId: album.id, user }) });
    } catch (e) {
      console.error("checkout failed", e);
      return jsonError("We couldn't start checkout. Please try again.", 502);
    }
  }

  if (body.kind === "plan") {
    if (!user) return jsonError("Sign in to start Pro.", 401, "signin");
    const planId = body.planId as PlanId;
    if (!(planId in PLANS)) return jsonError("Unknown plan.");
    const interval = body.interval === "year" ? "year" : "month";
    if (flags.devCheckout()) {
      const q = new URLSearchParams({ kind: "plan", planId, interval });
      return NextResponse.json({ ok: true, url: `/checkout/dev?${q}` });
    }
    try {
      return NextResponse.json({ ok: true, url: await planCheckoutUrl({ planId, interval, user }) });
    } catch (e) {
      console.error("plan checkout failed", e);
      return jsonError("We couldn't start checkout. Please try again.", 502);
    }
  }
  return jsonError("Unknown checkout type.");
}
