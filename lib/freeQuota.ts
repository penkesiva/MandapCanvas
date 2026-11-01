import "server-only";
import { anonId, currentUser, isAdmin } from "./auth";
import { kv } from "./kv";

/**
 * Free AI tries for the free tools: one per visitor, and one more once they create a free account.
 * Counted per browser (anonymous cookie) and per account, so signing in on the same browser doesn't reset it.
 */
const FREE_ANON = 1;
const FREE_SIGNED_IN = 2;

async function count(key: string | null): Promise<number> {
  if (!key) return 0;
  return Number((await kv().get(key)) ?? 0);
}

export async function freeQuota(tool: string) {
  const [user, anon] = await Promise.all([currentUser(), anonId(true)]);
  const anonKey = anon ? `${tool}:anon:${anon}` : null;
  const userKey = user ? `${tool}:user:${user.id}` : null;
  const [a, u] = await Promise.all([count(anonKey), count(userKey)]);
  const allowance = user ? FREE_SIGNED_IN : FREE_ANON;
  const used = user ? Math.max(a, u) : a;
  const admin = isAdmin(user);
  return {
    user,
    anon,
    admin,
    allowance,
    remaining: admin ? 99 : Math.max(0, allowance - used),
    /** Call after a successful generation. */
    async spend() {
      await Promise.all([anonKey ? kv().incrby(anonKey, 1) : null, userKey ? kv().incrby(userKey, 1) : null]);
    },
  };
}
