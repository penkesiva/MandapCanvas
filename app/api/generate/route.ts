import { NextResponse } from "next/server";
import { buildGenerationPrompt } from "@/lib/promptBuilder";
import { generateImagesFromSketch } from "@/lib/geminiImage";
import { getPaletteById } from "@/lib/palettes";
import type {
  AudienceMode,
  ColorMode,
  CoupleMode,
  GenerationSettings,
  VenueMode,
} from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 120;

const ALLOWED_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
const MAX_BYTES = 12 * 1024 * 1024;

function parseMode<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  if (typeof value !== "string") return fallback;
  return allowed.includes(value as T) ? (value as T) : fallback;
}

function parseSettings(form: FormData): GenerationSettings | { error: string } {
  const coupleMode = parseMode(
    form.get("coupleMode"),
    ["none", "bride_only", "groom_only", "bride_and_groom"] as const,
    "none",
  );
  const audienceMode = parseMode(form.get("audienceMode"), ["no_audience", "audience"] as const, "no_audience");
  const venueMode = parseMode(form.get("venueMode"), ["indoor", "outdoor"] as const, "indoor");
  const colorMode = parseMode(form.get("colorMode"), ["preserve_sketch", "suggested_palette"] as const, "preserve_sketch");

  const paletteIdRaw = form.get("paletteId");
  const paletteId =
    typeof paletteIdRaw === "string" && paletteIdRaw.length > 0 ? paletteIdRaw : null;

  if (colorMode === "suggested_palette" && paletteId && !getPaletteById(paletteId)) {
    return { error: "Invalid palette selection." };
  }

  const customNotes = typeof form.get("customNotes") === "string" ? (form.get("customNotes") as string) : "";

  const countRaw = form.get("variationCount");
  let variationCount = 2;
  if (typeof countRaw === "string") {
    const n = Number.parseInt(countRaw, 10);
    if (!Number.isNaN(n)) variationCount = Math.min(4, Math.max(1, n));
  }

  return {
    coupleMode: coupleMode as CoupleMode,
    audienceMode: audienceMode as AudienceMode,
    venueMode: venueMode as VenueMode,
    colorMode: colorMode as ColorMode,
    paletteId: colorMode === "suggested_palette" ? paletteId : null,
    customNotes,
    variationCount,
  };
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { ok: false, error: "Server is missing GEMINI_API_KEY.", code: "missing_api_key" },
      { status: 500 },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid form data." }, { status: 400 });
  }

  const file = form.get("image");
  if (!(file instanceof Blob) || file.size === 0) {
    return NextResponse.json({ ok: false, error: "Please upload a sketch image." }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { ok: false, error: `File too large (max ${MAX_BYTES / (1024 * 1024)} MB).` },
      { status: 400 },
    );
  }

  const mimeType = file.type.toLowerCase();
  if (!ALLOWED_TYPES.has(mimeType)) {
    return NextResponse.json(
      { ok: false, error: "Unsupported file type. Use JPG, PNG, or WEBP." },
      { status: 400 },
    );
  }

  const settings = parseSettings(form);
  if ("error" in settings) {
    return NextResponse.json({ ok: false, error: settings.error }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const imageBase64 = buffer.toString("base64");

  const normalizedMime =
    mimeType === "image/jpg" ? "image/jpeg" : mimeType;

  const prompt = buildGenerationPrompt(settings);

  try {
    const { images, warnings } = await generateImagesFromSketch({
      apiKey,
      prompt,
      imageBase64,
      mimeType: normalizedMime,
      variationCount: settings.variationCount,
    });

    if (images.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error:
            warnings.length > 0
              ? warnings.join(" ")
              : "Image generation did not return any images. Try again or adjust your sketch.",
          code: "empty_generation",
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      ok: true,
      prompt,
      images,
      warnings: warnings.length ? warnings : undefined,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Generation failed.";
    return NextResponse.json({ ok: false, error: message, code: "gemini_error" }, { status: 502 });
  }
}
