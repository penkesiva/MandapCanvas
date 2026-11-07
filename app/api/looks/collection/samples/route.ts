import { NextResponse } from "next/server";
import { currentUser, isAdmin } from "@/lib/auth";
import { saveImage } from "@/lib/blob";
import { glassesRule } from "@/lib/bridalLooks";
import { generateImage } from "@/lib/imagegen";
import { kv } from "@/lib/kv";
import { buildCollectionPrompt, collectionShot, getCollection } from "@/lib/lookCollections";
import { recordStat } from "@/lib/stats";
import { jsonError } from "@/lib/http";

export const runtime = "nodejs";
export const maxDuration = 90;

const key = (c: string, i: number) => `looks:sample:${c}:${i}`;

/** Example portraits for a collection page (one per scene, made once by an admin), and whether you're admin. */
export async function GET(request: Request) {
  const collection = getCollection(new URL(request.url).searchParams.get("c"));
  if (!collection) return jsonError("Unknown collection.");
  const [user, urls] = await Promise.all([currentUser(), Promise.all(collection.scenes.map((_, i) => kv().get(key(collection.id, i))))]);
  return NextResponse.json({
    ok: true,
    admin: isAdmin(user),
    samples: Object.fromEntries(urls.map((u, i) => [i, u]).filter(([, u]) => !!u)),
  });
}

/** Admin only: paint one example portrait from the AI model in the bridal example (an AI face, not a customer). */
export async function POST(request: Request) {
  if (!isAdmin(await currentUser())) return jsonError("Not allowed.", 403);
  const body = (await request.json().catch(() => null)) as { collection?: string; scene?: number } | null;
  const collection = getCollection(body?.collection);
  const n = Number(body?.scene);
  if (!collection || !Number.isInteger(n) || n < 0 || n >= collection.scenes.length) return jsonError("Unknown scene.");
  try {
    const face = await fetch(new URL("/samples/look-before.jpg", request.url));
    if (!face.ok) throw new Error("sample face missing");
    const data = Buffer.from(await face.arrayBuffer());
    const result = await generateImage({
      prompt: buildCollectionPrompt({ collection, n, photoCount: 1, glassesRule: glassesRule("remove") }),
      refs: [{ label: "BRIDE PHOTO", data, mimeType: "image/jpeg" }],
      aspectRatio: "3:4",
      mockLabel: { title: `${collection.name} · ${collectionShot(collection, n).scene.name}`, subtitle: "Example", paletteId: "red_gold" },
    });
    const saved = await saveImage(`looks/samples/${collection.id}-${n}`, result.data, result.mimeType);
    await Promise.all([kv().set(key(collection.id, n), saved.url), recordStat({ images: 1, costMilliCents: result.costMilliCents })]);
    return NextResponse.json({ ok: true, url: saved.url });
  } catch (e) {
    console.error("collection sample failed", e);
    return jsonError("Couldn't paint this example. Try again.", 502);
  }
}
