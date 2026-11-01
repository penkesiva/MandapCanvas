"use client";

import { track } from "@vercel/analytics";

/** Log an analytics event and count it as a sign of real engagement (used by the sign-up prompt). */
export function engage(name: string, props?: Record<string, string | number | boolean | null>) {
  track(name, props);
  if (typeof window !== "undefined") window.dispatchEvent(new Event("mc:engaged"));
}
