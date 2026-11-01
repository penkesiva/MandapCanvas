import { EVENTS, eventLabel, getPalette, getPreset, getTradition } from "./catalog";
import type { AlbumConfig, EventDesign, Shot } from "./types";

/**
 * Builds the image-model prompt for one shot. Kept deterministic and readable so it can be
 * tuned without touching the pipeline. Reference images (sketch, faces, inventory) are attached
 * separately; `referenceNotes` explains to the model what each attached image is.
 */

export interface PromptRefs {
  decorImage: boolean;
  brideImage: boolean;
  groomImage: boolean;
  inventoryCount: number;
}

const CATEGORY_FRAMING: Record<Shot["category"], string> = {
  decor:
    "SHOT: Wide, straight-on establishing photograph of the full decor and stage. No people in the frame. Symmetrical composition, eye level, 24–35mm lens.",
  decor_detail:
    "SHOT: Close-up detail photograph of the decor — florals, fabric texture, lighting and props — with shallow depth of field. No people.",
  bride:
    "SHOT: Editorial bridal portrait, three-quarter length, the bride standing or seated within the decor, which stays recognizable in the softly blurred background.",
  groom:
    "SHOT: Editorial groom portrait, three-quarter length, standing confidently within the decor, which stays recognizable in the softly blurred background.",
  couple:
    "SHOT: Candid editorial photograph of the bride and groom together, natural interaction, decor visible behind them.",
  couple_stage:
    "SHOT: Wide photograph of the bride and groom at the stage or mandap, small in frame so the full decor reads clearly, as a wedding photographer would capture it.",
  family:
    "SHOT: Candid group photograph of the bridal party and close family (5–8 people) in outfits color-coordinated with the event palette, laughing naturally, decor behind them.",
};

function decorDescription(config: AlbumConfig, shot: Shot, design: EventDesign | null): string {
  const tradition = getTradition(config.tradition);
  const isCeremony = shot.event === "ceremony";
  const base = isCeremony ? tradition.ceremonyDecor : EVENTS[shot.event].decor;
  if (design?.source === "preset") {
    const preset = getPreset(design.presetId);
    const m = preset.meta;
    return [
      `${base}, designed in the "${preset.name}" style:`,
      `layout — ${m.layout};`,
      `structure — ${m.structure};`,
      `florals — ${m.florals};`,
      `draping — ${m.draping};`,
      `details — ${m.details};`,
      `overall — ${m.style}.`,
      "Recolor every flower and fabric of this style to the chosen palette.",
    ].join(" ");
  }
  return base;
}

function outfitDescription(config: AlbumConfig, shot: Shot, palette: ReturnType<typeof getPalette>): string {
  const tradition = getTradition(config.tradition);
  const ev = EVENTS[shot.event];
  const bride = shot.event === "ceremony" ? tradition.bride : ev.brideOutfit;
  const groom = shot.event === "ceremony" ? tradition.groom : ev.groomOutfit;
  return [
    `BRIDE OUTFIT: ${bride}.`,
    `GROOM OUTFIT: ${groom}.`,
    `OUTFIT COLORS: coordinate with the decor palette — ${palette.outfits}. Outfits must complement, not clash with, the decor.`,
  ].join(" ");
}

function peopleRules(config: AlbumConfig, refs: PromptRefs, shot: Shot): string {
  const needs = !["decor", "decor_detail"].includes(shot.category);
  if (!needs) return "PEOPLE: none. Do not include any people, mannequins or silhouettes.";
  const rules: string[] = ["PEOPLE: adults only, natural proportions, realistic hands, tasteful and modest styling."];
  if (config.people.mode === "likeness" && (refs.brideImage || refs.groomImage)) {
    if (refs.brideImage && ["bride", "couple", "couple_stage", "family"].includes(shot.category))
      rules.push("The bride must closely resemble the person in the BRIDE reference photo (face, skin tone, hair), restyled for the event.");
    if (refs.groomImage && ["groom", "couple", "couple_stage", "family"].includes(shot.category))
      rules.push("The groom must closely resemble the person in the GROOM reference photo (face, skin tone, hair, facial hair), restyled for the event.");
  } else {
    rules.push(
      "Keep faces soft, partially turned, or naturally out of focus so the image reads as a style concept rather than a portrait of specific people.",
    );
  }
  return rules.join(" ");
}

export function buildShotPrompt(config: AlbumConfig, shot: Shot, refs: PromptRefs, design: EventDesign | null = null): string {
  const tradition = getTradition(config.tradition);
  const palette = getPalette(shot.paletteId);
  const ev = EVENTS[shot.event];
  const label = eventLabel(shot.event, config.tradition);
  const usesDecorRef = refs.decorImage;

  const day = shot.lighting === "day";
  const outdoor = shot.venue === "outdoor";
  const timeRule = day
    ? "DAYTIME. The scene is lit by bright, soft natural daylight (sun through windows, open sides or open sky). It must not look like night or a dim room: no dark backgrounds, no night sky, no dramatic colored uplighting. Candles or lamps may appear but are not the main light."
    : "EVENING, after sunset. Warm ambient uplighting, candles, lanterns and string lights set the mood; if outdoors the sky is dusk or night.";
  const venueRule = outdoor
    ? "OUTDOORS at a U.S. venue: garden lawn, courtyard, estate grounds or an open-sided tent, with greenery and sky visible. If the decor description below mentions indoor elements (ballroom, ceiling, chandeliers), translate them into outdoor equivalents (hanging installations from a frame or trees)."
    : "INDOORS at a U.S. venue: a hotel ballroom or elegant banquet hall with real architecture (walls, windows or ceiling visible).";

  const lines: string[] = [
    "ROLE: You are an award-winning South Asian wedding photographer and decor designer creating a realistic preview of a real wedding in the United States.",
    `WEDDING: ${tradition.name} wedding. EVENT: ${label}. MOOD: ${ev.mood}.`,
    `SETTING (MUST FOLLOW, overrides anything below): Time of day is ${timeRule} Location is ${venueRule}`,
    `COLOR PALETTE (MUST FOLLOW): ${palette.name} — ${palette.colors}. Decor, florals, fabrics and outfits all use these colors; avoid other dominant colors.`,
    CATEGORY_FRAMING[shot.category],
    `DECOR: ${decorDescription(config, shot, design)}`,
  ];

  if (usesDecorRef) {
    lines.push(
      "BLUEPRINT (CRITICAL): The attached DECOR reference is the customer's own sketch or photo. Match its layout, symmetry, proportions and structure — pillars, arches, canopy, backdrop shapes, focal points — and translate sketched masses into real flowers, fabric, metal and light. Do not mirror, rotate or redesign it.",
    );
    if (shot.event !== "ceremony") {
      lines.push(`Adapt the structure from the blueprint for the ${label} so it suits this event while keeping the same design language.`);
    }
  }

  if (refs.inventoryCount > 0) {
    lines.push(
      `STYLE REFERENCES: ${refs.inventoryCount} attached INVENTORY photos show pieces this decorator owns. Reuse their exact styles (structures, florals, fabrics, props) wherever they fit.`,
    );
  }

  lines.push(
    `PALETTE DETAILS: Flowers: ${palette.flowers}. Fabrics: ${palette.fabrics}. Use only flowers and materials that are realistic to source in the U.S.`,
  );

  if (!["decor", "decor_detail"].includes(shot.category)) {
    lines.push(outfitDescription(config, shot, palette));
  }
  lines.push(peopleRules(config, refs, shot));


  if (tradition.guardrails) lines.push(`RESPECT: ${tradition.guardrails}`);
  if (config.notes.trim()) lines.push(`CUSTOMER NOTES (follow when compatible): ${config.notes.trim().slice(0, 600)}`);

  lines.push(
    `FINAL CHECK before rendering: ${day ? "daylight, bright scene" : "evening, after sunset"}; ${outdoor ? "outdoors" : "indoors"}; dominant colors from the ${palette.name} palette.`,
  );
  lines.push(
    "QUALITY: Photorealistic, editorial wedding photography, natural color, believable scale and perspective, sharp focus on the subject. No text, logos, watermarks, signage or captions in the image. No distorted architecture or melted flowers.",
  );

  return lines.join("\n");
}

/**
 * Prompt for refining an existing image: change only what was asked, keep everything else.
 * The current image is attached as the CURRENT IMAGE reference.
 */
export function buildEditPrompt(config: AlbumConfig, shot: Shot, instruction: string): string {
  const palette = getPalette(shot.paletteId);
  const label = eventLabel(shot.event, config.tradition);
  return [
    config.look
      ? "TASK: Edit the attached CURRENT IMAGE, a photo-real wedding portrait of real people. Their faces must stay exactly the same."
      : "TASK: Edit the attached CURRENT IMAGE, a photo-real preview of a South Asian wedding decor design in the United States.",
    `CHANGE REQUESTED: ${instruction.trim().slice(0, 300)}`,
    "KEEP EVERYTHING ELSE THE SAME: the same layout and structure, camera angle and framing, venue, time of day and lighting, people (faces, poses, outfits) and every element the request does not mention. Do not redesign, re-crop or restage the scene.",
    config.look
      ? `CONTEXT: ${getTradition(config.tradition).name} wedding, ${label}.`
      : `CONTEXT: ${getTradition(config.tradition).name} wedding, ${label}. Palette in use: ${palette.name} (${palette.colors}). Only depart from it if the request asks.`,
    getTradition(config.tradition).guardrails ? `RESPECT: ${getTradition(config.tradition).guardrails}` : "",
    "QUALITY: Photorealistic, editorial wedding photography. No text, logos, watermarks or captions.",
  ]
    .filter(Boolean)
    .join("\n");
}
