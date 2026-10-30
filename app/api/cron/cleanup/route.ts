import { NextResponse } from "next/server";
import { kv } from "@/lib/kv";
import { deleteImage } from "@/lib/blob";
import { FACE_RETENTION_DAYS } from "@/lib/config";
import { getAlbum, saveAlbum, listAlbumIds } from "@/lib/albums";

export const runtime = "nodejs";
export const maxDuration = 120;

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

/** Daily: deletes face photos older than the retention window and unlinks them from albums. */
export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const cutoff = Date.now() - FACE_RETENTION_DAYS * 86400000;
  const entries = await kv().lrange("faces:index", 0, -1);
  const keep: string[] = [];
  const expired = new Set<string>();
  for (const raw of entries) {
    try {
      const e = JSON.parse(raw) as { url: string; at: number };
      if (e.at < cutoff) {
        await deleteImage(e.url);
        expired.add(e.url);
      } else keep.push(raw);
    } catch {
      /* drop malformed */
    }
  }
  if (expired.size) {
    await kv().del("faces:index");
    for (const raw of keep.reverse()) await kv().lpush("faces:index", raw);
    for (const id of await listAlbumIds("albums:all")) {
      const a = await getAlbum(id);
      if (!a) continue;
      const p = a.config.people;
      if ((p.brideUrl && expired.has(p.brideUrl)) || (p.groomUrl && expired.has(p.groomUrl))) {
        if (p.brideUrl && expired.has(p.brideUrl)) p.brideUrl = undefined;
        if (p.groomUrl && expired.has(p.groomUrl)) p.groomUrl = undefined;
        await saveAlbum(a);
      }
    }
  }
  return NextResponse.json({ ok: true, deleted: expired.size });
}
