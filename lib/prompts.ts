import { EVENTS, eventLabel, getPalette, getPreset, getTradition } from "./catalog";
import type { AlbumConfig, Shot } from "./types";

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

function decorDescription(config: AlbumConfig, shot: Shot): string {
  const tradition = getTradition(config.tradition);
  const isCeremony = shot.event === "ceremony";
  const base = isCeremony ? tradition.ceremonyDecor : EVENTS[shot.event].decor;
  if (config.decor.source === "preset") {
    const preset = getPreset(config.decor.presetId);
    return `${base}, interpreted in this style: ${preset.prompt}`;
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

export function buildShotPrompt(config: AlbumConfig, shot: Shot, refs: PromptRefs): string {
  const tradition = getTradition(config.tradition);
  const palette = getPalette(shot.paletteId);
  const ev = EVENTS[shot.event];
  const label = eventLabel(shot.event, config.tradition);
  const usesDecorRef = refs.decorImage;

  const lines: string[] = [
    "ROLE: You are an award-winning South Asian wedding photographer and decor designer creating a realistic preview of a real wedding in the United States.",
    `WEDDING: ${tradition.name} wedding. EVENT: ${label}. MOOD: ${ev.mood}.`,
    CATEGORY_FRAMING[shot.category],
    `DECOR: ${decorDescription(config, shot)}.`,
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
    `PALETTE: ${palette.name}. Flowers: ${palette.flowers}. Fabrics: ${palette.fabrics}. Use only flowers and materials that are realistic to source in the U.S.`,
  );

  if (!["decor", "decor_detail"].includes(shot.category)) {
    lines.push(outfitDescription(config, shot, palette));
  }
  lines.push(peopleRules(config, refs, shot));

  lines.push(
    `VENUE: ${shot.venue === "outdoor" ? "outdoor — garden, lawn or tent at a U.S. venue" : "indoor — hotel ballroom or banquet hall in the United States"}. LIGHT: ${
      shot.lighting === "evening"
        ? "evening — warm uplighting, candles, string lights, glowing atmosphere"
        : "daytime — soft natural light, bright and airy"
    }.`,
  );

  if (tradition.guardrails) lines.push(`RESPECT: ${tradition.guardrails}`);
  if (config.notes.trim()) lines.push(`CUSTOMER NOTES (follow when compatible): ${config.notes.trim().slice(0, 600)}`);

  lines.push(
    "QUALITY: Photorealistic, editorial wedding photography, natural color, believable scale and perspective, sharp focus on the subject. No text, logos, watermarks, signage or captions in the image. No distorted architecture or melted flowers.",
  );

  return lines.join("\n");
}
