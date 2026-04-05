import type { GenerationSettings } from "./types";
import { getPaletteById, PALETTE_DISCLAIMER } from "./palettes";

const COUPLE_COPY: Record<GenerationSettings["coupleMode"], string> = {
  none: "No couple in the scene—focus purely on the decor, stage, and environment.",
  bride_only:
    "Include only the bride in traditional modern Indian wedding attire, tastefully placed so she does not block the main backdrop structure.",
  groom_only:
    "Include only the groom in traditional modern Indian wedding attire, tastefully placed so he does not block the main backdrop structure.",
  bride_and_groom:
    "Include bride and groom together in contemporary Indian wedding attire, positioned naturally without obscuring the central backdrop or key decor lines.",
};

const AUDIENCE_COPY: Record<GenerationSettings["audienceMode"], string> = {
  no_audience: "No audience seating or crowd—keep sightlines clean toward the stage/backdrop.",
  audience: [
    "AUDIENCE (REQUIRED): Show a populated wedding audience in the mid-ground or background—guests seated in rows, as at a real U.S. Indian wedding ceremony.",
    "Chairs and rows must appear OCCUPIED: visible guests (backs, shoulders, silhouettes, or soft partial faces are fine). Do NOT render empty chairs, bare rows, or vacant seating.",
    "Crowd density should feel natural (moderately filled rows), softly out of focus if needed so the mandap/backdrop remains the hero. Attire: believable Indian wedding guest clothing.",
    "If seating appears in frame, it must read as a living audience, not an empty venue.",
  ].join(" "),
};

const VENUE_COPY: Record<GenerationSettings["venueMode"], string> = {
  indoor:
    "Indoor venue: controlled lighting, refined ballroom or hall architecture, realistic depth and shadows; U.S. wedding venue feel.",
  outdoor:
    "Outdoor venue: natural daylight or soft golden-hour light, believable garden or tent context appropriate for a U.S. wedding; keep weather subtle and elegant.",
};

function colorInstructions(settings: GenerationSettings): string {
  if (settings.colorMode === "preserve_sketch") {
    return [
      "COLOR & MATERIAL: Preserve the overall color direction and hue relationships from the sketch as closely as possible.",
      "Translate sketch colors into realistic floral and fabric materials while keeping the same warm/cool balance and focal accents.",
      "Do not invent a completely new palette unless needed for realism—stay faithful to the user's color intent.",
    ].join(" ");
  }

  const palette = getPaletteById(settings.paletteId);
  if (!palette) {
    return [
      "COLOR & MATERIAL: Use a cohesive, realistic wedding floral palette appropriate for modern Indian decor in the U.S.",
      PALETTE_DISCLAIMER,
    ].join(" ");
  }

  return [
    `COLOR & MATERIAL: Apply this U.S.-practical floral palette as the primary guide: ${palette.name}.`,
    `Mood: ${palette.description}`,
    `Prioritize these flower types where believable: ${palette.flowers.join(", ")}.`,
    PALETTE_DISCLAIMER,
  ].join(" ");
}

/**
 * Builds the full text prompt sent to Gemini alongside the uploaded sketch.
 */
export function buildGenerationPrompt(settings: GenerationSettings): string {
  const notes = settings.customNotes.trim();

  const sections = [
    "ROLE: You are visualizing a hand-drawn wedding backdrop / mandap concept as ultra-realistic wedding photography.",
    "",
    "BLUEPRINT RULE (CRITICAL): The attached image is the composition blueprint.",
    "- Match overall symmetry, proportions, and spatial layout of arches, pillars, florals, draping, and focal structure.",
    "- Preserve the central backdrop hierarchy and side structures; do not rotate, mirror, or radically redesign the layout.",
    "- Translate sketched masses into believable flowers, fabric, lighting, and materials without changing the underlying arrangement.",
    "- Keep the result clean, elegant, and believable—avoid heavy traditional overload unless the sketch clearly implies it.",
    "",
    `SCENE — COUPLE: ${COUPLE_COPY[settings.coupleMode]}`,
    `SCENE — AUDIENCE: ${AUDIENCE_COPY[settings.audienceMode]}`,
    `SCENE — VENUE: ${VENUE_COPY[settings.venueMode]}`,
    "",
    colorInstructions(settings),
    "",
    "STYLE TARGET: Modern Indian wedding in the United States—sophisticated, photoreal, editorial wedding photography.",
    "Avoid cartoonish or painterly looks; avoid extreme fisheye or surreal reinterpretation.",
    "Lighting should be flattering and realistic; depth of field appropriate for venue photography.",
    notes
      ? `ADDITIONAL CLIENT NOTES (honor if compatible with the blueprint): ${notes}`
      : "",
  ];

  return sections.filter(Boolean).join("\n");
}
