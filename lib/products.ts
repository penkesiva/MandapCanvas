/**
 * The six things customers can make, in one place: the /new chooser and the product switcher on every product
 * page read from here so names, pictures and prices never drift apart. Safe to import on the client.
 */

import { PACKS, formatUSD, type PackId } from "./config";

export type ProductPath =
  | "/looks"
  | "/looks/maharani"
  | "/looks/navratri"
  | "/tools/wedding-art-portrait"
  | "/mandap"
  | "/tools/ai-venue-decor-visualizer";

export interface Product {
  /** The product's landing page. */
  href: ProductPath;
  /** Where "start" goes, when that isn't the landing page. */
  start?: string;
  name: string;
  /** Short name for the compact switcher. */
  short: string;
  line: string;
  img: string;
  pack: PackId;
  group: "you" | "decor";
  /** Albums come with the Reel Maker. */
  reel?: boolean;
}

export const PRODUCTS: Product[] = [
  { href: "/looks", name: "Wedding looks", short: "Wedding", line: "Bride, groom or couple at every event.", img: "/samples/look-after.jpg", pack: "look12", group: "you", reel: true },
  { href: "/looks/maharani", name: "Maharani portraits", short: "Maharani", line: "Heritage sarees at palaces and temples.", img: "/samples/maharani/scene-1.jpg", pack: "maharani12", group: "you", reel: true },
  { href: "/looks/navratri", name: "Navratri portraits", short: "Navratri", line: "Nine days, nine saree colors.", img: "/samples/navratri/day-1.jpg", pack: "navratri9", group: "you", reel: true },
  { href: "/tools/wedding-art-portrait", name: "Art portraits", short: "Art portraits", line: "Anime, 80s, Tanjore and more.", img: "/samples/art/anime.jpg", pack: "art10", group: "you", reel: true },
  { href: "/mandap", start: "/create", name: "Mandap and decor album", short: "Mandap designs", line: "Your mandap, photo-real, every event.", img: "/samples/hero-after.jpg", pack: "starter", group: "decor" },
  { href: "/tools/ai-venue-decor-visualizer", name: "Your venue, decorated", short: "Venue decor", line: "Your hall or backyard, dressed up.", img: "/samples/venue-after.jpg", pack: "venue9", group: "decor" },
];

export const fromPrice = (p: Product) => formatUSD(PACKS[p.pack].priceCents);
