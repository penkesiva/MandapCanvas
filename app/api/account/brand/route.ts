import { NextResponse } from "next/server";
import { currentUser, saveUser } from "@/lib/auth";
import { isOurImageUrl } from "@/lib/validate";
import { jsonError } from "@/lib/http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return jsonError("Sign in first.", 401);
  if (!user.plan) return jsonError("Branding is part of the Pro plan.", 402, "needs_pro");
  const b = (await request.json().catch(() => null)) as Record<string, string> | null;
  if (!b) return jsonError("Invalid request.");
  const businessName = (b.businessName || "").trim().slice(0, 60);
  if (!businessName) return jsonError("Add your business name.");
  const accent = /^#[0-9a-f]{6}$/i.test(b.accent || "") ? b.accent : "#9E1B32";
  user.brand = {
    businessName,
    accent,
    logoUrl: isOurImageUrl(b.logoUrl) ? b.logoUrl : user.brand?.logoUrl,
    website: (b.website || "").trim().slice(0, 120) || undefined,
    phone: (b.phone || "").trim().slice(0, 30) || undefined,
  };
  await saveUser(user);
  return NextResponse.json({ ok: true, brand: user.brand });
}
