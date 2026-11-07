import { NextResponse } from "next/server";
import { loadImage, saveImage } from "@/lib/blob";
import { brandMark, generateImage } from "@/lib/imagegen";
import { buildLookPrompt, parseLookRequest } from "@/lib/bridalLooks";
import { dailyCapCents } from "@/lib/albums";
import { SITE } from "@/lib/config";
import { clientIp, jsonError, rateLimit } from "@/lib/http";
import { kv } from "@/lib/kv";
import { freeQuota } from "@/lib/freeQuota";
import { recordStat, todayCostCents } from "@/lib/stats";
import { isOurImageUrl } from "@/lib/validate";
import { recordCreation } from "@/lib/creations";

export const runtime = "nodejs";
export const maxDuration = 90;

export async function GET() {
  const q = await freeQuota("looks");
  return NextResponse.json({ ok: true, signedIn: !!q.user, remaining: q.remaining, allowance: q.allowance });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const look = parseLookRequest(body);
  if (!look) return jsonError("Choose a look, a color and a setting.");
  if (body?.consent !== true) return jsonError("Please confirm the photo is of you, or that everyone in it agreed.");
  const photoUrl = body?.photoUrl;
  if (!isOurImageUrl(photoUrl) || !photoUrl.includes("/faces/")) return jsonError("Upload your photo first.");

  const q = await freeQuota("looks");
  if (!q.admin && q.remaining <= 0) {
    return jsonError(
      q.user ? "You've used your free looks. See yourself in a full album next." : "You've used your free look. Create a free account for one more.",
      429,
      q.user ? "looks_used" : "signup_for_more",
    );
  }
  const ip = await clientIp();
  if (!q.admin && !(await rateLimit(`looks:${ip}`, 4, 86400))) {
    return jsonError("Too many looks from this network today. Try again tomorrow.", 429, "looks_used");
  }
  if ((await todayCostCents()) >= dailyCapCents()) {
    return jsonError("The look studio is very busy today. Please try again tomorrow.", 503);
  }

  try {
    const photo = await loadImage(photoUrl);
    const result = await generateImage({
      prompt: buildLookPrompt(look),
      refs: [{ label: "PHOTO", data: photo.data, mimeType: photo.mimeType }],
      aspectRatio: "3:4",
      mockLabel: { title: `Your ${look.who === "couple" ? "couple" : look.who} look`, subtitle: look.tradition, paletteId: "red_gold" },
    });
    const marked = await brandMark(result.data, new URL(SITE.url).host);
    const owner = q.user?.id ?? q.anon ?? "anon";
    const saved = await saveImage(`faces/${owner}/look`, marked, "image/jpeg");
    // The result shows the person's face, so it is deleted on the same schedule as the photo.
    await kv().lpush("faces:index", JSON.stringify({ url: saved.url, at: Date.now() }));
    await Promise.all([
      q.spend(),
      recordStat({ looks: 1, images: 1, costMilliCents: result.costMilliCents }),
      recordCreation(
        { userId: q.user?.id, anon: q.anon },
        { kind: "look", url: saved.url, title: look.who === "couple" ? "Couple look" : look.who === "groom" ? "Groom look" : "Bridal look", href: "/looks" },
      ),
    ]);
    return NextResponse.json({ ok: true, url: saved.url, remaining: q.admin ? 99 : Math.max(0, q.remaining - 1), signedIn: !!q.user });
  } catch (e) {
    console.error("bridal look failed", e);
    await recordStat({ failures: 1 });
    return jsonError("We couldn't create this look. Try a clear, well-lit photo where the face is easy to see. This try didn't count.", 502);
  }
}
