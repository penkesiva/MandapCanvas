import { NextResponse } from "next/server";
import { clientIp, jsonError, rateLimit } from "@/lib/http";
import { kv } from "@/lib/kv";
import { sendFeedbackEmail } from "@/lib/email";
import { isValidEmail } from "@/lib/auth";

export const runtime = "nodejs";

export interface FeedbackEntry {
  at: number;
  kind: "feedback" | "contact";
  rating?: string;
  message: string;
  email?: string;
  page: string;
}

const RATINGS = ["😍", "😐", "😕"];

/** Saves a feedback or contact note for /admin and emails it to the support inbox. */
export async function POST(request: Request) {
  const b = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!b) return jsonError("Invalid request.");
  // Hidden field real people never fill in.
  if (typeof b.website === "string" && b.website.trim()) return NextResponse.json({ ok: true });
  const message = typeof b.message === "string" ? b.message.trim().slice(0, 2000) : "";
  if (message.length < 2) return jsonError("Write a few words first.");
  const email = typeof b.email === "string" ? b.email.trim().slice(0, 200) : "";
  if (email && !isValidEmail(email)) return jsonError("That email doesn't look right. Leave it empty or fix it.");
  const ip = await clientIp();
  if (!(await rateLimit(`feedback:min:${ip}`, 1, 60))) return jsonError("Thanks! Give it a minute before sending another.", 429);
  if (!(await rateLimit(`feedback:day:${ip}`, 20, 86400))) return jsonError("That's a lot of notes today. Email us instead.", 429);

  const entry: FeedbackEntry = {
    at: Date.now(),
    kind: b.kind === "contact" ? "contact" : "feedback",
    rating: RATINGS.includes(b.rating as string) ? (b.rating as string) : undefined,
    message,
    email: email || undefined,
    page: typeof b.page === "string" ? b.page.slice(0, 200) : "",
  };
  await kv().lpush("feedback", JSON.stringify(entry));
  await sendFeedbackEmail(entry).catch((e) => console.error("feedback email failed", e));
  return NextResponse.json({ ok: true });
}
