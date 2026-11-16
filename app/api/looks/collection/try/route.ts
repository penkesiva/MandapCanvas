import { NextResponse } from "next/server";
import { loadImage, saveImage } from "@/lib/blob";
import { brandMark, generateImage } from "@/lib/imagegen";
import { glassesRule, parseGlasses } from "@/lib/bridalLooks";
import { buildCollectionPrompt, collectionShot, getCollection } from "@/lib/lookCollections";
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

/** One free try is shared by the Maharani and Navratri collections. */
const QUOTA = "collection";

export async function GET() {
  const q = await freeQuota(QUOTA);
  return NextResponse.json({ ok: true, signedIn: !!q.user, remaining: q.remaining, allowance: q.allowance });
}

/** One free, watermarked portrait from a collection, so she can see the likeness before buying. */
export async function POST(request: Request) {
  const b = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const collection = getCollection(b?.collection);
  if (!b || !collection) return jsonError("Unknown collection.");
  const photos = Array.isArray(b.photos) ? b.photos : [];
  if (!photos.length) return jsonError("Add at least one photo of yourself.");
  if (photos.length > 5 || !photos.every((u) => isOurImageUrl(u) && u.includes("/faces/"))) return jsonError("Upload your photos again, then try once more.");
  if (b.consent !== true) return jsonError("Please confirm these are your photos and you're 18 or older.");
  const scene = Number.isInteger(b.scene) && (b.scene as number) >= 0 && (b.scene as number) < collection.scenes.length ? (b.scene as number) : 0;

  const q = await freeQuota(QUOTA);
  if (!q.admin && q.remaining <= 0) {
    return jsonError(
      q.user ? "You've used your free portraits. Get the full set next." : "You've used your free portrait. Create a free account for one more.",
      429,
      q.user ? "tries_used" : "signup_for_more",
    );
  }
  const ip = await clientIp();
  if (!q.admin && !(await rateLimit(`collection-try:${ip}`, 4, 86400))) {
    return jsonError("Too many free portraits from this network today. Try again tomorrow.", 429, "tries_used");
  }
  if ((await todayCostCents()) >= dailyCapCents()) {
    return jsonError("The studio is very busy today. Please try again tomorrow.", 503);
  }

  try {
    const refs = await Promise.all((photos as string[]).slice(0, 3).map((u) => loadImage(u)));
    const { scene: s } = collectionShot(collection, scene);
    const result = await generateImage({
      prompt: buildCollectionPrompt({ collection, n: scene, photoCount: refs.length, glassesRule: glassesRule(parseGlasses(b.glasses)) }),
      refs: refs.map((r) => ({ label: "BRIDE PHOTO", data: r.data, mimeType: r.mimeType })),
      aspectRatio: "3:4",
      mockLabel: { title: `${collection.name} · ${s.name}`, subtitle: "Free try", paletteId: "red_gold" },
    });
    const marked = await brandMark(result.data, new URL(SITE.url).host);
    const owner = q.user?.id ?? q.anon ?? "anon";
    const saved = await saveImage(`faces/${owner}/${collection.id}`, marked, "image/jpeg");
    // It shows her face, so it is deleted on the same schedule as her photos.
    await kv().lpush("faces:index", JSON.stringify({ url: saved.url, at: Date.now() }));
    await Promise.all([
      q.spend(),
      recordStat({ looks: 1, images: 1, costMilliCents: result.costMilliCents }),
      recordCreation({ userId: q.user?.id, anon: q.anon }, { kind: "look", url: saved.url, title: `${collection.name}: ${s.name}`, href: collection.path }),
    ]);
    return NextResponse.json({ ok: true, url: saved.url, remaining: q.admin ? 99 : Math.max(0, q.remaining - 1), signedIn: !!q.user });
  } catch (e) {
    console.error("collection try failed", e);
    await recordStat({ failures: 1 });
    return jsonError("We couldn't create this portrait. Try clear, well-lit photos where your face is easy to see. This try didn't count.", 502);
  }
}
