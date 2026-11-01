import { NextResponse } from "next/server";
import { saveImage } from "@/lib/blob";
import { generateImage } from "@/lib/imagegen";
import { CARD_TEMPLATES, cardArtPrompt, parseCardRequest } from "@/lib/weddingCards";
import { dailyCapCents } from "@/lib/albums";
import { clientIp, jsonError, rateLimit } from "@/lib/http";
import { kv } from "@/lib/kv";
import { freeQuota } from "@/lib/freeQuota";
import { recordStat, todayCostCents } from "@/lib/stats";

export const runtime = "nodejs";
export const maxDuration = 90;

const sampleKey = (id: string) => `cards:sample:${id}`;

/** Quota for this visitor, plus the sample artwork for each style (made once by an admin). */
export async function GET() {
  const [q, samples] = await Promise.all([
    freeQuota("cards"),
    Promise.all(CARD_TEMPLATES.map(async (t) => [t.id, await kv().get(sampleKey(t.id))] as const)),
  ]);
  return NextResponse.json({
    ok: true,
    signedIn: !!q.user,
    remaining: q.remaining,
    admin: q.admin,
    samples: Object.fromEntries(samples.filter(([, url]) => !!url)),
  });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const req = parseCardRequest(body);
  if (!req) return jsonError("Choose a style and a size.");
  const q = await freeQuota("cards");
  const asSample = body?.sample === true;
  if (asSample && !q.admin) return jsonError("Not allowed.", 403);

  if (!asSample && !q.admin && q.remaining <= 0) {
    return jsonError(
      q.user ? "You've used your free cards. Plan the rest of the wedding in MandapCanvas." : "You've used your free card. Create a free account for one more.",
      429,
      q.user ? "cards_used" : "signup_for_more",
    );
  }
  const ip = await clientIp();
  if (!q.admin && !(await rateLimit(`cards:${ip}`, 4, 86400))) {
    return jsonError("Too many cards from this network today. Try again tomorrow.", 429, "cards_used");
  }
  if ((await todayCostCents()) >= dailyCapCents()) {
    return jsonError("The card studio is very busy today. Please try again tomorrow.", 503);
  }

  try {
    const result = await generateImage({
      prompt: cardArtPrompt(req),
      refs: [],
      aspectRatio: req.format === "story" ? "9:16" : "3:4",
      mockLabel: { title: "Invitation artwork", subtitle: req.template, paletteId: "red_gold" },
    });
    const folder = asSample ? "cards/samples" : `cards/${q.user?.id ?? q.anon ?? "anon"}`;
    const saved = await saveImage(`${folder}/${req.template}`, result.data, result.mimeType);
    await recordStat({ cards: asSample ? 0 : 1, images: 1, costMilliCents: result.costMilliCents });
    if (asSample) {
      await kv().set(sampleKey(req.template), saved.url);
      return NextResponse.json({ ok: true, url: saved.url });
    }
    await q.spend();
    return NextResponse.json({ ok: true, url: saved.url, remaining: q.admin ? 99 : Math.max(0, q.remaining - 1), signedIn: !!q.user });
  } catch (e) {
    console.error("wedding card failed", e);
    await recordStat({ failures: 1 });
    return jsonError("We couldn't paint this card right now. Please try again in a minute. This try didn't count.", 502);
  }
}
