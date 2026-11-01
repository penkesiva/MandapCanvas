import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** Server-side Supabase client using the service role key (never sent to the browser). */
export function supabaseFromEnv(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  const g = globalThis as unknown as { __sb?: SupabaseClient };
  if (!g.__sb) g.__sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return g.__sb;
}

export function supabaseHost(): string | null {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}

export const MEDIA_BUCKET = "media";
