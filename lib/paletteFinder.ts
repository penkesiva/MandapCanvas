/**
 * Wedding color palette finder: ranks our palettes for an event, a season, the time of day and
 * (optionally) the bride's outfit color. Uses the same palettes as the album builder, so every
 * result can be opened straight into a free preview.
 */
import { PALETTES, getPalette, type Palette } from "./catalog";
import { OUTFIT_COLORS } from "./outfitColors";

export type FinderEvent = "haldi" | "mehndi" | "sangeet" | "ceremony" | "reception";
export type Season = "spring" | "summer" | "fall" | "winter";
export type TimeOfDay = "day" | "evening";

export const FINDER_EVENTS: { id: FinderEvent; name: string }[] = [
  { id: "haldi", name: "Haldi" },
  { id: "mehndi", name: "Mehndi" },
  { id: "sangeet", name: "Sangeet / Garba" },
  { id: "ceremony", name: "Wedding ceremony" },
  { id: "reception", name: "Reception" },
];

export const SEASONS: { id: Season; name: string; months: string }[] = [
  { id: "spring", name: "Spring", months: "Mar–May" },
  { id: "summer", name: "Summer", months: "Jun–Aug" },
  { id: "fall", name: "Fall", months: "Sep–Nov" },
  { id: "winter", name: "Winter", months: "Dec–Feb" },
];

/** Flowers that are usually at their best (and best priced) in the U.S. in each season. */
export const SEASON_FLOWERS: Record<Season, string> = {
  spring: "peonies, ranunculus, sweet peas, tulips, garden roses",
  summer: "garden roses, dahlias, hydrangea, marigolds, lisianthus",
  fall: "dahlias, chrysanthemums, amaranthus, marigolds, roses",
  winter: "amaryllis, orchids, anemones, ranunculus, roses",
};

/** How well each palette suits each event and season, 0–3. Pastels and warm tones lean day; jewel tones lean evening. */
const FIT: Record<string, { events: Record<FinderEvent, number>; seasons: Record<Season, number>; mood: TimeOfDay }> = {
  red_gold: { events: { haldi: 0, mehndi: 1, sangeet: 2, ceremony: 3, reception: 2 }, seasons: { spring: 1, summer: 1, fall: 3, winter: 3 }, mood: "evening" },
  blush_ivory: { events: { haldi: 0, mehndi: 2, sangeet: 1, ceremony: 3, reception: 3 }, seasons: { spring: 3, summer: 2, fall: 1, winter: 2 }, mood: "day" },
  emerald_gold: { events: { haldi: 0, mehndi: 1, sangeet: 3, ceremony: 2, reception: 3 }, seasons: { spring: 1, summer: 1, fall: 3, winter: 3 }, mood: "evening" },
  marigold_haldi: { events: { haldi: 3, mehndi: 3, sangeet: 1, ceremony: 1, reception: 0 }, seasons: { spring: 2, summer: 3, fall: 2, winter: 0 }, mood: "day" },
  mint_pastel: { events: { haldi: 1, mehndi: 3, sangeet: 0, ceremony: 1, reception: 1 }, seasons: { spring: 3, summer: 3, fall: 0, winter: 0 }, mood: "day" },
  royal_blue_silver: { events: { haldi: 0, mehndi: 0, sangeet: 2, ceremony: 1, reception: 3 }, seasons: { spring: 1, summer: 1, fall: 1, winter: 3 }, mood: "evening" },
  wine_champagne: { events: { haldi: 0, mehndi: 0, sangeet: 3, ceremony: 2, reception: 3 }, seasons: { spring: 0, summer: 0, fall: 3, winter: 3 }, mood: "evening" },
  peach_sage: { events: { haldi: 1, mehndi: 2, sangeet: 1, ceremony: 2, reception: 2 }, seasons: { spring: 3, summer: 3, fall: 2, winter: 0 }, mood: "day" },
};

/** Palettes that fight a given outfit color (the outfit disappears into it, or the two compete). */
const CLASH: Record<string, string[]> = {
  red: ["marigold_haldi"],
  maroon: ["red_gold"],
  pink: ["red_gold"],
  blush: ["red_gold", "wine_champagne"],
  peach: ["marigold_haldi"],
  orange: ["red_gold"],
  yellow: ["mint_pastel"],
  emerald: ["peach_sage"],
  mint: ["wine_champagne", "emerald_gold"],
  teal: ["mint_pastel"],
  royal_blue: ["red_gold", "marigold_haldi"],
  lavender: ["marigold_haldi", "red_gold"],
  ivory: [],
  gold: ["marigold_haldi"],
};

export interface FinderInput {
  event: FinderEvent;
  season: Season;
  time: TimeOfDay;
  /** OUTFIT_COLORS id, or empty if not decided. */
  outfit?: string;
}

export interface FinderResult {
  palette: Palette;
  score: number;
  /** 0–100, for a simple match meter. */
  match: number;
  reasons: string[];
}

export function findPalettes(input: FinderInput, count = 3): FinderResult[] {
  const outfit = OUTFIT_COLORS.find((o) => o.id === input.outfit);
  const ev = FINDER_EVENTS.find((e) => e.id === input.event)!.name;
  const season = SEASONS.find((s) => s.id === input.season)!.name.toLowerCase();
  const results = PALETTES.map((p) => {
    const f = FIT[p.id];
    const reasons: string[] = [];
    let score = f.events[input.event] * 2 + f.seasons[input.season] * 1.5;
    if (f.events[input.event] >= 3) reasons.push(`A favorite for ${ev}`);
    else if (f.events[input.event] === 2) reasons.push(`Works well for ${ev}`);
    if (f.seasons[input.season] >= 3) reasons.push(`Right at home in ${season}`);
    if (f.mood === input.time) {
      score += 1.5;
      reasons.push(input.time === "day" ? "Glows in daylight" : "Rich under evening light");
    }
    if (outfit) {
      if (outfit.decorPalette === p.id) {
        score += 3;
        reasons.push(`Made for a ${outfit.name.toLowerCase()} outfit`);
      }
      if (CLASH[outfit.id]?.includes(p.id)) {
        score -= 4;
        reasons.push(`Can clash with a ${outfit.name.toLowerCase()} outfit`);
      }
    }
    return { palette: p, score, reasons };
  });
  const max = 2 * 3 + 1.5 * 3 + 1.5 + (outfit ? 3 : 0);
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map((r) => ({ ...r, match: Math.max(5, Math.min(100, Math.round((r.score / max) * 100))) }));
}

/** Best palette per event and season (daytime events by day, evening events by night): for the SEO table. */
export function bestByEventAndSeason(): { event: FinderEvent; bySeason: Record<Season, string> }[] {
  const timeFor: Record<FinderEvent, TimeOfDay> = { haldi: "day", mehndi: "day", sangeet: "evening", ceremony: "day", reception: "evening" };
  return FINDER_EVENTS.map((e) => ({
    event: e.id,
    bySeason: Object.fromEntries(
      SEASONS.map((s) => [s.id, getPalette(findPalettes({ event: e.id, season: s.id, time: timeFor[e.id] }, 1)[0].palette.id).name]),
    ) as Record<Season, string>,
  }));
}
