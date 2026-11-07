import "server-only";
import { kv } from "./kv";
import { FACE_RETENTION_DAYS } from "./config";

/** What a visitor made in the free tools, shown under "Free creations" for 7 days. */
export type CreationKind = "look" | "venue" | "art" | "card" | "palette";

export interface Creation {
  kind: CreationKind;
  url: string;
  /** e.g. "Dreamy anime" or "Reception, Royal". */
  title: string;
  /** The tool page to make another. */
  href: string;
  at: number;
}

const KEEP = 60;
const key = (owner: { userId?: string | null; anon?: string | null }) =>
  owner.userId ? `creations:user:${owner.userId}` : owner.anon ? `creations:anon:${owner.anon}` : null;

/** Never fails the tool's response: saving the creation is a convenience. */
export async function recordCreation(owner: { userId?: string | null; anon?: string | null }, c: Omit<Creation, "at">): Promise<void> {
  const k = key(owner);
  if (!k) return;
  try {
    // Only the newest KEEP are ever read, so the list doesn't need trimming.
    await kv().lpush(k, JSON.stringify({ ...c, at: Date.now() }));
  } catch (e) {
    console.error("recordCreation failed", e);
  }
}

/** The last 7 days only: pictures with faces are deleted after that. */
export async function listCreations(userId: string): Promise<Creation[]> {
  const rows = await kv().lrange(`creations:user:${userId}`, 0, KEEP - 1);
  const cutoff = Date.now() - FACE_RETENTION_DAYS * 86400000;
  return rows
    .map((r) => {
      try {
        return (typeof r === "string" ? JSON.parse(r) : r) as Creation;
      } catch {
        return null;
      }
    })
    .filter((c): c is Creation => !!c && c.at >= cutoff);
}

/** Moves creations made while signed out to the account, after sign-in on the same browser. */
export async function claimAnonCreations(anon: string | null, userId: string): Promise<void> {
  if (!anon) return;
  const from = `creations:anon:${anon}`;
  const rows = await kv().lrange(from, 0, KEEP - 1);
  if (!rows.length) return;
  const to = `creations:user:${userId}`;
  // Oldest first so the newest stays on top.
  for (const r of [...rows].reverse()) await kv().lpush(to, typeof r === "string" ? r : JSON.stringify(r));
  await kv().del(from);
}
