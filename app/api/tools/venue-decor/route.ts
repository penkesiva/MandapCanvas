import { NextResponse } from "next/server";
import sharp from "sharp";
import { loadImage, saveImage } from "@/lib/blob";
import { brandMark, generateImage } from "@/lib/imagegen";
import { buildVenuePrompt, nearestAspect, parseVenueRequest, VENUE_EVENTS, VENUE_STYLES } from "@/lib/venueDecor";
import { dailyCapCents } from "@/lib/albums";
import { SITE } from "@/lib/config";
import { clientIp, jsonError, rateLimit } from "@/lib/http";
import { freeQuota } from "@/lib/freeQuota";
import { recordStat, todayCostCents } from "@/lib/stats";
import { isOurImageUrl } from "@/lib/validate";
import { recordCreation } from "@/lib/creations";

export const runtime = "nodejs";
export const maxDuration = 90;

export async function GET() {
  const q = await freeQuota("venue");
  return NextResponse.json({ ok: true, signedIn: !!q.user, remaining: q.remaining, allowance: q.allowance, admin: q.admin });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const req = parseVenueRequest(body);
  if (!req) return jsonError("Choose an event and a style.");
  const photoUrl = body?.photoUrl;
  if (!isOurImageUrl(photoUrl) || !photoUrl.includes("/venue/")) return jsonError("Upload a photo of your venue first.");

  const q = await freeQuota("venue");
  if (!q.admin && q.remaining <= 0) {
    return jsonError(
      q.user ? "You've used your free venue tries. Design every event in this venue next." : "You've used your free try. Create a free account for one more.",
      429,
      q.user ? "venue_used" : "signup_for_more",
    );
  }
  const ip = await clientIp();
  if (!q.admin && !(await rateLimit(`venue:${ip}`, 4, 86400))) {
    return jsonError("Too many tries from this network today. Try again tomorrow.", 429, "venue_used");
  }
  if ((await todayCostCents()) >= dailyCapCents()) {
    return jsonError("The visualizer is very busy today. Please try again tomorrow.", 503);
  }

  try {
    const photo = await loadImage(photoUrl);
    const meta = await sharp(photo.data).rotate().metadata();
    const aspect = nearestAspect(meta.autoOrient?.width ?? meta.width ?? 4, meta.autoOrient?.height ?? meta.height ?? 3);
    const ev = VENUE_EVENTS.find((e) => e.id === req.event)!;
    const st = VENUE_STYLES.find((s) => s.id === req.style)!;
    const result = await generateImage({
      prompt: buildVenuePrompt(req),
      refs: [{ label: "VENUE", data: photo.data, mimeType: photo.mimeType }],
      aspectRatio: aspect,
      mockLabel: { title: `Your venue: ${ev.name}`, subtitle: st.name, paletteId: req.palette || "red_gold" },
    });
    const owner = q.user?.id ?? q.anon ?? "anon";
    const jpeg = await sharp(result.data).jpeg({ quality: 88 }).toBuffer();
    const marked = await brandMark(result.data, new URL(SITE.url).host);
    // The clean copy is only used as the design reference when they continue to /create.
    const [saved, raw] = await Promise.all([
      saveImage(`venues/${owner}/decor`, marked, "image/jpeg"),
      saveImage(`venues/${owner}/ref`, jpeg, "image/jpeg"),
    ]);
    await Promise.all([
      q.spend(),
      recordStat({ venues: 1, images: 1, costMilliCents: result.costMilliCents }),
      recordCreation({ userId: q.user?.id, anon: q.anon }, { kind: "venue", url: saved.url, title: `${ev.name}, ${st.name}`, href: "/tools/ai-venue-decor-visualizer" }),
    ]);
    return NextResponse.json({
      ok: true,
      url: saved.url,
      refUrl: raw.url,
      aspect,
      remaining: q.admin ? 99 : Math.max(0, q.remaining - 1),
      signedIn: !!q.user,
    });
  } catch (e) {
    console.error("venue decor failed", e);
    await recordStat({ failures: 1 });
    return jsonError("We couldn't decorate this photo. Try a bright, wide photo of the empty space. This try didn't count.", 502);
  }
}
