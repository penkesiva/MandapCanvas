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
    consentAt?: number;
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
