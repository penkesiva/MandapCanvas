/**
 * Outfit color matching for Desi weddings: the bride's outfit color sets the groom's colors,
 * the bridal party's colors and a decor palette that won't swallow the outfit.
 * Hand-curated, not computed: these are the pairings stylists and decorators actually use.
 */

export interface Swatch {
  name: string;
  hex: string;
}

export interface OutfitMatch {
  id: string;
  name: string;
  hex: string;
  /** Common names couples search for. */
  aka: string[];
  groom: Swatch[];
  family: Swatch[];
  /** Decor palette id from lib/catalog PALETTES. */
  decorPalette: string;
  metal: "gold" | "antique gold" | "rose gold" | "silver";
  avoid: string;
  tip: string;
}

export const OUTFIT_COLORS: OutfitMatch[] = [
  {
    id: "red",
    name: "Classic red",
    hex: "#B3131B",
    aka: ["red lehenga", "sindoor red", "bridal red"],
    groom: [
      { name: "Ivory", hex: "#F6EFE2" },
      { name: "Champagne gold", hex: "#D8C08A" },
      { name: "Deep maroon", hex: "#5E1220" },
    ],
    family: [
      { name: "Marigold", hex: "#F2A900" },
      { name: "Rani pink", hex: "#C2185B" },
      { name: "Emerald", hex: "#0F5132" },
    ],
    decorPalette: "red_gold",
    metal: "gold",
    avoid: "An all-red backdrop: the bride disappears into it. Keep the stage cream or gold with red accents.",
    tip: "Red reads richest against warm ivory and gold. Let the groom's safa or dupatta pick up the red.",
  },
  {
    id: "maroon",
    name: "Maroon and wine",
    hex: "#6D1A36",
    aka: ["maroon lehenga", "wine lehenga", "burgundy"],
    groom: [
      { name: "Champagne", hex: "#E8D3B0" },
      { name: "Ivory", hex: "#F6EFE2" },
      { name: "Antique gold", hex: "#B8923A" },
    ],
    family: [
      { name: "Dusty rose", hex: "#C9898C" },
      { name: "Blush", hex: "#F2C4C0" },
      { name: "Bottle green", hex: "#1E4D3A" },
    ],
    decorPalette: "wine_champagne",
    metal: "antique gold",
    avoid: "Dark wood and dark florals behind her: maroon needs light behind it to photograph well.",
    tip: "Champagne and blush florals make maroon look expensive in evening light.",
  },
  {
    id: "pink",
    name: "Rani pink",
    hex: "#C2185B",
    aka: ["rani pink lehenga", "hot pink", "magenta"],
    groom: [
      { name: "Ivory", hex: "#F6EFE2" },
      { name: "Mint", hex: "#BFE3D0" },
      { name: "Gold", hex: "#D4A017" },
    ],
    family: [
      { name: "Marigold", hex: "#F2A900" },
      { name: "Orange", hex: "#E8590C" },
      { name: "Parrot green", hex: "#6A8D2B" },
    ],
    decorPalette: "marigold_haldi",
    metal: "gold",
    avoid: "Red and pink side by side in equal amounts; one should clearly lead.",
    tip: "Rani pink with marigold is the classic festive pairing for Mehndi and Sangeet.",
  },
  {
    id: "blush",
    name: "Blush and pastel pink",
    hex: "#F2C4C0",
    aka: ["blush lehenga", "pastel pink", "baby pink"],
    groom: [
      { name: "Ivory", hex: "#F6EFE2" },
      { name: "Sage", hex: "#A7BFA0" },
      { name: "Dusty rose", hex: "#C9898C" },
    ],
    family: [
      { name: "Mint", hex: "#BFE3D0" },
      { name: "Lavender", hex: "#C9B8E0" },
      { name: "Peach", hex: "#F6B99B" },
    ],
    decorPalette: "blush_ivory",
    metal: "rose gold",
    avoid: "An all-blush stage in daylight: everything washes out. Add greenery or a deeper accent.",
    tip: "Blush needs some green around it. Garden roses with eucalyptus are the safest pairing.",
  },
  {
    id: "peach",
    name: "Peach and coral",
    hex: "#F6B99B",
    aka: ["peach lehenga", "coral", "apricot"],
    groom: [
      { name: "Ivory", hex: "#F6EFE2" },
      { name: "Sage", hex: "#A7BFA0" },
      { name: "Light gold", hex: "#E3C77C" },
    ],
    family: [
      { name: "Sage", hex: "#A7BFA0" },
      { name: "Powder blue", hex: "#B9CFE3" },
      { name: "Dusty rose", hex: "#C9898C" },
    ],
    decorPalette: "peach_sage",
    metal: "gold",
    avoid: "Orange marigold decor: it makes peach look faded.",
    tip: "Peach and sage is one of the most-requested outdoor palettes for day ceremonies.",
  },
  {
    id: "orange",
    name: "Orange and saffron",
    hex: "#E8590C",
    aka: ["orange lehenga", "saffron", "kesariya"],
    groom: [
      { name: "Cream", hex: "#F5E6C8" },
      { name: "Mustard", hex: "#D4A017" },
      { name: "Olive", hex: "#6B7A3A" },
    ],
    family: [
      { name: "Rani pink", hex: "#C2185B" },
      { name: "Yellow", hex: "#F2C200" },
      { name: "Teal", hex: "#14706E" },
    ],
    decorPalette: "marigold_haldi",
    metal: "gold",
    avoid: "Red decor behind her; the two compete. Cream and green let saffron glow.",
    tip: "Saffron is a natural for Haldi and Mehndi; pair it with marigolds and mango leaves.",
  },
  {
    id: "yellow",
    name: "Haldi yellow",
    hex: "#F2C200",
    aka: ["yellow lehenga", "haldi outfit", "mustard"],
    groom: [
      { name: "White", hex: "#FAFAF5" },
      { name: "Pale yellow", hex: "#F7E7A6" },
      { name: "Parrot green", hex: "#6A8D2B" },
    ],
    family: [
      { name: "Orange", hex: "#E8590C" },
      { name: "Rani pink", hex: "#C2185B" },
      { name: "Mint", hex: "#BFE3D0" },
    ],
    decorPalette: "marigold_haldi",
    metal: "gold",
    avoid: "An all-yellow setup: add orange, pink or green so faces don't look sallow.",
    tip: "For Haldi, dress the family in a mix of yellow, orange and pink; the bride stays the brightest.",
  },
  {
    id: "emerald",
    name: "Emerald and bottle green",
    hex: "#0F5132",
    aka: ["green lehenga", "emerald", "bottle green"],
    groom: [
      { name: "Ivory", hex: "#F6EFE2" },
      { name: "Antique gold", hex: "#B8923A" },
      { name: "Deep green", hex: "#123A2B" },
    ],
    family: [
      { name: "Wine", hex: "#6D1A36" },
      { name: "Gold", hex: "#D4A017" },
      { name: "Blush", hex: "#F2C4C0" },
    ],
    decorPalette: "emerald_gold",
    metal: "antique gold",
    avoid: "Heavy green foliage walls: she blends in. Use white florals against green velvet instead.",
    tip: "Emerald with antique gold and white orchids is the go-to for Sangeet and Nikah evenings.",
  },
  {
    id: "mint",
    name: "Mint and sea green",
    hex: "#BFE3D0",
    aka: ["mint lehenga", "sea green", "pista"],
    groom: [
      { name: "Ivory", hex: "#F6EFE2" },
      { name: "Powder pink", hex: "#F7D6E0" },
      { name: "Mint", hex: "#BFE3D0" },
    ],
    family: [
      { name: "Lavender", hex: "#C9B8E0" },
      { name: "Peach", hex: "#F6B99B" },
      { name: "Powder pink", hex: "#F7D6E0" },
    ],
    decorPalette: "mint_pastel",
    metal: "silver",
    avoid: "Deep jewel tones nearby: they make mint look washed out.",
    tip: "Mint is a favorite for daytime Mehndi; pastel umbrellas and swings photograph beautifully with it.",
  },
  {
    id: "teal",
    name: "Teal and peacock blue",
    hex: "#14706E",
    aka: ["teal lehenga", "peacock blue", "turquoise"],
    groom: [
      { name: "Ivory", hex: "#F6EFE2" },
      { name: "Gold", hex: "#D4A017" },
      { name: "Teal", hex: "#14706E" },
    ],
    family: [
      { name: "Magenta", hex: "#B0186E" },
      { name: "Marigold", hex: "#F2A900" },
      { name: "Purple", hex: "#5B2A86" },
    ],
    decorPalette: "emerald_gold",
    metal: "gold",
    avoid: "Cool blue lighting: keep the light warm so teal stays rich.",
    tip: "Teal with magenta and gold is a peacock palette that works for Sangeet and Garba.",
  },
  {
    id: "royal_blue",
    name: "Royal and navy blue",
    hex: "#1C3F8C",
    aka: ["blue lehenga", "royal blue", "navy"],
    groom: [
      { name: "Silver grey", hex: "#C0C6D0" },
      { name: "Ivory", hex: "#F6EFE2" },
      { name: "Midnight blue", hex: "#1A2440" },
    ],
    family: [
      { name: "Silver", hex: "#C0C6D0" },
      { name: "Powder blue", hex: "#B9CFE3" },
      { name: "Blush", hex: "#F2C4C0" },
    ],
    decorPalette: "royal_blue_silver",
    metal: "silver",
    avoid: "Gold-heavy decor with a silver-embroidered outfit; match the metals.",
    tip: "Royal blue looks striking for a reception with white florals, crystal and silver.",
  },
  {
    id: "lavender",
    name: "Lavender and lilac",
    hex: "#C9B8E0",
    aka: ["lavender lehenga", "lilac", "purple pastel"],
    groom: [
      { name: "Ivory", hex: "#F6EFE2" },
      { name: "Lavender", hex: "#C9B8E0" },
      { name: "Silver grey", hex: "#C0C6D0" },
    ],
    family: [
      { name: "Mint", hex: "#BFE3D0" },
      { name: "Powder pink", hex: "#F7D6E0" },
      { name: "Butter yellow", hex: "#FFF4D6" },
    ],
    decorPalette: "mint_pastel",
    metal: "silver",
    avoid: "Bright marigold decor: it overwhelms soft lilac.",
    tip: "Lavender, mint and powder pink make a soft pastel set for daytime events.",
  },
  {
    id: "ivory",
    name: "Ivory and gold",
    hex: "#F3EBDD",
    aka: ["white lehenga", "ivory", "cream and gold", "off white"],
    groom: [
      { name: "Ivory", hex: "#F6EFE2" },
      { name: "Gold", hex: "#D4A017" },
      { name: "Sage", hex: "#A7BFA0" },
    ],
    family: [
      { name: "Blush", hex: "#F2C4C0" },
      { name: "Sage", hex: "#A7BFA0" },
      { name: "Champagne", hex: "#E8D3B0" },
    ],
    decorPalette: "blush_ivory",
    metal: "gold",
    avoid: "An all-white stage: she needs color behind her. Add blush, greenery or gold.",
    tip: "Ivory is popular for Anand Karaj and receptions; a colored backdrop keeps the photos from flattening.",
  },
  {
    id: "gold",
    name: "Gold and mustard",
    hex: "#D4A017",
    aka: ["gold lehenga", "mustard lehenga", "tissue gold"],
    groom: [
      { name: "Ivory", hex: "#F6EFE2" },
      { name: "Maroon", hex: "#5E1220" },
      { name: "Bottle green", hex: "#1E4D3A" },
    ],
    family: [
      { name: "Emerald", hex: "#0F5132" },
      { name: "Wine", hex: "#6D1A36" },
      { name: "Rani pink", hex: "#C2185B" },
    ],
    decorPalette: "emerald_gold",
    metal: "gold",
    avoid: "Gold backdrop and gold outfit: use deep green or wine behind her for contrast.",
    tip: "A gold outfit glows against deep jewel-toned decor in evening light.",
  },
];

export const MATCHER_EVENTS: { id: string; name: string; note: string }[] = [
  { id: "haldi", name: "Haldi", note: "Daytime and messy: keep the bride in the lightest, brightest shade; family in yellows, oranges and pinks." },
  { id: "mehndi", name: "Mehndi", note: "Relaxed and colorful: prints, mirror-work and greens or pastels work well." },
  { id: "sangeet", name: "Sangeet / Garba", note: "Evening party: jewel tones, sequins and metallics catch the light." },
  { id: "ceremony", name: "Wedding ceremony", note: "The bride should be the most saturated color in the frame; decor stays a shade lighter." },
  { id: "reception", name: "Reception", note: "Polished and glamorous: deeper tones, gowns or sarees, crystal and candlelight." },
];

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Picks the curated color closest to any color the user enters (weighted RGB distance). */
export function nearestOutfit(hex: string): OutfitMatch {
  const [r, g, b] = hexToRgb(hex);
  let best = OUTFIT_COLORS[0];
  let bestD = Infinity;
  for (const c of OUTFIT_COLORS) {
    const [r2, g2, b2] = hexToRgb(c.hex);
    const rm = (r + r2) / 2;
    const d = (2 + rm / 256) * (r - r2) ** 2 + 4 * (g - g2) ** 2 + (2 + (255 - rm) / 256) * (b - b2) ** 2;
    if (d < bestD) {
      bestD = d;
      best = c;
    }
  }
  return best;
}
