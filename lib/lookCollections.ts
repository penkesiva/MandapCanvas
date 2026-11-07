/**
 * Look collections beyond the wedding: Maharani (grand heritage sarees at palaces and temples)
 * and Navratri (nine days, nine colors, US backdrops). One woman, from her own photos.
 * Safe to import on the client.
 */

import type { PackId } from "./config";

export type CollectionId = "maharani" | "navratri";

export interface CollectionScene {
  /** Short label for the album and the page. */
  name: string;
  saree: string;
  setting: string;
  /** Swatch for the scene card and the mock image. */
  hex: string;
}

export interface LookCollection {
  id: CollectionId;
  name: string;
  path: string;
  packs: PackId[];
  albumTitle: string;
  scenes: CollectionScene[];
  /** Poses to rotate through; a scene's second portrait uses the next pose. */
  poses: string[];
  jewelry: string;
  photography: string;
}

const MAHARANI: LookCollection = {
  id: "maharani",
  name: "Maharani",
  path: "/looks/maharani",
  packs: ["maharani12"],
  albumTitle: "My Maharani portraits",
  jewelry:
    "heirloom-grand: a layered temple or kundan necklace set, a choker, statement jhumkas, a maang tikka or matha patti, a nath nose ring, stacked bangles and a waist belt where the saree suits it",
  photography:
    "a top Indian fashion and heritage photographer, magazine-cover grandeur, 85mm lens, rich warm light, deep fabric texture and zari sparkle, face in sharp focus, regal and dignified, vertical 3:4 framing",
  poses: [
    "standing tall like a queen, three-quarter view, one hand resting on the pallu, gaze into the camera",
    "seated gracefully, the pallu draped over one arm, a soft confident smile",
    "walking slowly toward the camera, the pallu flowing behind her",
    "looking over her shoulder, showing the saree's border and her jewelry",
  ],
  scenes: [
    { name: "Durbar hall", hex: "#8E1B2B", saree: "a deep red Banarasi silk saree with heavy gold zari brocade", setting: "a grand palace durbar hall with carved arches, gilded pillars and crystal chandeliers" },
    { name: "Temple courtyard at dawn", hex: "#C2185B", saree: "a rani-pink Kanjeevaram silk saree with a wide temple-gold border", setting: "a stone South Indian temple courtyard at sunrise, a towering carved gopuram behind her, brass lamps lit" },
    { name: "Palace window", hex: "#0F4D36", saree: "an emerald Paithani silk saree with a peacock-motif pallu", setting: "a carved sandstone jharokha window of a Rajasthani palace, soft desert light streaming in" },
    { name: "Mirror hall", hex: "#5B2A86", saree: "a royal purple silk saree with gold zardozi work", setting: "a palace hall of mirror mosaic walls glittering with candlelight" },
    { name: "Temple steps", hex: "#E2A72E", saree: "a mustard-gold Kanjeevaram silk saree with a contrast maroon border", setting: "ancient carved temple steps lined with oil lamps at dusk" },
    { name: "Palace gardens", hex: "#2E6BA8", saree: "a royal blue Banarasi silk saree with silver zari", setting: "Mughal-style palace gardens with fountains, marble walkways and symmetrical cypress trees" },
    { name: "Grand staircase", hex: "#6D1A36", saree: "a wine-red velvet-bordered silk saree with gold embroidery", setting: "a sweeping marble staircase in a heritage palace hotel, a long red carpet" },
    { name: "Pillared corridor", hex: "#B3131B", saree: "a crimson and gold Patola-inspired silk saree", setting: "a long temple corridor of intricately carved stone pillars, light falling in shafts" },
    { name: "Lotus pond", hex: "#F4B6C2", saree: "a blush-pink organza silk saree with delicate gold work", setting: "a palace lotus pond with a white marble pavilion, morning mist" },
    { name: "Palace terrace", hex: "#E8892B", saree: "a saffron Bandhani silk saree with a gold-tissue pallu", setting: "a palace rooftop terrace at golden hour, domes and a fort skyline behind" },
    { name: "Throne room", hex: "#1F3A6B", saree: "a midnight-blue silk saree with antique gold brocade", setting: "a regal throne room with a carved silver throne, velvet drapes and gold leaf ceilings; she stands beside the throne" },
    { name: "Temple gopuram", hex: "#7A1F3D", saree: "a maroon Kanjeevaram silk saree with a mango-motif zari border", setting: "in front of a richly sculpted temple gopuram at golden hour, jasmine strings in her hair" },
  ],
};

/** Nine days, nine colors. A popular color order; families follow different calendars, so we don't claim an official list. */
const NAVRATRI: LookCollection = {
  id: "navratri",
  name: "Navratri",
  path: "/looks/navratri",
  packs: ["navratri9", "navratri18"],
  albumTitle: "My Navratri, nine days",
  jewelry:
    "festive: oxidized silver or gold jhumkas, a statement necklace or choker, bangles, a small bindi; for the garba nights, mirror-work and oxidized silver pieces",
  photography:
    "a top festival portrait photographer, 85mm lens, natural skin texture, flattering light, a softly blurred background, rich saree color and detail, face in sharp focus, joyful and graceful, vertical 3:4 framing",
  poses: [
    "a three-quarter portrait, a warm smile, hands folded or holding the pallu",
    "a full-length candid, mid-twirl or walking, the saree flowing",
  ],
  scenes: [
    { name: "Day 1 · Red", hex: "#B3131B", saree: "a bright red silk saree with a gold border", setting: "the hall of a Hindu temple in the US, the deity's shrine softly blurred behind, marigold garlands and brass lamps" },
    { name: "Day 2 · Royal blue", hex: "#2E4FA8", saree: "a royal blue silk saree with silver zari", setting: "a green suburban American lawn decorated with marigold torans and fairy lights, the house softly blurred" },
    { name: "Day 3 · Yellow", hex: "#F2C14E", saree: "a sunny yellow cotton-silk saree with a pink border", setting: "a sunlit balcony with potted plants, the city or neighborhood softly blurred below" },
    { name: "Day 4 · Green", hex: "#2E7D32", saree: "a parrot-green silk saree with a gold border", setting: "an American park in early fall, trees turning orange and red, softly blurred" },
    { name: "Day 5 · Silver", hex: "#8E949C", saree: "a silver-grey silk saree with shimmering silver zari", setting: "a home living room with a tiered golu or kolu doll display and diyas, softly blurred" },
    { name: "Day 6 · Orange", hex: "#E8892B", saree: "a vibrant orange Bandhani saree with mirror work", setting: "a garba night in a community hall, colorful lights and dancers blurred into bokeh behind her" },
    { name: "Day 7 · White", hex: "#F7F3EA", saree: "an ivory white saree with a red and gold border", setting: "a temple courtyard in the US at dusk, rows of lit diyas, softly blurred" },
    { name: "Day 8 · Pink", hex: "#E26D9C", saree: "a rani-pink silk saree with gold motifs", setting: "a backyard under warm string lights at dusk, rangoli on the patio, softly blurred" },
    { name: "Day 9 · Purple", hex: "#6A2C8F", saree: "a royal purple silk saree with gold zari", setting: "a home puja room with fresh flowers, a brass lamp and the goddess shrine softly blurred behind" },
  ],
};

export const LOOK_COLLECTIONS: Record<CollectionId, LookCollection> = { maharani: MAHARANI, navratri: NAVRATRI };

export function getCollection(id: unknown): LookCollection | null {
  return id === "maharani" || id === "navratri" ? LOOK_COLLECTIONS[id] : null;
}

/** Scene and pose for the n-th portrait: scenes in order, then a new pose on the next pass. */
export function collectionShot(c: LookCollection, n: number): { scene: CollectionScene; pose: string; index: number } {
  const index = n % c.scenes.length;
  const pass = Math.floor(n / c.scenes.length);
  return { scene: c.scenes[index], pose: c.poses[(index + pass) % c.poses.length], index };
}

export function buildCollectionPrompt(opts: {
  collection: LookCollection;
  n: number;
  photoCount: number;
  glassesRule: string;
}): string {
  const { scene, pose } = collectionShot(opts.collection, opts.n);
  const c = opts.collection;
  return [
    `Create a photo-real ${c.name === "Maharani" ? "regal heritage" : "Navratri festival"} portrait of the woman in the photos, alone.`,
    `The ${opts.photoCount} photo${opts.photoCount === 1 ? "" : "s"} labeled BRIDE PHOTO show the real woman. Study every photo to understand her face from different angles.`,
    "IDENTITY (MUST FOLLOW): she must be unmistakably the same real woman, recognizable to her family at a glance. Keep her face exactly: face shape, eyes, eyebrows, nose, lips, jawline, smile, skin tone, age, ethnicity, body type and any moles. Do not slim, lighten, smooth or beautify her, and do not swap her for a model. Restyle only her hair, makeup, saree and jewelry.",
    opts.glassesRule,
    `SAREE: ${scene.saree}, draped beautifully in a traditional style. Matching blouse. Jewelry: ${c.jewelry}. Natural, elegant makeup that suits her own skin tone.`,
    `SETTING: ${scene.setting}.`,
    `POSE: ${pose}.`,
    `Photography: ${c.photography}.`,
    "No text, logos, watermarks or borders. No other people in focus.",
    "FINAL CHECK: her face matches the PHOTOS.",
  ]
    .filter(Boolean)
    .join("\n\n");
}
