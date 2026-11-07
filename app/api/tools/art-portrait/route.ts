import { NextResponse } from "next/server";
import sharp from "sharp";
import { loadImage, saveImage } from "@/lib/blob";
import { brandMark, generateImage } from "@/lib/imagegen";
import { buildArtPrompt, getArtStyle, type ArtGlasses, type ArtOutfit } from "@/lib/artStyles";
import { dailyCapCents } from "@/lib/albums";
import { SITE } from "@/lib/config";
import { clientIp, jsonError, rateLimit } from "@/lib/http";
import { kv } from "@/lib/kv";
import { freeQuota } from "@/lib/freeQuota";
import { recordStat, todayCostCents } from "@/lib/stats";
import { isOurImageUrl } from "@/lib/validate";
import { nearestAspect } from "@/lib/venueDecor";

export const runtime = "nodejs";
export const maxDuration = 90;

export async function GET() {
  const q = await freeQuota("art");
  return NextResponse.json({ ok: true, signedIn: !!q.user, remaining: q.remaining, allowance: q.allowance, admin: q.admin });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const style = getArtStyle(body?.style);
  if (!style) return jsonError("Pick a style.");
  const outfit: ArtOutfit = body?.outfit === "keep" ? "keep" : "wedding";
  const glasses: ArtGlasses = body?.glasses === "remove" ? "remove" : body?.glasses === "keep" ? "keep" : style.noGlasses ? "remove" : "keep";
  if (body?.consent !== true) return jsonError("Please confirm the photo is of you, or that everyone in it agreed.");
  const photoUrl = body?.photoUrl;
  if (!isOurImageUrl(photoUrl) || !photoUrl.includes("/faces/")) return jsonError("Upload your photo first.");

  const q = await freeQuota("art");
  if (!q.admin && q.remaining <= 0) {
    return jsonError(
      q.user ? "You've used your free art portraits. See yourself at every event next." : "You've used your free art portrait. Create a free account for one more.",
      429,
      q.user ? "art_used" : "signup_for_more",
    );
  }
  const ip = await clientIp();
  if (!q.admin && !(await rateLimit(`art:${ip}`, 4, 86400))) {
    return jsonError("Too many portraits from this network today. Try again tomorrow.", 429, "art_used");
  }
  if ((await todayCostCents()) >= dailyCapCents()) {
    return jsonError("The studio is very busy today. Please try again tomorrow.", 503);
  }

  try {
    const photo = await loadImage(photoUrl);
    const meta = await sharp(photo.data).rotate().metadata();
    const aspect = nearestAspect(meta.autoOrient?.width ?? meta.width ?? 3, meta.autoOrient?.height ?? meta.height ?? 4);
    const result = await generateImage({
      prompt: buildArtPrompt(style, outfit, glasses),
      refs: [{ label: "PHOTO", data: photo.data, mimeType: photo.mimeType }],
      aspectRatio: aspect,
      mockLabel: { title: "Your art portrait", subtitle: style.name, paletteId: "red_gold" },
    });
    const marked = await brandMark(result.data, new URL(SITE.url).host);
    const owner = q.user?.id ?? q.anon ?? "anon";
    const saved = await saveImage(`faces/${owner}/art`, marked, "image/jpeg");
    // The result shows the person's face, so it is deleted on the same schedule as the photo.
    await kv().lpush("faces:index", JSON.stringify({ url: saved.url, at: Date.now() }));
    await Promise.all([q.spend(), recordStat({ looks: 1, images: 1, costMilliCents: result.costMilliCents })]);
    return NextResponse.json({
      ok: true,
      url: saved.url,
      aspect,
      remaining: q.admin ? 99 : Math.max(0, q.remaining - 1),
      signedIn: !!q.user,
    });
  } catch (e) {
    console.error("art portrait failed", e);
    await recordStat({ failures: 1 });
    return jsonError("We couldn't paint this one. Try a clear, well-lit photo where faces are easy to see. This try didn't count.", 502);
  }
}
