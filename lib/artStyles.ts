/**
 * Art portrait styles for the free "wedding art portrait" tool: their own photo, redrawn in a style.
 * Safe to import on the client. Style names describe a look; none names a studio, brand or living artist.
 */

export type ArtStyleId =
  | "anime"
  | "eighties"
  | "bollywood"
  | "mughal"
  | "madhubani"
  | "tanjore"
  | "oil"
  | "animated3d"
  | "watercolor"
  | "popart";

export interface ArtStyle {
  id: ArtStyleId;
  name: string;
  hint: string;
  /** Shown first, with a "Popular" tag. */
  popular?: boolean;
  /** Glasses look out of place in this art form, so the tool suggests removing them. */
  noGlasses?: boolean;
  /** Tile colors until an example is painted. */
  swatch: [string, string];
  prompt: string;
}

export const ART_STYLES: ArtStyle[] = [
  {
    id: "anime",
    name: "Dreamy anime",
    hint: "Hand-painted anime film",
    popular: true,
    swatch: ["#9CC9E8", "#F7E3A1"],
    prompt:
      "a still from a hand-drawn Japanese anime feature film: soft cel shading, clean expressive line work, gentle watercolor-painted backgrounds with lush greenery and big billowing clouds, warm nostalgic afternoon light, a calm storybook mood",
  },
  {
    id: "eighties",
    name: "80s retro",
    hint: "Airbrushed glamour, neon",
    popular: true,
    swatch: ["#FF5FA2", "#5B3FD1"],
    prompt:
      "a 1980s glamour studio portrait: airbrushed soft-focus skin, big voluminous hair, bold makeup, shoulder pads or a bright blazer, a purple and pink laser or neon grid backdrop, a soft glow and a little film grain, pure 80s",
  },
  {
    id: "bollywood",
    name: "Bollywood poster",
    hint: "70s hand-painted film art",
    swatch: ["#E8892B", "#8E1B2B"],
    prompt:
      "a 1970s hand-painted Bollywood film poster: bold confident brush strokes, saturated reds, oranges and teals, dramatic lighting on the faces, a painted sunset sky, heroic romantic poses, with no title text or credits",
  },
  {
    id: "mughal",
    name: "Mughal miniature",
    noGlasses: true,
    hint: "Palace garden, gold borders",
    swatch: ["#0F4D36", "#C9A24B"],
    prompt:
      "a Mughal miniature painting: flat perspective, very fine brushwork, profile or three-quarter faces, rich jewel tones on a palace terrace or garden with cypress trees and fountains, ornate gold floral borders",
  },
  {
    id: "madhubani",
    name: "Madhubani folk art",
    noGlasses: true,
    hint: "Bold lines, fish and peacocks",
    swatch: ["#D7263D", "#F2C14E"],
    prompt:
      "a Madhubani folk painting from Bihar: bold black outlines, flat bright colors, every space filled with fine line patterns, fish, peacocks, lotus and sun motifs around the figures, a decorative double border",
  },
  {
    id: "tanjore",
    name: "Tanjore painting",
    noGlasses: true,
    hint: "Gold foil, gem colors",
    swatch: ["#7A1F3D", "#E2B43C"],
    prompt:
      "a classical Tanjore (Thanjavur) painting: rich flat reds, greens and blues, raised gold-foil jewelry, arches and borders with gem-like accents, rounded serene faces, an ornate temple-arch frame",
  },
  {
    id: "oil",
    name: "Classic oil painting",
    noGlasses: true,
    hint: "19th-century Indian portrait",
    swatch: ["#6D4C2F", "#D8B98A"],
    prompt:
      "a 19th-century Indian academic oil painting on canvas: realistic and graceful, soft warm lighting, rich silk fabrics with visible brush texture, a muted palace or garden background, museum-quality varnish glow",
  },
  {
    id: "animated3d",
    name: "3D animated",
    hint: "Animated movie characters",
    swatch: ["#56B4E9", "#FFB86B"],
    prompt:
      "characters in a modern 3D animated family movie: stylized proportions, big expressive eyes, smooth skin shading, soft global illumination, a bright cheerful festive set with fairy lights",
  },
  {
    id: "watercolor",
    name: "Watercolor sketch",
    hint: "Loose ink and wash",
    swatch: ["#F4B6C2", "#A7BFA0"],
    prompt:
      "a loose wedding watercolor illustration: fine ink outlines, soft washes of color that bleed at the edges, lots of white paper showing, a few painted florals around the figures, elegant and airy",
  },
  {
    id: "popart",
    name: "Pop art comic",
    hint: "Halftone dots, bold color",
    swatch: ["#FFD23F", "#EE4266"],
    prompt:
      "a pop art comic book panel: thick black outlines, flat primary colors, Ben-Day halftone dots, a bold graphic background, with no speech bubbles or text",
  },
];

export function getArtStyle(id: unknown): ArtStyle | null {
  return ART_STYLES.find((s) => s.id === id) ?? null;
}

export type ArtOutfit = "wedding" | "keep";

export type ArtGlasses = "keep" | "remove";

export function buildArtPrompt(style: ArtStyle, outfit: ArtOutfit, glasses: ArtGlasses = style.noGlasses ? "remove" : "keep"): string {
  return [
    `Redraw the attached PHOTO as ${style.prompt}.`,
    "LIKENESS (MUST FOLLOW): keep every person recognizable in this style: their face shape, eyes, skin tone, hair, facial hair, age and build. Keep the same number of people, in the same positions and roughly the same pose. Do not add or remove anyone, and do not swap anyone for a model.",
    glasses === "remove"
      ? "EYEWEAR (MUST FOLLOW): no one wears glasses or sunglasses. Remove them completely and draw the eyes naturally, with no marks on the nose."
      : "EYEWEAR: anyone who wears glasses in the photo keeps them, redrawn in this style.",
    outfit === "wedding"
      ? "OUTFITS: dress them for their Indian wedding in this style: the woman in a bridal lehenga or saree with jewelry, the man in a sherwani or kurta; a man only ever wears men's clothing."
      : "OUTFITS: keep the clothes they wear in the photo, redrawn in this style.",
    "The whole image is in this art style, not a photo with a filter. No text, captions, logos, signatures or watermarks.",
    "Tasteful and modest. Adults only.",
  ].join("\n\n");
}
