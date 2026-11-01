import { NextResponse } from "next/server";
import { isValidEmail, loginLinkToken, normalizeEmail } from "@/lib/auth";
import { sendLoginEmail } from "@/lib/email";
import { SITE } from "@/lib/config";
import { clientIp, jsonError, rateLimit } from "@/lib/http";
import { kv } from "@/lib/kv";
import { recordStat } from "@/lib/stats";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { email?: string; next?: string; source?: string } | null;
  const email = normalizeEmail(body?.email ?? "");
  if (!isValidEmail(email)) return jsonError("Enter a valid email address.");
  const ip = await clientIp();
  if (!(await rateLimit(`login:${ip}`, 10, 3600)) || !(await rateLimit(`login:${email}`, 5, 3600))) {
    return jsonError("Too many sign-in emails. Try again in an hour.", 429);
  }
  const next = typeof body?.next === "string" && body.next.startsWith("/") && !body.next.startsWith("//") ? body.next : "/account";
  const link = `${SITE.url}/api/auth/verify?token=${encodeURIComponent(loginLinkToken(email, next))}`;
  const source = typeof body?.source === "string" ? body.source.replace(/[^a-z0-9_-]/gi, "").slice(0, 40) : "";
  if (source) {
    // A sign-up from a prompt or tool: keep the lead even if they never click the link.
    await kv().lpush("leads", JSON.stringify({ email, source, path: next, at: Date.now() }));
    await recordStat({ leads: 1 });
  }
  const { delivered } = await sendLoginEmail(email, link, source ? { offer: true } : undefined);
  // Without an email provider (local dev), hand the link back so testing works.
  const devLink = !delivered && process.env.NODE_ENV !== "production" ? link : undefined;
  return NextResponse.json({ ok: true, devLink });
}
