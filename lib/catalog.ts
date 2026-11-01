import type { EventSetting, EventId, ShotCategory, ShotMix, TraditionId } from "./types";

/* ---------------------------------------------------------------- Traditions */

export interface Tradition {
  id: TraditionId;
  name: string;
  short: string;
  events: EventId[];
  ceremonyName: string;
  receptionName: string;
  ceremonyDecor: string;
  bride: string;
  groom: string;
  guardrails?: string;
}

export const TRADITIONS: Tradition[] = [
  {
    id: "hindu_north",
    name: "North Indian Hindu",
    short: "North Indian",
    events: ["haldi", "mehndi", "sangeet", "ceremony", "reception"],
    ceremonyName: "Pheras",
    receptionName: "Reception",
    ceremonyDecor:
      "a four-pillar Hindu wedding mandap with a canopy, a small havan kund (sacred fire) at the center, two seats for the couple, florals on pillars and canopy",
    bride: "a richly embroidered bridal lehenga with dupatta, kundan or polki jewelry, maang tikka",
    groom: "a sherwani with dupatta and a safa (turban), mojaris",
  },
  {
    id: "hindu_south",
    name: "South Indian (Tamil, Telugu, Kannada, Malayali)",
    short: "South Indian",
    events: ["haldi", "mehndi", "sangeet", "ceremony", "reception"],
    ceremonyName: "Muhurtham",
    receptionName: "Reception",
    ceremonyDecor:
      "a South Indian temple-style mandapam with carved pillars, banana trees and coconut fronds at the entrance, thick jasmine and marigold garlands, brass kuthuvilakku lamps, kolam on the floor, a low wooden seat",
    bride: "a Kanjeevaram silk saree with temple jewelry, jasmine in the hair, a gold waist belt (oddiyanam)",
    groom: "a silk veshti/panche with angavastram, or a silk kurta with veshti",
  },
  {
    id: "gujarati",
    name: "Gujarati",
    short: "Gujarati",
    events: ["haldi", "mehndi", "garba", "ceremony", "reception"],
    ceremonyName: "Hast Melap & Pheras",
    receptionName: "Reception",
    ceremonyDecor:
      "a four-pillar mandap with bright florals, mirror-work and bandhani fabric accents, brass pots (matlis) stacked at the corners, a small sacred fire",
    bride: "a red-and-white panetar saree or gharchola with gold jewelry",
    groom: "a sherwani or kediyu with a safa",
  },
  {
    id: "bengali",
    name: "Bengali",
    short: "Bengali",
    events: ["haldi", "mehndi", "sangeet", "ceremony", "reception"],
    ceremonyName: "Bibaho",
    receptionName: "Bou Bhaat / Reception",
    ceremonyDecor:
      "a Bengali chhadnatala canopy with banana plants at the four corners, alpana white floor art, marigold and rajnigandha (tuberose) garlands, brass and clay lamps",
    bride: "a red Banarasi silk saree with gold jewelry, a white shola mukut, alta on the feet",
    groom: "a cream dhoti and silk panjabi with a white shola topor",
  },
  {
    id: "marathi",
    name: "Marathi",
    short: "Marathi",
    events: ["haldi", "mehndi", "sangeet", "ceremony", "reception"],
    ceremonyName: "Lagna",
    receptionName: "Reception",
    ceremonyDecor:
      "a Marathi mandap with marigold and mango-leaf torans, a brass kalash, rangoli at the stage, tall brass samai lamps",
    bride: "a nine-yard nauvari silk saree in green or yellow, nath (nose ring), mundavalya on the forehead",
    groom: "a silk kurta with dhoti or sherwani, a pheta turban, mundavalya on the forehead",
  },
  {
    id: "sikh",
    name: "Sikh (Anand Karaj)",
    short: "Sikh",
    events: ["mehndi", "sangeet", "ceremony", "reception"],
    ceremonyName: "Anand Karaj",
    receptionName: "Reception",
    ceremonyDecor:
      "an elegantly decorated hall for an Anand Karaj with white floor seating, soft florals lining the aisle and the stage edge, brass lamps",
    bride: "a bridal lehenga or salwar suit with a heavy dupatta, kalire on the wrists, chooda bangles",
    groom: "a sherwani or achkan with a matching dastaar (turban) and a sehra-free look",
    guardrails:
      "Treat the Sikh ceremony with respect: do not depict the Guru Granth Sahib, any scripture, religious text or calligraphy; keep focus on the decorated hall.",
  },
  {
    id: "muslim",
    name: "Muslim (Nikah & Walima)",
    short: "Muslim",
    events: ["mehndi", "sangeet", "ceremony", "reception"],
    ceremonyName: "Nikah",
    receptionName: "Walima",
    ceremonyDecor:
      "a Nikah stage with Mughal-style scalloped arches, jaali screens, cascading white florals and a loveseat for the couple",
    bride: "a sharara, gharara or lehenga with a heavy dupatta and jhoomar",
    groom: "a sherwani or achkan, optionally with a kullah or safa",
    guardrails: "Do not render any religious text, scripture or calligraphy.",
  },
  {
    id: "christian",
    name: "Desi Christian",
    short: "Christian",
    events: ["haldi", "mehndi", "sangeet", "ceremony", "reception"],
    ceremonyName: "Church ceremony",
    receptionName: "Reception",
    ceremonyDecor:
      "a ceremony aisle and altar styled for a Desi Christian wedding, with floral pew ends, a floral arch and candles",
    bride: "an ivory saree with gold border or a white gown, with a veil",
    groom: "a tuxedo, bandhgala or ivory sherwani",
    guardrails: "Do not render any religious text.",
  },
  {
    id: "fusion",
    name: "Fusion & interfaith",
    short: "Fusion",
    events: ["haldi", "mehndi", "sangeet", "ceremony", "reception"],
    ceremonyName: "Ceremony",
    receptionName: "Reception",
    ceremonyDecor:
      "a fusion ceremony structure that blends a mandap canopy with a modern floral arch, open and airy",
    bride: "a modern lehenga or a gown-inspired lehenga",
    groom: "a bandhgala, Indo-western sherwani or a tuxedo with a stole",
  },
];

export function getTradition(id: string): Tradition {
  return TRADITIONS.find((t) => t.id === id) ?? TRADITIONS[0];
}

/* ---------------------------------------------------------------- Events */

export interface EventDef {
  id: EventId;
  name: string;
  decor: string;
  mood: string;
  brideOutfit: string;
  groomOutfit: string;
  defaultVenue: "indoor" | "outdoor";
  defaultLighting: "day" | "evening";
}

export const EVENTS: Record<EventId, EventDef> = {
  haldi: {
    id: "haldi",
    name: "Haldi",
    decor:
      "a Haldi setup with a low seating platform, hanging marigold strings, brass urlis with turmeric paste and floating flowers, floor cushions",
    mood: "sunny, playful, joyful",
    brideOutfit: "a light, simple outfit (sharara, kurta set or cotton lehenga) with floral jewelry",
    groomOutfit: "a simple kurta-pyjama",
    defaultVenue: "outdoor",
    defaultLighting: "day",
  },
  mehndi: {
    id: "mehndi",
    name: "Mehndi",
    decor:
      "a Mehndi lounge with low seating, embroidered bolsters, a floral swing as the focal point, hanging umbrellas or lanterns, rugs",
    mood: "colorful, relaxed, festive",
    brideOutfit: "a flowy lehenga or sharara, floral or light jewelry, henna on the hands",
    groomOutfit: "a kurta with a printed or embroidered jacket",
    defaultVenue: "outdoor",
    defaultLighting: "day",
  },
  sangeet: {
    id: "sangeet",
    name: "Sangeet",
    decor:
      "a Sangeet stage with a dance floor, a statement floral or light installation, draping, and guest tables at the edges",
    mood: "glamorous, celebratory party",
    brideOutfit: "a glamorous embellished lehenga or saree",
    groomOutfit: "an embellished bandhgala, Indo-western jacket or tuxedo",
    defaultVenue: "indoor",
    defaultLighting: "evening",
  },
  garba: {
    id: "garba",
    name: "Garba / Raas",
    decor:
      "a Garba celebration with a central decorated pole or lamp, colorful mirror-work and bandhani fabric canopies, festoon strings, an open dance floor",
    mood: "energetic, colorful, traditional folk",
    brideOutfit: "a mirror-work chaniya choli with oxidized jewelry",
    groomOutfit: "a kediyu with dhoti and a colorful pagdi",
    defaultVenue: "indoor",
    defaultLighting: "evening",
  },
  ceremony: {
    id: "ceremony",
    name: "Wedding ceremony",
    decor: "",
    mood: "sacred, grand, elegant",
    brideOutfit: "",
    groomOutfit: "",
    defaultVenue: "indoor",
    defaultLighting: "day",
  },
  reception: {
    id: "reception",
    name: "Reception",
    decor:
      "a reception stage with a floral wall, a sofa for the couple, statement chandeliers, a styled aisle, round guest tables",
    mood: "luxurious, modern, polished",
    brideOutfit: "a reception lehenga, gown-style lehenga or saree",
    groomOutfit: "a tuxedo, bandhgala or embellished sherwani",
    defaultVenue: "indoor",
    defaultLighting: "evening",
  },
};

/** A sensible first palette when someone adds an event. */
export const EVENT_DEFAULT_PALETTE: Record<EventId, string> = {
  haldi: "marigold_haldi",
  mehndi: "mint_pastel",
  sangeet: "wine_champagne",
  garba: "marigold_haldi",
  ceremony: "red_gold",
  reception: "blush_ivory",
};

/**
 * Brings per-event settings in line with the chosen events and the pack's palette limit
 * (distinct palettes across the whole album). Returns the settings and the album-wide palette list.
 */
export function normalizeEventSettings(
  events: EventId[],
  settings: Partial<Record<EventId, EventSetting>> | undefined,
  fallbackPalettes: string[],
  maxPalettes: number,
): { eventSettings: Partial<Record<EventId, EventSetting>>; palettes: string[] } {
  const valid = (id: string) => PALETTES.some((p) => p.id === id);
  const out: Partial<Record<EventId, EventSetting>> = {};
  const union: string[] = [];
  for (const e of events) {
    const cur = settings?.[e];
    const ev = EVENTS[e];
    const pals: string[] = [];
    for (const p of new Set((cur?.palettes ?? fallbackPalettes).filter(valid))) {
      if (union.includes(p)) pals.push(p);
      else if (union.length < maxPalettes) {
        union.push(p);
        pals.push(p);
      }
    }
    if (!pals.length) {
      const preferred = EVENT_DEFAULT_PALETTE[e];
      const first = union.includes(preferred) || union.length < maxPalettes ? preferred : union[0];
      if (!union.includes(first)) union.push(first);
      pals.push(first);
    }
    out[e] = {
      palettes: pals,
      venue: cur?.venue === "indoor" || cur?.venue === "outdoor" ? cur.venue : ev.defaultVenue,
      lighting: cur?.lighting === "day" || cur?.lighting === "evening" ? cur.lighting : ev.defaultLighting,
    };
  }
  return { eventSettings: out, palettes: union };
}

export function eventLabel(event: EventId, tradition: TraditionId): string {
  const t = getTradition(tradition);
  if (event === "ceremony") return t.ceremonyName;
  if (event === "reception") return t.receptionName;
  return EVENTS[event].name;
}

/* ---------------------------------------------------------------- Palettes */

export interface Palette {
  id: string;
  name: string;
  swatches: [string, string, string];
  /** Plain-words color brief: what dominates and what accents. */
  colors: string;
  flowers: string;
  fabrics: string;
  outfits: string;
}

export const PALETTES: Palette[] = [
  {
    id: "red_gold",
    name: "Sindoor red & gold",
    swatches: ["#A4161A", "#D4A017", "#F5E6C8"],
    colors: "dominant deep sindoor red (#A4161A), accents of warm metallic gold (#D4A017), soft cream (#F5E6C8) as the light base",
    flowers: "red roses, carnations, marigold accents, gold-sprayed leaves",
    fabrics: "red velvet and gold brocade",
    outfits: "deep red with gold zari for the bride; ivory and gold with a red accent for the groom",
  },
  {
    id: "blush_ivory",
    name: "Blush & ivory",
    swatches: ["#F2C4C0", "#FFF8EE", "#C9A24B"],
    colors: "dominant soft blush pink (#F2C4C0) and ivory white (#FFF8EE), small touches of muted gold (#C9A24B); light, airy and pale overall",
    flowers: "garden roses, spray roses, hydrangea, lisianthus, eucalyptus",
    fabrics: "ivory chiffon and blush silk",
    outfits: "blush pink with gold for the bride; ivory with blush accents for the groom",
  },
  {
    id: "emerald_gold",
    name: "Emerald & antique gold",
    swatches: ["#0F5132", "#B8923A", "#F3EBDD"],
    colors: "dominant deep emerald green (#0F5132), antique gold (#B8923A) details, warm ivory (#F3EBDD) florals for contrast",
    flowers: "white roses, orchids, deep greenery, gold accents",
    fabrics: "emerald velvet and antique gold brocade",
    outfits: "emerald green with antique gold for the bride; ivory or deep green for the groom",
  },
  {
    id: "marigold_haldi",
    name: "Marigold & haldi",
    swatches: ["#F2A900", "#E8590C", "#6A8D2B"],
    colors: "dominant marigold yellow (#F2A900) and saffron orange (#E8590C), fresh leaf green (#6A8D2B) accents; bright and sunny",
    flowers: "marigolds, yellow mums, orange roses, mango leaves",
    fabrics: "mustard and saffron cotton with mirror-work",
    outfits: "mustard yellow and saffron for the bride; pale yellow or white for the groom",
  },
  {
    id: "mint_pastel",
    name: "Mint & pastel",
    swatches: ["#BFE3D0", "#F7D6E0", "#FFF4D6"],
    colors: "dominant soft mint green (#BFE3D0) and powder pink (#F7D6E0), butter cream (#FFF4D6) base; pale, fresh, pastel",
    flowers: "pastel roses, sweet peas, delphinium, white hydrangea",
    fabrics: "pastel organza and sheer drapes",
    outfits: "mint and powder pink for the bride; pastel mint or ivory for the groom",
  },
  {
    id: "royal_blue_silver",
    name: "Royal blue & silver",
    swatches: ["#1C3F8C", "#C0C6D0", "#F4F6FA"],
    colors: "dominant royal blue (#1C3F8C), cool silver (#C0C6D0) metal details, crisp white (#F4F6FA) florals; no gold",
    flowers: "white orchids, blue delphinium, white roses, silver dollar eucalyptus",
    fabrics: "royal blue velvet and silver sequin",
    outfits: "royal blue with silver for the bride; midnight blue or silver for the groom",
  },
  {
    id: "wine_champagne",
    name: "Wine & champagne",
    swatches: ["#6D1A36", "#E8D3B0", "#B08D57"],
    colors: "dominant deep wine burgundy (#6D1A36), champagne beige (#E8D3B0) and soft antique gold (#B08D57)",
    flowers: "burgundy roses, champagne roses, dahlias, ranunculus",
    fabrics: "wine velvet and champagne satin",
    outfits: "wine with champagne gold for the bride; champagne or wine for the groom",
  },
  {
    id: "peach_sage",
    name: "Peach & sage",
    swatches: ["#F6B99B", "#A7BFA0", "#FDF1E6"],
    colors: "dominant soft peach (#F6B99B) and sage green (#A7BFA0), warm cream (#FDF1E6) base; natural and soft",
    flowers: "peach garden roses, ranunculus, sage eucalyptus, olive branches",
    fabrics: "peach chiffon and natural linen",
    outfits: "peach with gold for the bride; sage or ivory for the groom",
  },
];

export function getPalette(id: string): Palette {
  return PALETTES.find((p) => p.id === id) ?? PALETTES[1];
}

/* ---------------------------------------------------------------- Decor presets */

export interface DecorPreset {
  id: string;
  name: string;
  description: string;
  prompt: string;
  image: string;
  tier: StyleTier;
}

export type StyleTier = "simple" | "elegant" | "classic" | "royal";

export const STYLE_TIERS: { id: StyleTier; name: string; note: string }[] = [
  { id: "simple", name: "Simple & airy", note: "Light frames, soft fabric, a few flowers" },
  { id: "elegant", name: "Elegant", note: "Refined shapes, considered florals" },
  { id: "classic", name: "Classic & vibrant", note: "Traditional pillars, garlands, color" },
  { id: "royal", name: "Royal", note: "Carved, layered, abundant" },
];

/** Decor styles, ordered from simple to grand. Old ids are kept so saved drafts still resolve. */
export const DECOR_PRESETS: DecorPreset[] = [
  {
    id: "garden_minimal",
    tier: "simple",
    name: "Garden minimal",
    description: "Four wooden posts, sheer ivory drapes, white roses.",
    prompt: "a minimal open-frame mandap of four slim natural-wood posts, loosely draped sheer ivory fabric and small clusters of white flowers, lots of negative space",
    image: "/samples/style-garden-minimal.jpg",
  },
  {
    id: "jasmine_brass",
    tier: "simple",
    name: "Jasmine & brass",
    description: "Slim brass pillars with hanging jasmine strands.",
    prompt: "an understated mandap of four slender brushed-brass pillars and a thin canopy frame hung with long strands of jasmine and small orchids",
    image: "/samples/style-jasmine-brass.jpg",
  },
  {
    id: "ocean_bluff",
    tier: "simple",
    name: "Flowing fabric",
    description: "White pillars, long drapes moving in the breeze.",
    prompt: "an airy mandap of four white pillars with long flowing fabric, roses and greenery at the base and lanterns along the aisle",
    image: "/samples/style-ocean-bluff.jpg",
  },
  {
    id: "garden_boho",
    tier: "elegant",
    name: "Boho pampas",
    description: "Round hoop, pampas grass, cushions and lanterns.",
    prompt: "a boho circular hoop mandap with pampas grass, garden roses, eucalyptus, floor cushions, rugs and brass lanterns",
    image: "/samples/style-boho-pampas.jpg",
  },
  {
    id: "minimal_modern",
    tier: "elegant",
    name: "Modern geometric",
    description: "Gold hexagon frame, cascading orchids, mirror floor.",
    prompt: "a modern geometric mandap with a polished gold hexagonal frame, cascading white orchids and hydrangeas and a mirrored platform",
    image: "/samples/style-modern-hexagon.jpg",
  },
  {
    id: "bengali_shola",
    tier: "elegant",
    name: "Shola & banana leaf",
    description: "Banana-plant pillars, white shola, red and white garlands.",
    prompt: "a Bengali-style mandap with banana-plant pillars, intricate white shola-pith decorations, red and white garlands and an alpana floor pattern",
    image: "/samples/style-bengali-shola.jpg",
  },
  {
    id: "temple_south",
    tier: "classic",
    name: "Temple mandapam",
    description: "Carved teak pillars, marigold, banana leaves, oil lamps.",
    prompt: "a South Indian temple-style mandapam with carved wooden pillars, marigold and jasmine garlands, banana plants, a mango-leaf toran and brass lamps",
    image: "/samples/style-temple-south.jpg",
  },
  {
    id: "floral_classic",
    tier: "classic",
    name: "Rose dome",
    description: "Domed canopy covered in roses, a curtain of flowers.",
    prompt: "a round domed mandap canopy covered in roses, hydrangeas and peonies, with strands of flowers hanging like a curtain and a chandelier in the center",
    image: "/samples/style-rose-dome.jpg",
  },
  {
    id: "gujarati_mirror",
    tier: "classic",
    name: "Mirror-work & marigold",
    description: "Bandhani canopy, painted pillars, toran, brass pots.",
    prompt: "a vibrant mandap with a mirror-work and bandhani fabric canopy, painted carved pillars, marigold garlands, a mirrored toran and stacked brass pots",
    image: "/samples/style-gujarati-mirror.jpg",
  },
  {
    id: "royal_palace",
    tier: "royal",
    name: "Mughal arches",
    description: "Gold filigree arches, velvet drapes, hundreds of candles.",
    prompt: "a grand stage of tall scalloped Mughal arches in gold filigree jaali, velvet drapes, orchids and roses in tall stands and hundreds of candles",
    image: "/samples/style-mughal-emerald.jpg",
  },
  {
    id: "rajasthani_royal",
    tier: "royal",
    name: "Rajasthani palace",
    description: "Carved jharokha pillars, velvet and zari, chandeliers.",
    prompt: "an opulent Rajasthani palace mandap with carved jharokha-style pillars, velvet and zari drapes, cascades of roses and marigolds, brass bells and chandeliers",
    image: "/samples/style-rajasthani-royal.jpg",
  },
  {
    id: "floral_ceiling",
    tier: "royal",
    name: "Floral ceiling",
    description: "Thousands of hanging flowers over a mirrored stage.",
    prompt: "an extravagant mandap beneath a full suspended floral ceiling of thousands of hanging roses and orchids, gilded flower-wrapped pillars and a mirrored stage",
    image: "/samples/style-floral-ceiling.jpg",
  },
];

/** Presets retired from the picker but still valid for saved albums. */
const LEGACY_PRESETS: DecorPreset[] = [
  {
    id: "marigold_rustic",
    tier: "classic",
    name: "Marigold & brass",
    description: "Marigold strings, brass urlis, warm and earthy.",
    prompt: "an earthy setting of dense marigold strings, brass urlis, hand-block printed fabrics and terracotta pots",
    image: "/samples/haldi.jpg",
  },
];

export function getPreset(id: string | undefined): DecorPreset {
  return DECOR_PRESETS.find((p) => p.id === id) ?? LEGACY_PRESETS.find((p) => p.id === id) ?? DECOR_PRESETS[7];
}

/* ---------------------------------------------------------------- Shot categories */

export const CATEGORIES: { id: ShotCategory; name: string; hint: string; needsPeople: boolean }[] = [
  { id: "decor", name: "Decor, wide", hint: "The full stage or mandap, no people", needsPeople: false },
  { id: "decor_detail", name: "Decor details", hint: "Close-ups of florals, fabrics and lighting", needsPeople: false },
  { id: "bride", name: "Bride", hint: "Bridal look for each event", needsPeople: true },
  { id: "groom", name: "Groom", hint: "Groom's look for each event", needsPeople: true },
  { id: "couple", name: "Couple", hint: "Bride and groom together", needsPeople: true },
  { id: "couple_stage", name: "Couple at the stage", hint: "Together at the mandap or stage", needsPeople: true },
  { id: "family", name: "Family colors", hint: "Bridal party in coordinated outfits", needsPeople: true },
];

const MIX_WEIGHTS: ShotMix = {
  decor: 0.3,
  decor_detail: 0.1,
  bride: 0.15,
  groom: 0.1,
  couple: 0.15,
  couple_stage: 0.12,
  family: 0.08,
};

/** Splits a pack size across categories using sensible weights; always sums to `total`. */
export function defaultMix(total: number): ShotMix {
  const cats = Object.keys(MIX_WEIGHTS) as ShotCategory[];
  const raw = cats.map((c) => ({ c, v: MIX_WEIGHTS[c] * total }));
  const mix = Object.fromEntries(raw.map(({ c, v }) => [c, Math.floor(v)])) as ShotMix;
  let left = total - cats.reduce((s, c) => s + mix[c], 0);
  raw
    .sort((a, b) => (b.v % 1) - (a.v % 1))
    .forEach(({ c }) => {
      if (left > 0) {
        mix[c] += 1;
        left -= 1;
      }
    });
  return mix;
}

export function mixTotal(mix: ShotMix): number {
  return (Object.values(mix) as number[]).reduce((s, n) => s + (Number.isFinite(n) ? n : 0), 0);
}

/** Gallery samples shown on the marketing site. */
export const SAMPLES = [
  { src: "/samples/hero-after.jpg", event: "Pheras", tradition: "North Indian", palette: "Blush & ivory" },
  { src: "/samples/haldi.jpg", event: "Haldi", tradition: "All traditions", palette: "Marigold & haldi" },
  { src: "/samples/mehndi.jpg", event: "Mehndi", tradition: "All traditions", palette: "Jewel tones" },
  { src: "/samples/sangeet.jpg", event: "Sangeet", tradition: "All traditions", palette: "Wine & champagne" },
  { src: "/samples/south-indian.jpg", event: "Muhurtham", tradition: "South Indian", palette: "Sindoor red & gold" },
  { src: "/samples/sikh.jpg", event: "Anand Karaj", tradition: "Sikh", palette: "Blush & ivory" },
  { src: "/samples/nikah.jpg", event: "Nikah", tradition: "Muslim", palette: "Ivory & antique gold" },
  { src: "/samples/reception.jpg", event: "Reception", tradition: "All traditions", palette: "Blush & ivory" },
  { src: "/samples/couple.jpg", event: "Couple at the mandap", tradition: "North Indian", palette: "Blush & ivory" },
  { src: "/samples/bride.jpg", event: "Bride, Sangeet look", tradition: "All traditions", palette: "Emerald & antique gold" },
  { src: "/samples/groom.jpg", event: "Groom, ceremony look", tradition: "All traditions", palette: "Ivory & gold" },
  { src: "/samples/family.jpg", event: "Family colors, Haldi", tradition: "All traditions", palette: "Marigold & haldi" },
] as const;
