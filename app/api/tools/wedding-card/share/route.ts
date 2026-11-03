import { NextResponse } from "next/server";
import sharp from "sharp";
import { randomBytes } from "node:crypto";
import { saveImage } from "@/lib/blob";
import { SITE } from "@/lib/config";
import { clientIp, jsonError, rateLimit } from "@/lib/http";
import { setJSON } from "@/lib/kv";
import { getCardTemplate, type SharedCard } from "@/lib/weddingCards";

export const runtime = "nodejs";

/** Saves a finished invitation (art + words, drawn in the browser) and returns a link anyone can open. */
export async function POST(request: Request) {
  const ip = await clientIp();
  if (!(await rateLimit(`card-share:${ip}`, 30, 86400))) return jsonError("Too many links today. Try again tomorrow.", 429);
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  const template = String(form?.get("template") ?? "");
  if (!(file instanceof Blob) || file.size > 6 * 1024 * 1024) return jsonError("Couldn't read the card. Try again.");
  let data: Buffer;
  try {
    // Re-encode: only a real image gets stored, at a sensible size.
    data = await sharp(Buffer.from(await file.arrayBuffer()))
      .resize({ width: 1200, height: 2134, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 88 })
      .toBuffer();
  } catch {
    return jsonError("Couldn't read the card. Try again.");
  }
  const id = randomBytes(6).toString("base64url");
  const saved = await saveImage(`cards/shared/${id}`, data, "image/jpeg");
  // Shared cards stay up for a year: long enough for the wedding.
  await setJSON(`card:${id}`, { url: saved.url, template: getCardTemplate(template).id, at: Date.now() } satisfies SharedCard, { ex: 365 * 86400 });
  return NextResponse.json({ ok: true, link: `${SITE.url}/c/${id}`, image: saved.url });
}
