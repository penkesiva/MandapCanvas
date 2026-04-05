export interface FloralPalette {
  id: string;
  name: string;
  description: string;
  flowers: string[];
  /** Short color / mood tags for UI chips. */
  tags: string[];
}

export const PALETTE_DISCLAIMER = "Availability varies by season and vendor.";

export const FLORAL_PALETTES: FloralPalette[] = [
  {
    id: "blush-ivory-sage",
    name: "Blush Pink + Ivory + Sage Green",
    description: "Soft blush, ivory, and sage greenery.",
    flowers: ["roses", "spray roses", "carnations", "lisianthus", "eucalyptus"],
    tags: ["romantic", "soft contrast", "greenery-forward"],
  },
  {
    id: "peach-cream-green",
    name: "Peach + Cream + Soft Green",
    description: "Warm peach, cream, and structured greens.",
    flowers: ["garden roses", "ranunculus", "mums", "stock", "Italian ruscus"],
    tags: ["warm", "garden", "layered"],
  },
  {
    id: "white-green-classic",
    name: "White + Green Classic",
    description: "Classic white blooms and eucalyptus.",
    flowers: ["white roses", "hydrangea", "carnations", "baby's breath", "eucalyptus"],
    tags: ["classic", "bright", "timeless"],
  },
  {
    id: "dusty-mauve-cream",
    name: "Dusty Rose + Mauve + Cream",
    description: "Dusty rose, mauve, and cream.",
    flowers: ["roses", "chrysanthemums", "lisianthus", "carnations", "seeded eucalyptus"],
    tags: ["muted", "moody", "elegant"],
  },
  {
    id: "marigold-us-substitute",
    name: "Marigold-inspired U.S. substitute",
    description: "Festive orange and yellow tones (U.S.-sourced).",
    flowers: ["orange roses", "yellow mums", "carnations", "craspedia accents", "greenery"],
    tags: ["festive", "warm citrus", "fusion"],
  },
];

export function getPaletteById(id: string | null | undefined): FloralPalette | undefined {
  if (!id) return undefined;
  return FLORAL_PALETTES.find((p) => p.id === id);
}
