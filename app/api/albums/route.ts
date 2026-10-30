import { NextResponse } from "next/server";
import { anonId, currentUser } from "@/lib/auth";
import { createAlbum, publicAlbum } from "@/lib/albums";
import { parseConfig, parsePackId } from "@/lib/validate";
import { clientIp, jsonError, rateLimit } from "@/lib/http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!(await rateLimit(`album-create:${await clientIp()}`, 30, 3600))) return jsonError("Too many albums created. Try again later.", 429);
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return jsonError("Invalid request.");

  const packId = parsePackId(body.packId) ?? "signature";
  const parsed = parseConfig(body.config, packId);
  if ("error" in parsed) return jsonError(parsed.error);

  const user = await currentUser();
  const kind = body.kind === "proposal" ? "proposal" : "couple";
  if (kind === "proposal" && !user?.plan) return jsonError("Proposals are part of the Pro plan.", 402, "needs_pro");

  const album = await createAlbum({
    config: { ...parsed.config, inventoryUrls: user?.plan === "studio" ? parsed.config.inventoryUrls : [] },
    packId,
    kind,
    title: typeof body.title === "string" ? body.title : "",
    clientName: typeof body.clientName === "string" ? body.clientName : undefined,
    user,
    anon: user ? null : await anonId(true),
  });
  return NextResponse.json({ ok: true, album: publicAlbum(album) });
}
