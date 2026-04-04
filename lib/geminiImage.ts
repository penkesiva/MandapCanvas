import { GoogleGenAI } from "@google/genai";
import type { GeneratedImageResult } from "./types";

const DEFAULT_MODEL = "gemini-2.5-flash-image";

function getModelId(): string {
  return process.env.GEMINI_IMAGE_MODEL?.trim() || DEFAULT_MODEL;
}

function extractImageData(response: {
  candidates?: { content?: { parts?: unknown[] } }[];
}): { data: string; mimeType: string } | null {
  const parts = response.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return null;
  for (const part of parts) {
    if (part && typeof part === "object" && "inlineData" in part) {
      const inline = (part as { inlineData?: { data?: string; mimeType?: string } }).inlineData;
      if (inline?.data) {
        return {
          data: inline.data,
          mimeType: inline.mimeType ?? "image/png",
        };
      }
    }
  }
  return null;
}

export interface GenerateFromSketchInput {
  apiKey: string;
  prompt: string;
  imageBase64: string;
  mimeType: string;
  variationCount: number;
}

/**
 * Calls Gemini image generation once per variation. Parallelized for speed.
 * Model id is read from GEMINI_IMAGE_MODEL or defaults to gemini-2.5-flash-image.
 */
export async function generateImagesFromSketch(
  input: GenerateFromSketchInput,
): Promise<{ images: GeneratedImageResult[]; warnings: string[] }> {
  const ai = new GoogleGenAI({ apiKey: input.apiKey });
  const model = getModelId();
  const warnings: string[] = [];

  const tasks = Array.from({ length: input.variationCount }, (_, i) => {
    const variationNote =
      input.variationCount > 1
        ? `\n\nVARIATION ${i + 1} of ${input.variationCount}: Keep the same blueprint layout and structure; vary only fine details like micro-texture, subtle light direction, or small floral fill—so options feel distinct but equally faithful.`
        : "";

    const fullPrompt = `${input.prompt}${variationNote}`;

    const contents = [
      { text: fullPrompt },
      {
        inlineData: {
          mimeType: input.mimeType,
          data: input.imageBase64,
        },
      },
    ];

    return ai.models
      .generateContent({
        model,
        contents,
        config: {
          responseModalities: ["TEXT", "IMAGE"],
          imageConfig: {
            aspectRatio: "4:3",
            imageSize: "1K",
          },
        },
      })
      .then((response) => {
        const img = extractImageData(response);
        if (!img) {
          const blockReason = response.promptFeedback?.blockReason;
          warnings.push(
            blockReason
              ? `Variation ${i + 1}: no image returned (${blockReason}).`
              : `Variation ${i + 1}: no image data in response.`,
          );
          return null;
        }
        return {
          data: img.data,
          mimeType: img.mimeType,
          variationIndex: i + 1,
        } satisfies GeneratedImageResult;
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        warnings.push(`Variation ${i + 1} failed: ${msg}`);
        return null;
      });
  });

  const settled = await Promise.all(tasks);
  const images = settled.filter((x): x is GeneratedImageResult => x !== null);

  return { images, warnings };
}
