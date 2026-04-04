export type CoupleMode = "none" | "bride_only" | "groom_only" | "bride_and_groom";

export type AudienceMode = "no_audience" | "audience";

export type VenueMode = "indoor" | "outdoor";

export type ColorMode = "preserve_sketch" | "suggested_palette";

export interface GenerationSettings {
  coupleMode: CoupleMode;
  audienceMode: AudienceMode;
  venueMode: VenueMode;
  colorMode: ColorMode;
  paletteId: string | null;
  customNotes: string;
  /** Number of images to generate (1–4). */
  variationCount: number;
}

export interface GeneratedImageResult {
  /** Base64-encoded image bytes (no data URL prefix). */
  data: string;
  mimeType: string;
  /** 1-based variation index when multiple were requested. */
  variationIndex: number;
}

export interface GenerateApiSuccess {
  ok: true;
  prompt: string;
  images: GeneratedImageResult[];
  warnings?: string[];
}

export interface GenerateApiError {
  ok: false;
  error: string;
  code?: string;
}

export type GenerateApiResponse = GenerateApiSuccess | GenerateApiError;
