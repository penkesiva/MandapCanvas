import "server-only";
import { put, del } from "@vercel/blob";
import fs from "node:fs/promises";
import path from "node:path";

/**
 * Image storage. Vercel Blob in production (BLOB_READ_WRITE_TOKEN), local files in development.
 * All stored objects get unguessable paths.
 */

const DEV_DIR = path.join(process.cwd(), ".data", "blob");

export function usingDevBlob(): boolean {
  return !process.env.BLOB_READ_WRITE_TOKEN;
}

function randomSuffix(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 16);
}

export async function saveImage(
  pathname: string,
  data: Buffer,
  contentType: string,
): Promise<{ url: string; key: string }> {
  const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
  const key = `${pathname}-${randomSuffix()}.${ext}`;
  if (usingDevBlob()) {
    const file = path.join(DEV_DIR, key);
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, data);
    return { url: `/api/dev-blob/${key}`, key };
  }
  const res = await put(key, data, { access: "public", contentType, addRandomSuffix: false });
  return { url: res.url, key };
}

export async function deleteImage(url: string): Promise<void> {
  try {
    if (url.startsWith("/api/dev-blob/")) {
      await fs.rm(path.join(DEV_DIR, url.replace("/api/dev-blob/", "")), { force: true });
      return;
    }
    if (!usingDevBlob()) await del(url);
  } catch (e) {
    console.error("deleteImage failed", url, e);
  }
}

/** Reads bytes for a stored image (used to feed references back into the model). */
export async function loadImage(url: string): Promise<{ data: Buffer; mimeType: string }> {
  if (url.startsWith("/api/dev-blob/")) {
    const rel = url.replace("/api/dev-blob/", "");
    const data = await fs.readFile(path.join(DEV_DIR, rel));
    return { data, mimeType: mimeFromName(rel) };
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not load image (${res.status})`);
  return {
    data: Buffer.from(await res.arrayBuffer()),
    mimeType: res.headers.get("content-type") || mimeFromName(url),
  };
}

export async function readDevBlob(rel: string): Promise<{ data: Buffer; mimeType: string } | null> {
  const file = path.join(DEV_DIR, rel);
  if (!file.startsWith(DEV_DIR)) return null;
  try {
    return { data: await fs.readFile(file), mimeType: mimeFromName(rel) };
  } catch {
    return null;
  }
}

function mimeFromName(name: string): string {
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}
