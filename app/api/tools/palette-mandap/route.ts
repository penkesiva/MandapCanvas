import { NextResponse } from "next/server";
import { saveImage } from "@/lib/blob";
import { brandMark, generateImage } from "@/lib/imagegen";
import { PALETTES } from "@/lib/catalog";
import { dailyCapCents } from "@/lib/albums";
import { SITE } from "@/lib/config";
import { clientIp, jsonError, rateLimit } from "@/lib/http";
import { freeQuota } from "@/lib/freeQuota";
import { recordStat, todayCostCents } from "@/lib/stats";
import { recordCreation } from "@/lib/creations";

export const runtime = "nodejs";
export const maxDuration = 90;

const HEX = /^#[0-9a-f]{6}$/i;

/** Only colors and plain color names reach the server: the outfit photo stays on the device. */
function parseColors(raw: unknown): { hex: string; name: string }[] | null {
  if (!Array.isArray(raw)) return null;
  const out = raw
    .slice(0, 5)
    .map((c) => (c ?? {}) as { hex?: unknown; name?: unknown })
    .filter((c) => typeof c.hex === "string" && HEX.test(c.hex))
    .map((c) => ({ hex: (c.hex as string).toUpperCase(), name: typeof c.name === "string" ? c.name.replace(/[^\p{L} -]/gu, "").slice(0, 30) : "" }));
  return out.length ? out : null;
}

export async function GET() {
  const q = await freeQuota("palettemandap");
  return NextResponse.json({ ok: true, signedIn: !!q.user, remaining: q.remaining, allowance: q.allowance });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const colors = parseColors(body?.colors);
  if (!colors) return jsonError("Add an outfit photo first.");
  const metal = body?.metal === "silver" ? "silver" : "gold";
  const palette = PALETTES.find((p) => p.id === body?.palette);

  const q = await freeQuota("palettemandap");
  if (!q.admin && q.remaining <= 0) {
    return jsonError(
      q.user ? "You've used your free mandap previews. Design your full mandap next." : "You've used your free preview. Create a free account for one more.",
      429,
      q.user ? "palettemandap_used" : "signup_for_more",
    );
  }
  const ip = await clientIp();
  if (!q.admin && !(await rateLimit(`palettemandap:${ip}`, 4, 86400))) {
    return jsonError("Too many previews from this network today. Try again tomorrow.", 429, "palettemandap_used");
  }
  if ((await todayCostCents()) >= dailyCapCents()) {
    return jsonError("The studio is very busy today. Please try again tomorrow.", 503);
  }

  const [main, ...rest] = colors;
  const prompt = [
    "A photo-real Desi (South Asian) wedding mandap, decorated by a top Indian wedding decorator, in an elegant venue. No people.",
    `COLOR STORY (MUST FOLLOW): built around the bride's outfit color ${main.name || "main color"} (${main.hex}). Supporting colors: ${rest.map((c) => `${c.name || "color"} (${c.hex})`).join(", ") || "soft ivory"}. Accents in ${metal}.`,
    "Use these exact colors in the flowers, drapes, fabric canopy and cushions, so the decor would frame a bride wearing that outfit; keep the mandap a little lighter than the outfit so she stands out.",
    palette ? `Decor details: flowers like ${palette.flowers}; fabrics like ${palette.fabrics}.` : "",
    "A four-pillar mandap with a draped canopy, a floral backdrop, a low platform with two seats, a havan kund, flower aisle and soft lighting. Wide, eye-level photo, natural light, professional event photography. No text, logos or watermarks.",
  ]
    .filter(Boolean)
    .join("\n\n");

  try {
    const result = await generateImage({
      prompt,
      refs: [],
      aspectRatio: "4:3",
      mockLabel: { title: "Your colors on a mandap", subtitle: main.name, paletteId: palette?.id ?? "red_gold" },
    });
    const marked = await brandMark(result.data, new URL(SITE.url).host);
    const owner = q.user?.id ?? q.anon ?? "anon";
    const saved = await saveImage(`tools/palette-mandap/${owner}`, marked, "image/jpeg");
    await Promise.all([
      q.spend(),
      recordStat({ paletteMandaps: 1, images: 1, costMilliCents: result.costMilliCents }),
      recordCreation({ userId: q.user?.id, anon: q.anon }, { kind: "palette", url: saved.url, title: "Mandap in your colors", href: "/tools/outfit-photo-color-palette" }),
    ]);
    return NextResponse.json({ ok: true, url: saved.url, remaining: q.admin ? 99 : Math.max(0, q.remaining - 1), signedIn: !!q.user });
  } catch (e) {
    console.error("palette mandap failed", e);
    await recordStat({ failures: 1 });
    return jsonError("We couldn't paint this mandap. Please try again. This try didn't count.", 502);
  }
}
