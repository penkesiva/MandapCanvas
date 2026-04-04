export interface FloralPalette {
  id: string;
  name: string;
  description: string;
  flowers: string[];
  /** Short color / mood tags for UI chips. */
  tags: string[];
}

export const PALETTE_DISCLAIMER =
  "Flower availability and exact shades vary by season, region, and vendor; treat this as a planning guide.";

export const FLORAL_PALETTES: FloralPalette[] = [
  {
    id: "blush-ivory-sage",
    name: "Blush Pink + Ivory + Sage Green",
    description:
      "Soft romantic balance: warm blush against clean ivory with cool sage greenery for a fresh, modern mandap.",
    flowers: ["roses", "spray roses", "carnations", "lisianthus", "eucalyptus"],
    tags: ["romantic", "soft contrast", "greenery-forward"],
  },
  {
    id: "peach-cream-green",
    name: "Peach + Cream + Soft Green",
    description:
      "Warm peach tones with creamy whites and structured green lines—bright but still refined for ballroom or tent setups.",
    flowers: ["garden roses", "ranunculus", "mums", "stock", "Italian ruscus"],
    tags: ["warm", "garden", "layered"],
  },
  {
    id: "white-green-classic",
    name: "White + Green Classic",
    description:
      "Timeless high-contrast palette: abundant white blooms with varied eucalyptus and ruscus for crisp, editorial realism.",
    flowers: ["white roses", "hydrangea", "carnations", "baby's breath", "eucalyptus"],
    tags: ["classic", "bright", "timeless"],
  },
  {
    id: "dusty-mauve-cream",
    name: "Dusty Rose + Mauve + Cream",
    description:
      "Muted vintage romance with smoky mauves and dusty rose—photographs beautifully in mixed indoor lighting.",
    flowers: ["roses", "chrysanthemums", "lisianthus", "carnations", "seeded eucalyptus"],
    tags: ["muted", "moody", "elegant"],
  },
  {
    id: "marigold-us-substitute",
    name: "Marigold-inspired U.S. substitute",
    description:
      "Evokes festive marigold warmth using U.S.-sourced oranges and yellows with crisp accents—great for fusion or haldi-adjacent energy without relying on hard-to-source blooms.",
    flowers: ["orange roses", "yellow mums", "carnations", "craspedia accents", "greenery"],
    tags: ["festive", "warm citrus", "fusion"],
  },
];

export function getPaletteById(id: string | null | undefined): FloralPalette | undefined {
  if (!id) return undefined;
  return FLORAL_PALETTES.find((p) => p.id === id);
}
