import type { PackId, PlanId } from "./config";

export type TraditionId =
  | "hindu_north"
  | "hindu_south"
  | "gujarati"
  | "bengali"
  | "marathi"
  | "sikh"
  | "muslim"
  | "christian"
  | "fusion";

export type EventId = "haldi" | "mehndi" | "sangeet" | "garba" | "ceremony" | "reception";

export type ShotCategory = "decor" | "decor_detail" | "bride" | "groom" | "couple" | "couple_stage" | "family";

export type VenueMode = "indoor" | "outdoor" | "mixed";
export type LightingMode = "day" | "evening" | "mixed";
export type DecorSource = "sketch" | "upload" | "preset";
export type PeopleMode = "silhouette" | "likeness";

export type ShotMix = Record<ShotCategory, number>;

/** Where one event's decor design comes from. */
export interface EventDesign {
  source: DecorSource;
  /** Sketch or uploaded photo (source "sketch" or "upload"). */
  imageUrl?: string;
  /** Template id (source "preset"). */
  presetId?: string;
}

/** Choices made for one event. */
export interface EventSetting {
  design?: EventDesign;
  palettes: string[];
  venue: "indoor" | "outdoor";
  lighting: "day" | "evening";
}

export interface AlbumConfig {
  tradition: TraditionId;
  events: EventId[];
  palettes: string[];
  venue: VenueMode;
  lighting: LightingMode;
  decor: {
    source: DecorSource;
    imageUrl?: string;
    presetId?: string;
    /** When true, the sketch/photo guides decor for every event, not just the ceremony. */
    applyToAllEvents: boolean;
  };
  people: {
    mode: PeopleMode;
    brideUrl?: string;
    groomUrl?: string;
    /** Look Packs: up to 5 photos per person (or of the two together) so faces stay consistent. */
    brideUrls?: string[];
    groomUrls?: string[];
    coupleUrls?: string[];
    consentAt?: number;
    /** Likeness mode: remove eyeglasses (the default) or keep them. */
    glasses?: "remove" | "keep";
  };
  /** Set for Wedding Look Pack albums: portraits at every event instead of decor. */
  look?: {
    who: "bride" | "groom" | "couple";
    /** A lib/bridalLooks tradition id. */
    tradition: string;
    /** An outfit color id for the main ceremony, or "". */
    color: string;
    jewelry: "delicate" | "classic" | "royal";
    /** Remove eyeglasses in the portraits (the default) or keep them. */
    glasses?: "remove" | "keep";
    /** Set for the Maharani and Navratri collections (lib/lookCollections) instead of wedding events. */
    collection?: "maharani" | "navratri";
  };
  /** Set for Art pack albums: their photo redrawn in one art style per image. */
  artPack?: {
    photoUrl: string;
    outfit: "wedding" | "keep";
    /** "auto" follows each style (off for the traditional ones). */
    glasses: "auto" | "keep" | "remove";
    /** lib/artStyles ids, one per image. */
    styles: string[];
    aspect: "4:3" | "3:4" | "16:9" | "9:16";
  };
  /** Set for Venue pack albums: their own space, decorated in one style per image. */
  venuePack?: {
    photoUrl: string;
    event: EventId;
    /** A PALETTES id, or "" for each style's own colors. */
    palette: string;
    /** lib/venueDecor style ids, one per image. */
    styles: string[];
    aspect: "4:3" | "3:4" | "16:9" | "9:16";
  };
  mix: ShotMix;
  /** Per-event palettes, venue and light. When set for an event, it overrides the album-wide values. */
  eventSettings?: Partial<Record<EventId, EventSetting>>;
  notes: string;
  /** Pro accounts: style reference photos of the vendor's own inventory. */
  inventoryUrls?: string[];
}

export type ShotStatus = "pending" | "running" | "done" | "failed";

export interface Shot {
  id: string;
  event: EventId;
  category: ShotCategory;
  /** Collections: which scene (and, on a second pass, which pose) this portrait is. */
  scene?: number;
  paletteId: string;
  lighting: "day" | "evening";
  venue: "indoor" | "outdoor";
  status: ShotStatus;
  url?: string;
  error?: string;
  favorite?: boolean;
  attempts: number;
  watermarked?: boolean;
  /** How the current image was made, and the change asked for if it was a refinement. */
  made?: "original" | "new" | "refine";
  madeNote?: string;
  /** A requested change ("make the flowers white") waiting to be applied to the current image. */
  edit?: string;
  /** Earlier images of this shot, newest first. */
  versions?: ShotVersion[];
  doneAt?: number;
}

export interface ShotVersion {
  url: string;
  at: number;
  /** How this image was made. */
  kind: "original" | "new" | "refine";
  note?: string;
}

export type AlbumStatus = "draft" | "queued" | "generating" | "complete";

export interface Brand {
  businessName: string;
  logoUrl?: string;
  accent: string;
  website?: string;
  phone?: string;
}

export interface Album {
  id: string;
  kind: "couple" | "proposal";
  createdAt: number;
  updatedAt: number;
  ownerUserId?: string;
  ownerAnonId?: string;
  title: string;
  clientName?: string;
  status: AlbumStatus;
  /** Pack the customer intends to buy (or bought). */
  packId: PackId;
  /** Images paid for and allocated to this album. */
  imageQuota: number;
  regensLeft: number;
  paid: boolean;
  config: AlbumConfig;
  shots: Shot[];
  previews: Shot[];
  shareToken?: string;
  brand?: Brand;
  completedNotifiedAt?: number;
  /** Cost tracking (estimated model spend in cents, x100 for precision). */
  costMilliCents?: number;
}

export interface User {
  id: string;
  email: string;
  createdAt: number;
  plan: PlanId | null;
  planStatus?: "active" | "past_due" | "canceled";
  stripeCustomerId?: string;
  subscriptionId?: string;
  brand?: Brand;
  inventory?: { id: string; url: string; label: string }[];
  /** Profile: what they'd like to be called, and the wedding date (YYYY-MM-DD) for a countdown. */
  name?: string;
  weddingDate?: string;
}

export interface LedgerEntry {
  at: number;
  delta: number;
  reason: "purchase" | "subscription" | "album_allocation" | "refund" | "admin" | "regen";
  ref?: string;
  amountCents?: number;
}

export interface ApiError {
  ok: false;
  error: string;
  code?: string;
}
