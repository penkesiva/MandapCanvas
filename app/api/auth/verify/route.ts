import { NextResponse } from "next/server";
import { anonId, findOrCreateUser, startSession, verify } from "@/lib/auth";
import { claimAnonAlbums } from "@/lib/albums";
import { SITE } from "@/lib/config";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const data = verify<{ purpose: string; email: string; next: string; exp: number }>(url.searchParams.get("token"));
  if (!data || data.purpose !== "login") {
    return NextResponse.redirect(`${SITE.url}/signin?error=expired`);
  }
  const user = await findOrCreateUser(data.email);
  await claimAnonAlbums(await anonId(false), user.id);
  await startSession(user.id);
  const next = data.next?.startsWith("/") && !data.next.startsWith("//") ? data.next : "/account";
  return NextResponse.redirect(`${SITE.url}${next}`);
}
