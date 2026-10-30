import { NextResponse } from "next/server";
import { saveImage } from "@/lib/blob";
import { normalizeUpload } from "@/lib/imagegen";
import { anonId, currentUser } from "@/lib/auth";
import { clientIp, IMAGE_TYPES, jsonError, MAX_UPLOAD_BYTES, rateLimit } from "@/lib/http";

export const runtime = "nodejs";

const KINDS = new Set(["sketch", "decor", "bride", "groom", "logo", "inventory"]);

export async function POST(request: Request) {
  const ip = await clientIp();
  if (!(await rateLimit(`upload:${ip}`, 40, 3600))) return jsonError("Too many uploads. Try again in an hour.", 429);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonError("Invalid upload.");
  }
  const kind = String(form.get("kind") ?? "");
  if (!KINDS.has(kind)) return jsonError("Unknown upload type.");

  const file = form.get("file");
  if (!(file instanceof Blob) || file.size === 0) return jsonError("Choose an image to upload.");
  if (file.size > MAX_UPLOAD_BYTES) return jsonError("That image is over 12 MB. Try a smaller one.");
  if (file.type && !IMAGE_TYPES.has(file.type.toLowerCase())) return jsonError("Use a JPG, PNG, WEBP or HEIC image.");

  const user = await currentUser();
  const owner = user?.id ?? (await anonId(true)) ?? "anon";
  if ((kind === "logo" || kind === "inventory") && !user) return jsonError("Sign in first.", 401);

  let data: Buffer;
  try {
    data = await normalizeUpload(Buffer.from(await file.arrayBuffer()), kind === "logo" ? 600 : 1600);
  } catch {
    return jsonError("We couldn't read that image. Try a JPG or PNG.");
  }

  // Face photos live under faces/ so the cleanup job can delete them after the retention window.
  const folder = kind === "bride" || kind === "groom" ? `faces/${owner}` : `uploads/${kind}/${owner}`;
  const saved = await saveImage(`${folder}/${kind}`, data, "image/jpeg");
  if (kind === "bride" || kind === "groom") {
    const { kv } = await import("@/lib/kv");
    await kv().lpush("faces:index", JSON.stringify({ url: saved.url, at: Date.now() }));
  }
  return NextResponse.json({ ok: true, url: saved.url });
}
