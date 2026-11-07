import { NextResponse } from "next/server";
import { currentUser, isAdmin } from "@/lib/auth";
import { kv } from "@/lib/kv";
import { jsonError } from "@/lib/http";
import { isOurImageUrl } from "@/lib/validate";
import { CARD_TEMPLATES } from "@/lib/weddingCards";

export const runtime = "nodejs";

/** Admin only: make an artwork the admin painted the sample (default preview) for its style, for everyone. */
export async function POST(request: Request) {
  if (!isAdmin(await currentUser())) return jsonError("Not allowed.", 403);
  const body = (await request.json().catch(() => null)) as { template?: string; url?: string } | null;
  const t = CARD_TEMPLATES.find((x) => x.id === body?.template);
  if (!t) return jsonError("Unknown style.");
  if (!isOurImageUrl(body?.url) || !body!.url!.includes("/cards/")) return jsonError("That isn't one of your painted cards.");
  await kv().set(`cards:sample:${t.id}`, body!.url!);
  return NextResponse.json({ ok: true, url: body!.url });
}
