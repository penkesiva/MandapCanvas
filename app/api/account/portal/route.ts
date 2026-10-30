import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { billingPortalUrl } from "@/lib/billing";
import { flags, SITE } from "@/lib/config";

export const runtime = "nodejs";

export async function POST() {
  const user = await currentUser();
  if (!user) return NextResponse.redirect(`${SITE.url}/signin?next=/account`, { status: 303 });
  if (!flags.stripeEnabled() || !user.stripeCustomerId) {
    return NextResponse.redirect(`${SITE.url}/account?billing=unavailable`, { status: 303 });
  }
  return NextResponse.redirect(await billingPortalUrl(user), { status: 303 });
}
