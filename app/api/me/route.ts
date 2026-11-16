import { NextResponse } from "next/server";
import { currentUser, isAdmin } from "@/lib/auth";
import { albumsForUser } from "@/lib/albums";

export const runtime = "nodejs";

/** Who's signed in, for the header. Loaded after the page shows, so pages themselves can be static and fast. */
export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ ok: true, user: null, drafts: 0 }, { headers: { "Cache-Control": "private, no-store" } });
  // Unpaid drafts are their cart: a count on the account badge.
  const drafts = (await albumsForUser(user.id).catch(() => [])).filter((a) => !a.paid).length;
  return NextResponse.json(
    { ok: true, user: { label: user.name?.trim() || user.email, email: user.email, admin: isAdmin(user) }, drafts },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
