import "server-only";
import { createHash, randomInt } from "node:crypto";
import { cookies } from "next/headers";
import { sign, verify } from "./auth";
import type { Album } from "./types";

/**
 * A 6-digit code on an album's share link. Opening the link asks for it once per device;
 * changing or turning off the code signs everyone out of the old one.
 */
export function newPin(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

const cookieName = (token: string) => `mc_s_${token.slice(0, 10)}`;
const pinTag = (pin: string) => createHash("sha256").update(pin).digest("hex").slice(0, 12);

/** True when the album has no code, or this browser already entered the current one. */
export async function shareUnlocked(album: Album, token: string): Promise<boolean> {
  if (!album.sharePin) return true;
  const data = verify<{ t: string; h: string; exp: number }>((await cookies()).get(cookieName(token))?.value);
  return !!data && data.t === token && data.h === pinTag(album.sharePin);
}

export async function rememberUnlock(album: Album, token: string): Promise<void> {
  const days = 90;
  (await cookies()).set(cookieName(token), sign({ t: token, h: pinTag(album.sharePin ?? ""), exp: Date.now() + days * 86400000 }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: days * 86400,
  });
}
