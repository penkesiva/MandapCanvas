import { NextResponse } from "next/server";
import { currentUser, saveUser } from "@/lib/auth";
import { jsonError } from "@/lib/http";

export const runtime = "nodejs";

/** Their name and wedding date, for pre-filling tools; empty when signed out. */
export async function GET() {
  const user = await currentUser();
  return NextResponse.json({ ok: true, signedIn: !!user, name: user?.name ?? "", weddingDate: user?.weddingDate ?? "" });
}

/** Saves what they'd like to be called and their wedding date. Both optional. */
export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return jsonError("Sign in first.", 401);
  const b = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!b) return jsonError("Invalid request.");
  const name = typeof b.name === "string" ? b.name.replace(/\s+/g, " ").trim().slice(0, 60) : "";
  const date = typeof b.weddingDate === "string" ? b.weddingDate.trim() : "";
  if (date && (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00Z`)))) {
    return jsonError("Pick a valid wedding date.");
  }
  user.name = name || undefined;
  user.weddingDate = date || undefined;
  await saveUser(user);
  return NextResponse.json({ ok: true, name: user.name ?? "", weddingDate: user.weddingDate ?? "" });
}
