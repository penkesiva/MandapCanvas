import { NextResponse } from "next/server";
import { advanceAlbum, getAlbum, listAlbumIds } from "@/lib/albums";
import { kv } from "@/lib/kv";

export const runtime = "nodejs";
export const maxDuration = 300;

/** Safety net: keeps paid albums moving even if the customer closed the tab. */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret ? request.headers.get("authorization") !== `Bearer ${secret}` : process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const started = Date.now();
  const ids = await listAlbumIds("albums:queue");
  const stillOpen: string[] = [];
  let worked = 0;
  for (const id of ids) {
    const a = await getAlbum(id);
    if (!a || a.status === "complete") continue;
    stillOpen.push(id);
    while (Date.now() - started < 240_000) {
      const r = await advanceAlbum(id).catch(() => null);
      if (!r || r.busy || r.worked === 0) break;
      worked += r.worked;
    }
  }
  await kv().del("albums:queue");
  for (const id of stillOpen.reverse()) await kv().lpush("albums:queue", id);
  return NextResponse.json({ ok: true, worked, open: stillOpen.length });
}
