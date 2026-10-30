/* eslint-disable @typescript-eslint/no-explicit-any */
/** Parses an API response safely so server crashes surface as a friendly message, not a JSON error. */
export async function readJson(res: Response): Promise<{ ok?: boolean; error?: string; [k: string]: unknown } & Record<string, any>> {
  try {
    return await res.json();
  } catch {
    return { ok: false, error: res.status >= 500 ? "Something went wrong on our side. Please try again in a moment." : `Request failed (${res.status}).` };
  }
}
