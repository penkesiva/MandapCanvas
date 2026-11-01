import "server-only";
import { GoogleGenAI } from "@google/genai";
import sharp from "sharp";
import { flags } from "./config";
import { getPalette } from "./catalog";

export interface RefImage {
  label: string;
  data: Buffer;
  mimeType: string;
}

export interface GenerateInput {
  prompt: string;
  refs: RefImage[];
  aspectRatio: "4:3" | "3:4" | "16:9" | "9:16";
  hd?: boolean;
  /** Used by mock mode to render a recognizable placeholder. */
  mockLabel?: { title: string; subtitle: string; paletteId: string };
}

export interface GenerateOutput {
  data: Buffer;
  mimeType: string;
  /** Estimated model cost in thousandths of a cent. */
  costMilliCents: number;
  mocked: boolean;
}

export function imageModel(): string {
  return process.env.GEMINI_IMAGE_MODEL?.trim() || "gemini-2.5-flash-image";
}

/** Estimated list price per image in thousandths of a cent, for margin tracking. */
function estimatedCost(model: string, hd: boolean): number {
  const override = Number(process.env.COST_PER_IMAGE_CENTS);
  if (Number.isFinite(override) && override > 0) return Math.round(override * 1000);
  if (model.includes("pro")) return hd ? 24000 : 13400;
  if (model.includes("3.1") || model.includes("2.1")) return hd ? 10100 : 6700;
  return 3900;
}

let client: GoogleGenAI | null = null;
/**
 * Two ways to reach Gemini:
 * - Vertex AI on Google Cloud (billed monthly to a Cloud billing account): GOOGLE_CLOUD_PROJECT plus
 *   GOOGLE_SERVICE_ACCOUNT_JSON (the service account's JSON key, pasted whole). Preferred when set.
 * - AI Studio API key (prepaid credits): GEMINI_API_KEY.
 */
export function usingVertex(): boolean {
  return !!process.env.GOOGLE_CLOUD_PROJECT && !!process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
}

function gemini(): GoogleGenAI {
  if (!client) {
    if (usingVertex()) {
      const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON!.trim();
      // Accept the JSON as-is or base64-encoded (handy for env var editors that mangle newlines).
      const json = raw.startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf8");
      client = new GoogleGenAI({
        vertexai: true,
        project: process.env.GOOGLE_CLOUD_PROJECT,
        location: process.env.GOOGLE_CLOUD_LOCATION || "global",
        googleAuthOptions: { credentials: JSON.parse(json), scopes: ["https://www.googleapis.com/auth/cloud-platform"] },
      });
    } else {
      client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
    }
  }
  return client;
}

export async function generateImage(input: GenerateInput): Promise<GenerateOutput> {
  if (flags.mockGeneration()) return mockImage(input);

  const model = imageModel();
  const parts: ({ text: string } | { inlineData: { mimeType: string; data: string } })[] = [{ text: input.prompt }];
  for (const ref of input.refs) {
    parts.push({ text: `${ref.label} reference image:` });
    parts.push({ inlineData: { mimeType: ref.mimeType, data: ref.data.toString("base64") } });
  }

  const supportsSize = !model.startsWith("gemini-2.5");
  const response = await gemini().models.generateContent({
    model,
    contents: [{ role: "user", parts }],
    config: {
      responseModalities: ["TEXT", "IMAGE"],
      imageConfig: {
        aspectRatio: input.aspectRatio,
        ...(supportsSize ? { imageSize: input.hd ? "2K" : "1K" } : {}),
      },
    },
  });

  const out = response.candidates?.[0]?.content?.parts ?? [];
  for (const part of out) {
    const inline = (part as { inlineData?: { data?: string; mimeType?: string } }).inlineData;
    if (inline?.data) {
      return {
        data: Buffer.from(inline.data, "base64"),
        mimeType: inline.mimeType ?? "image/png",
        costMilliCents: estimatedCost(model, !!input.hd),
        mocked: false,
      };
    }
  }
  const reason = response.promptFeedback?.blockReason || response.candidates?.[0]?.finishReason || "no image returned";
  throw new Error(`The image model did not return an image (${reason}).`);
}

function esc(s: string): string {
  return s.replace(/[<>&"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" })[c]!);
}

async function mockImage(input: GenerateInput): Promise<GenerateOutput> {
  const [w, h] = input.aspectRatio === "3:4" ? [768, 1024] : input.aspectRatio === "9:16" ? [720, 1280] : input.aspectRatio === "16:9" ? [1280, 720] : [1024, 768];
  const palette = getPalette(input.mockLabel?.paletteId ?? "blush_ivory");
  const [a, b, c] = palette.swatches;
  const title = esc(input.mockLabel?.title ?? "Preview");
  const subtitle = esc(input.mockLabel?.subtitle ?? "");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c}"/><stop offset="0.55" stop-color="${b}"/><stop offset="1" stop-color="${a}"/></linearGradient></defs>
    <rect width="100%" height="100%" fill="url(#g)"/>
    <g fill="none" stroke="${a}" stroke-width="10" opacity="0.55">
      <path d="M${w * 0.2} ${h * 0.85} V${h * 0.35} M${w * 0.8} ${h * 0.85} V${h * 0.35}"/>
      <path d="M${w * 0.14} ${h * 0.36} Q${w / 2} ${h * 0.08} ${w * 0.86} ${h * 0.36}"/>
      <circle cx="${w / 2}" cy="${h * 0.52}" r="${Math.min(w, h) * 0.14}"/>
    </g>
    <rect x="0" y="${h - 120}" width="${w}" height="120" fill="rgba(43,22,32,0.55)"/>
    <text x="36" y="${h - 66}" font-family="Georgia, serif" font-size="38" fill="#fff">${title}</text>
    <text x="36" y="${h - 28}" font-family="Arial, sans-serif" font-size="22" fill="#fff" opacity="0.85">${subtitle} · mock image</text>
  </svg>`;
  const data = await sharp(Buffer.from(svg)).png().toBuffer();
  await new Promise((r) => setTimeout(r, 250));
  return { data, mimeType: "image/png", costMilliCents: 0, mocked: true };
}

/** Burns a tiled watermark into free-preview images and downscales them. */
export async function watermark(data: Buffer): Promise<Buffer> {
  const img = sharp(data).resize({ width: 900, withoutEnlargement: true });
  const meta = await img.toBuffer({ resolveWithObject: true });
  const { width, height } = meta.info;
  const tile = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <defs><pattern id="p" width="360" height="200" patternUnits="userSpaceOnUse" patternTransform="rotate(-24)">
      <text x="10" y="110" font-family="Georgia, serif" font-size="30" fill="rgba(255,255,255,0.42)" stroke="rgba(0,0,0,0.18)" stroke-width="1">MandapCanvas preview</text>
    </pattern></defs>
    <rect width="100%" height="100%" fill="url(#p)"/>
  </svg>`;
  return sharp(meta.data)
    .composite([{ input: Buffer.from(tile), top: 0, left: 0 }])
    .jpeg({ quality: 78 })
    .toBuffer();
}

/**
 * Lighter mark for the free AI look tool: a faint diagonal tile plus a corner badge with the site name,
 * so the picture stays shareable and still says where it came from.
 */
export async function brandMark(data: Buffer, site: string): Promise<Buffer> {
  const img = sharp(data).resize({ width: 960, withoutEnlargement: true });
  const meta = await img.toBuffer({ resolveWithObject: true });
  const { width, height } = meta.info;
  const label = esc(site);
  const badgeW = Math.round(14 + label.length * 9.6 + 150);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <defs><pattern id="p" width="420" height="260" patternUnits="userSpaceOnUse" patternTransform="rotate(-24)">
      <text x="10" y="130" font-family="Georgia, serif" font-size="28" fill="rgba(255,255,255,0.22)" stroke="rgba(0,0,0,0.08)" stroke-width="1">MandapCanvas preview</text>
    </pattern></defs>
    <rect width="100%" height="100%" fill="url(#p)"/>
    <g transform="translate(${width - badgeW - 18} ${height - 54})">
      <rect width="${badgeW}" height="38" rx="19" fill="rgba(50,8,17,0.78)"/>
      <text x="18" y="25" font-family="Georgia, serif" font-size="17" fill="#ecd08a">MandapCanvas</text>
      <text x="138" y="25" font-family="Arial, sans-serif" font-size="15" fill="#fff8ef">${label}</text>
    </g>
  </svg>`;
  return sharp(meta.data)
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .jpeg({ quality: 84 })
    .toBuffer();
}

/** Normalizes uploads: strips metadata (incl. GPS), fixes rotation, caps size, converts to JPEG. */
export async function normalizeUpload(data: Buffer, maxSide = 1600): Promise<Buffer> {
  return sharp(data)
    .rotate()
    .resize({ width: maxSide, height: maxSide, fit: "inside", withoutEnlargement: true })
    .flatten({ background: "#ffffff" })
    .jpeg({ quality: 88 })
    .toBuffer();
}
