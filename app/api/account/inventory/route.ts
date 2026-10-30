import { NextResponse } from "next/server";
import { currentUser, saveUser } from "@/lib/auth";
import { isOurImageUrl } from "@/lib/validate";
import { deleteImage } from "@/lib/blob";
import { jsonError } from "@/lib/http";

export const runtime = "nodejs";

const MAX_ITEMS = 40;

/** Studio plan: photos of the decorator's own mandaps, florals and fabrics, used as style references. */
export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return jsonError("Sign in first.", 401);
  if (user.plan !== "studio") return jsonError("Your own inventory is part of the Studio plan.", 402, "needs_studio");
  const b = (await request.json().catch(() => null)) as { url?: string; label?: string } | null;
  if (!b || !isOurImageUrl(b.url)) return jsonError("Upload a photo first.");
  const list = user.inventory ?? [];
  if (list.length >= MAX_ITEMS) return jsonError(`You can keep up to ${MAX_ITEMS} inventory photos.`);
  list.unshift({ id: crypto.randomUUID().slice(0, 10), url: b.url, label: (b.label || "Untitled piece").slice(0, 60) });
  user.inventory = list;
  await saveUser(user);
  return NextResponse.json({ ok: true, inventory: list });
}

export async function DELETE(request: Request) {
  const user = await currentUser();
  if (!user) return jsonError("Sign in first.", 401);
  const id = new URL(request.url).searchParams.get("id");
  const item = user.inventory?.find((i) => i.id === id);
  if (!item) return jsonError("Not found.", 404);
  user.inventory = user.inventory!.filter((i) => i.id !== id);
  await saveUser(user);
  await deleteImage(item.url);
  return NextResponse.json({ ok: true, inventory: user.inventory });
}
