/**
 * Reel Maker: templates, transition styles and timing for the vertical (9:16) videos customers export
 * from a finished album for Instagram Reels and YouTube Shorts. Safe to import on the client.
 */

import type { AlbumConfig } from "../types";

export type ReelTemplateId = "navratri" | "maharani" | "lookpack" | "art";
export type ReelStyleId = "colorWipe" | "royalReveal" | "eventCard" | "whipPan";
export type ReelSpeed = "fast" | "normal" | "slow";

export interface ReelStyle {
  id: ReelStyleId;
  name: string;
  hint: string;
}

export const REEL_STYLES: ReelStyle[] = [
  { id: "colorWipe", name: "Color Wipe", hint: "A band of the next color sweeps in" },
  { id: "royalReveal", name: "Royal Reveal", hint: "Slow push-in with a gold light sweep" },
  { id: "eventCard", name: "Event Card", hint: "Title cards with a mandala dip" },
  { id: "whipPan", name: "Whip Pan", hint: "Fast motion-blur slides" },
];

export interface ReelTemplate {
  id: ReelTemplateId;
  name: string;
  defaultStyle: ReelStyleId;
  /** Length in seconds at the Normal speed with the default number of images. */
  defaultSeconds: number;
  /** How many images are picked to start with. */
  defaultCount: number;
  hook: string;
  /** Caption shown under the export, ready to paste into Instagram. */
  caption: string;
}

export const REEL_TEMPLATES: Record<ReelTemplateId, ReelTemplate> = {
  navratri: {
    id: "navratri",
    name: "Navratri",
    defaultStyle: "colorWipe",
    defaultSeconds: 11,
    defaultCount: 9,
    hook: "9 days, 9 colors, 1 selfie",
    caption: "9 days, 9 colors 🪔 Which day is your favorite? Made with mandapcanvas.com #navratri #navratri2026 #navratrilook #saree #garba",
  },
  maharani: {
    id: "maharani",
    name: "Maharani",
    defaultStyle: "royalReveal",
    defaultSeconds: 10,
    defaultCount: 5,
    hook: "POV: you're a Maharani",
    caption: "Palace, temple, throne room 👑 Which one is me? Made with mandapcanvas.com #maharani #saree #kanjeevaram #banarasi #desiaesthetic",
  },
  lookpack: {
    id: "lookpack",
    name: "Wedding Look Pack",
    defaultStyle: "eventCard",
    defaultSeconds: 14,
    defaultCount: 8,
    hook: "My whole wedding, before I book a thing",
    caption: "Haldi to reception, all before the wedding ✨ Made with mandapcanvas.com #desiwedding #indianwedding #bridallook #sangeet #mehndi",
  },
  art: {
    id: "art",
    name: "Art portraits",
    defaultStyle: "whipPan",
    defaultSeconds: 8,
    defaultCount: 6,
    hook: "Which one are you?",
    caption: "One photo, every style 🎨 Which one are you? Made with mandapcanvas.com #aiart #anime #80sretro #bollywood #portrait",
  },
};

/** Which reel template fits an album, or null when there's no reel for it yet. */
export function reelTemplateFor(config: Pick<AlbumConfig, "look" | "artPack">): ReelTemplateId | null {
  if (config.look?.collection === "navratri") return "navratri";
  if (config.look?.collection === "maharani") return "maharani";
  if (config.look) return "lookpack";
  if (config.artPack) return "art";
  return null;
}

/* -------- timing */

export const REEL_FPS = 30;
/** The hook text plays over the opening for this long. */
export const INTRO_SECONDS = 1.2;
/** The end card. */
export const OUTRO_SECONDS = 1.8;
/** Shorter than this and an image reads as a glitch; longer and the reel drags. */
export const MIN_HOLD = 0.35;
export const MAX_HOLD = 2.5;
export const MAX_REEL_IMAGES = 20;
export const MAX_REEL_SECONDS = 60;

const SPEED_FACTOR: Record<ReelSpeed, number> = { fast: 0.6, normal: 1, slow: 1.6 };

const round = (s: number) => Math.round(s * 2) / 2;

/** The shortest and longest reel that keeps every image on screen between MIN_HOLD and MAX_HOLD. */
export function lengthRange(count: number): { min: number; max: number } {
  const n = Math.max(1, count);
  const fixed = INTRO_SECONDS + OUTRO_SECONDS;
  const min = Math.ceil((fixed + n * MIN_HOLD) * 2) / 2;
  const max = Math.max(min, Math.floor(Math.min(MAX_REEL_SECONDS, fixed + n * MAX_HOLD) * 2) / 2);
  return { min, max };
}

export function clampLength(seconds: number, count: number): number {
  const { min, max } = lengthRange(count);
  return Math.min(max, Math.max(min, round(seconds)));
}

/** Reel length for a speed preset: the template's pace per image, times the number of images chosen. */
export function presetSeconds(t: ReelTemplate, count: number, speed: ReelSpeed): number {
  const normalHold = (t.defaultSeconds - INTRO_SECONDS - OUTRO_SECONDS) / t.defaultCount;
  const hold = Math.min(MAX_HOLD, Math.max(MIN_HOLD, normalHold * SPEED_FACTOR[speed]));
  return clampLength(INTRO_SECONDS + OUTRO_SECONDS + count * hold, count);
}

/** Seconds each image stays on screen for a reel of the given length. */
export function holdFor(seconds: number, count: number): number {
  const n = Math.max(1, count);
  return Math.min(MAX_HOLD, Math.max(MIN_HOLD, (seconds - INTRO_SECONDS - OUTRO_SECONDS) / n));
}

/** Seconds a transition takes, given how long each image holds. */
export function transitionFor(style: ReelStyleId, hold: number): number {
  const cap = style === "whipPan" ? 0.32 : style === "royalReveal" ? 0.7 : style === "eventCard" ? 0.6 : 0.5;
  return Math.min(cap, hold * 0.45);
}

/**
 * The images a reel starts with: one of each label first (each Navratri day, each event, each style),
 * then the rest in album order, up to the template's default count. Favorites win when there are enough.
 */
export function defaultSelection<T extends { id: string; label: string; favorite?: boolean }>(items: T[], count: number): string[] {
  const favs = items.filter((i) => i.favorite);
  if (favs.length >= 3) return favs.slice(0, MAX_REEL_IMAGES).map((i) => i.id);
  const picked = new Set<string>();
  const seen = new Set<string>();
  for (const i of items) {
    if (picked.size >= count) break;
    if (seen.has(i.label)) continue;
    seen.add(i.label);
    picked.add(i.id);
  }
  for (const i of items) {
    if (picked.size >= count) break;
    picked.add(i.id);
  }
  return items.filter((i) => picked.has(i.id)).map((i) => i.id);
}
