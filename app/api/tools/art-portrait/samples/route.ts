import { NextResponse } from "next/server";
import { currentUser, isAdmin } from "@/lib/auth";
import { saveImage } from "@/lib/blob";
import { generateImage } from "@/lib/imagegen";
import { kv } from "@/lib/kv";
import { ART_STYLES, buildArtPrompt, getArtStyle } from "@/lib/artStyles";
import { recordStat } from "@/lib/stats";
import { jsonError } from "@/lib/http";

export const runtime = "nodejs";
export const maxDuration = 90;

const key = (id: string) => `art:sample:${id}`;

/** Example tiles for each style (painted once by an admin from our AI-model couple), and whether you're admin. */
export async function GET() {
  const [user, urls] = await Promise.all([currentUser(), Promise.all(ART_STYLES.map((s) => kv().get(key(s.id))))]);
  return NextResponse.json({
    ok: true,
    admin: isAdmin(user),
    samples: Object.fromEntries(ART_STYLES.map((s, i) => [s.id, urls[i]]).filter(([, u]) => !!u)),
  });
}

/** Admin only: paint one style's example from the AI-model couple photo (not a customer). */
export async function POST(request: Request) {
  if (!isAdmin(await currentUser())) return jsonError("Not allowed.", 403);
  const body = (await request.json().catch(() => null)) as { style?: string } | null;
  const style = getArtStyle(body?.style);
  if (!style) return jsonError("Unknown style.");
  try {
    const res = await fetch(new URL("/samples/look-couple-before.jpg", request.url));
    if (!res.ok) throw new Error("sample couple missing");
    const data = Buffer.from(await res.arrayBuffer());
    const result = await generateImage({
      prompt: buildArtPrompt(style, "wedding"),
      refs: [{ label: "PHOTO", data, mimeType: "image/jpeg" }],
      aspectRatio: "3:4",
      mockLabel: { title: style.name, subtitle: "Example", paletteId: "red_gold" },
    });
    const saved = await saveImage(`art/samples/${style.id}`, result.data, result.mimeType);
    await Promise.all([kv().set(key(style.id), saved.url), recordStat({ images: 1, costMilliCents: result.costMilliCents })]);
    return NextResponse.json({ ok: true, url: saved.url });
  } catch (e) {
    console.error("art sample failed", e);
    return jsonError("Couldn't paint this example. Try again.", 502);
  }
}
