/**
 * AI venue decor visualizer: decorate a photo of the couple's own venue.
 * The prompt is an EDIT of their photo: the room stays the same, only decor is added.
 * Safe to import on the client.
 */

import { PALETTES } from "./catalog";
import type { EventId } from "./types";

export const VENUE_EVENTS: { id: EventId; name: string; art: string }[] = [
  { id: "ceremony", name: "Wedding mandap", art: "the wedding ceremony: a mandap as the focal point, with seating for guests facing it" },
  { id: "reception", name: "Reception", art: "the reception: a stage with a couple's sofa and a floral backdrop, round guest tables, a dance floor area" },
  { id: "sangeet", name: "Sangeet", art: "a Sangeet night: a stage for performances, a dance floor, lounge seating and festive lighting" },
  { id: "mehndi", name: "Mehndi", art: "a Mehndi: low floor seating with cushions and bolsters, colorful umbrellas or canopies, swings, floral strings" },
  { id: "haldi", name: "Haldi", art: "a daytime Haldi: a small decorated seat for the couple, marigold strings, brass urlis and yellow fabric" },
];

export interface VenueStyle {
  id: string;
  name: string;
  hint: string;
  art: string;
  /** A sample photo for the style card. */
  image: string;
  /** Simple setups cost less but still look full; grand ones go all out. */
  scale: "simple" | "grand";
}

export const VENUE_STYLES: VenueStyle[] = [
  {
    id: "classic",
    name: "Classic white",
    hint: "White drapes, roses, candles",
    art: "simple but elegant: a clean four-pillar structure with flowing white drapes, white and blush roses at the corners, rows of candles and a petal aisle; uncluttered, so the room still breathes, yet it looks expensive",
    image: "/samples/mandap-classic.jpg",
    scale: "simple",
  },
  {
    id: "jasmine",
    name: "Jasmine & brass",
    hint: "Flower strings, brass lamps",
    art: "simple traditional: strings of jasmine and marigold hung in rows, brass lamps and urlis with floating flowers, banana leaves at the entrance; a few strong pieces done beautifully rather than lots of decor",
    image: "/samples/style-jasmine-brass.jpg",
    scale: "simple",
  },
  {
    id: "garden",
    name: "Garden fresh",
    hint: "Greenery, white flowers, light",
    art: "simple and fresh: a frame wrapped in greenery and white flowers, potted plants and lanterns along the sides, soft fairy lights; natural and airy",
    image: "/samples/style-garden-minimal.jpg",
    scale: "simple",
  },
  {
    id: "rosedome",
    name: "Rose dome",
    hint: "Domed canopy, rose walls",
    art: "grand and romantic: a domed canopy covered in roses, walls of roses behind the stage, crystal chandeliers and a long petal aisle",
    image: "/samples/style-rose-dome.jpg",
    scale: "grand",
  },
  {
    id: "royal",
    name: "Royal",
    hint: "Carved arches, gold, chandeliers",
    art: "royal and grand: carved gold and ivory structures, jharokha-style arches, rich drapes, crystal chandeliers and abundant roses",
    image: "/samples/style-rajasthani-royal.jpg",
    scale: "grand",
  },
  {
    id: "south",
    name: "South Indian",
    hint: "Temple pillars, jasmine, banana leaves",
    art: "South Indian temple style: carved brass or wooden pillars, jasmine and marigold strings, banana leaves, mango-leaf torans and brass lamps",
    image: "/samples/style-temple-south.jpg",
    scale: "grand",
  },
  {
    id: "floral",
    name: "Floral",
    hint: "Roses, hanging flowers, soft drapes",
    art: "lush floral romance: a ceiling of hanging flowers, roses and hydrangeas, soft sheer drapes and candles",
    image: "/samples/style-floral-ceiling.jpg",
    scale: "grand",
  },
  {
    id: "modern",
    name: "Modern",
    hint: "Clean shapes, minimal, elegant",
    art: "modern minimal: clean geometric frames, a restrained palette, sculptural florals, lots of breathing room",
    image: "/samples/style-modern-hexagon.jpg",
    scale: "simple",
  },
  {
    id: "mughal",
    name: "Mughal",
    hint: "Jaali arches, emerald and gold",
    art: "Mughal elegance: white jaali screens and arches, emerald and gold accents, lanterns and climbing roses; suits a Nikah",
    image: "/samples/style-mughal-emerald.jpg",
    scale: "grand",
  },
  {
    id: "boho",
    name: "Boho garden",
    hint: "Pampas, greenery, warm light",
    art: "boho garden: pampas grass, greenery, rattan and macramé, warm string lights and earthy tones",
    image: "/samples/style-boho-pampas.jpg",
    scale: "simple",
  },
];

export const VENUE_PALETTES = ["red_gold", "blush_ivory", "emerald_gold", "marigold_haldi", "mint_pastel", "royal_blue_silver", "wine_champagne", "peach_sage"]
  .map((id) => PALETTES.find((p) => p.id === id))
  .filter((p): p is (typeof PALETTES)[number] => !!p);

export interface VenueRequest {
  event: EventId;
  style: string;
  /** A PALETTES id, or "" for the style's own colors. */
  palette: string;
}

export function parseVenueRequest(raw: unknown): VenueRequest | null {
  const r = (raw ?? {}) as Record<string, unknown>;
  const event = VENUE_EVENTS.find((e) => e.id === r.event)?.id ?? null;
  const style = VENUE_STYLES.find((s) => s.id === r.style)?.id ?? null;
  const palette = typeof r.palette === "string" && (r.palette === "" || PALETTES.some((p) => p.id === r.palette)) ? r.palette : null;
  if (!event || !style || palette === null) return null;
  return { event, style, palette };
}

export function buildVenuePrompt(req: VenueRequest): string {
  const ev = VENUE_EVENTS.find((e) => e.id === req.event)!;
  const st = VENUE_STYLES.find((s) => s.id === req.style)!;
  const pal = PALETTES.find((p) => p.id === req.palette);
  return [
    "EDIT the attached VENUE photo: decorate this exact space for a South Asian (Desi) wedding.",
    "KEEP THE VENUE (MUST FOLLOW): the same room or outdoor space, from the same camera position, angle and lens. Keep the walls, windows, doors, ceiling, floor, columns, built-in features, landscaping and the light coming from the windows exactly where they are. Do not move, remove or redesign the architecture. Decor goes on top of what is there.",
    `EVENT: ${ev.art}.`,
    `STYLE: ${st.art}.`,
    pal ? `COLORS: ${pal.name}: ${pal.colors}. Use these colors for flowers, fabrics and accents.` : "COLORS: the colors that suit this style.",
    "Scale everything correctly for the space: decor sits on the floor, hangs from the ceiling or frames the walls realistically. No guests or people.",
    "Photo-real, professional event photography, natural light consistent with the original photo. No text, logos or watermarks.",
  ].join("\n\n");
}
