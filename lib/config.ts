/**
 * Central product + pricing config. Prices are in US cents.
 * Change numbers here; the site, checkout, and webhooks all read from this file.
 */

export const SITE = {
  name: "MandapCanvas",
  tagline: "See your Desi wedding before the first flower is ordered.",
  url: process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://localhost:3000",
  supportEmail: process.env.SUPPORT_EMAIL || "hello@mandapcanvas.com",
} as const;

export type PackId = "starter" | "signature" | "grand" | "topup" | "look12" | "look30";

export interface Pack {
  id: PackId;
  name: string;
  images: number;
  priceCents: number;
  /** Free regenerations included, on top of `images`. */
  freeRegens: number;
  blurb: string;
  includes: string[];
  maxEvents: number;
  maxPalettes: number;
  hd: boolean;
  highlight?: boolean;
  /** Regular price, shown struck through while a launch price is on. */
  listCents?: number;
}

export const PACKS: Record<PackId, Pack> = {
  starter: {
    id: "starter",
    name: "Starter",
    images: 20,
    priceCents: 999,
    freeRegens: 2,
    blurb: "One or two events, done beautifully.",
    includes: ["20 images", "Up to 2 events", "2 color palettes", "Decor, plus the two of you in it", "Private album + family share link"],
    maxEvents: 2,
    maxPalettes: 2,
    hd: false,
  },
  signature: {
    id: "signature",
    name: "Signature",
    images: 40,
    priceCents: 1999,
    freeRegens: 4,
    blurb: "Every event, every look, side by side.",
    includes: ["40 images", "All events", "4 color palettes", "Outfit coordination per event", "PDF lookbook", "Family voting on favorites"],
    maxEvents: 6,
    maxPalettes: 4,
    hd: false,
    highlight: true,
  },
  grand: {
    id: "grand",
    name: "Grand",
    images: 80,
    priceCents: 2999,
    freeRegens: 8,
    blurb: "The whole celebration, including family.",
    includes: ["80 images", "All events", "6 color palettes", "Family color coordination", "HD downloads", "PDF lookbook", "Priority generation"],
    maxEvents: 6,
    maxPalettes: 6,
    hd: true,
  },
  look12: {
    id: "look12",
    name: "Look Pack 12",
    images: 12,
    priceCents: 499,
    freeRegens: 2,
    blurb: "Two or three portraits for each event.",
    includes: ["12 portraits", "Every event you choose", "No watermark, private album"],
    maxEvents: 6,
    maxPalettes: 6,
    hd: false,
  },
  look30: {
    id: "look30",
    name: "Look Pack 30",
    images: 30,
    priceCents: 999,
    freeRegens: 5,
    blurb: "Five or more portraits for every event, in different poses.",
    includes: ["30 portraits", "Every event you choose", "Close-ups, full looks and candids", "No watermark, private album"],
    maxEvents: 6,
    maxPalettes: 6,
    hd: false,
    highlight: true,
  },
  topup: {
    id: "topup",
    name: "Add 10 images",
    images: 10,
    priceCents: 299,
    freeRegens: 1,
    blurb: "Add more images to an existing album.",
    includes: ["10 more images"],
    maxEvents: 6,
    maxPalettes: 6,
    hd: false,
  },
};

export const ALBUM_PACKS: PackId[] = ["starter", "signature", "grand"];

/** Wedding Look Packs: portraits of the bride, the groom or the couple at every event, from their own photos. */
export const LOOK_PACKS: PackId[] = ["look12", "look30"];

export type PlanId = "pro" | "studio";

export interface Plan {
  id: PlanId;
  name: string;
  monthlyCents: number;
  /** Annual price = 10 months. */
  yearlyCents: number;
  monthlyImages: number;
  seats: number;
  blurb: string;
  includes: string[];
}

export const PLANS: Record<PlanId, Plan> = {
  pro: {
    id: "pro",
    name: "Pro",
    monthlyCents: 2900,
    yearlyCents: 29000,
    monthlyImages: 150,
    seats: 1,
    blurb: "For decorators and planners booking 2–6 weddings a month.",
    includes: [
      "150 images a month",
      "Your logo and colors on every proposal",
      "Client share links with favorites",
      "Sketch, photo or preset input",
      "PDF proposals",
    ],
  },
  studio: {
    id: "studio",
    name: "Studio",
    monthlyCents: 7900,
    yearlyCents: 79000,
    monthlyImages: 500,
    seats: 3,
    blurb: "For decor houses running several consults a week.",
    includes: [
      "500 images a month",
      "Everything in Pro",
      "Upload your own mandaps, florals and fabrics as style references",
      "Priority generation",
    ],
  },
};

/** Offer shown to people who sign up from the site (a Stripe promotion code you create in the dashboard). */
export const FOUNDING_OFFER = {
  code: process.env.NEXT_PUBLIC_FOUNDING_CODE || "FOUNDING",
  text: "25% off your first album",
};

/** Free preview limits (no account needed). */
export const FREE_PREVIEW = {
  imagesPerAlbum: 2,
  perIpPerDay: 6,
};

/** Delete uploaded face photos after this many days. */
export const FACE_RETENTION_DAYS = 7;

/** Images generated per call to /advance. Keep low enough to fit in one serverless invocation. */
export const ADVANCE_BATCH = 3;

export const AI_LABEL = "AI concept preview — final decor and outfits may vary.";

export function formatUSD(cents: number): string {
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

export const flags = {
  /** True when generation should return mock images (no Gemini key, or forced). */
  mockGeneration(): boolean {
    if (process.env.MOCK_GENERATION === "1") return true;
    // Never fall back to mock images in production: a paying customer must get real images or an error.
    const configured = !!process.env.GEMINI_API_KEY || (!!process.env.GOOGLE_CLOUD_PROJECT && !!process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
    return !configured && process.env.NODE_ENV !== "production";
  },
  /** Allow the fake checkout when Stripe is not configured (never in production unless forced). */
  devCheckout(): boolean {
    if (process.env.STRIPE_SECRET_KEY) return false;
    if (process.env.ALLOW_DEV_CHECKOUT === "1") return true;
    return process.env.NODE_ENV !== "production";
  },
  stripeEnabled(): boolean {
    return !!process.env.STRIPE_SECRET_KEY;
  },
};
