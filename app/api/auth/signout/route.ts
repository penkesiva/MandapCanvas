import { NextResponse } from "next/server";
import { endSession } from "@/lib/auth";
import { SITE } from "@/lib/config";

export const runtime = "nodejs";

export async function POST() {
  await endSession();
  return NextResponse.redirect(`${SITE.url}/`, { status: 303 });
}
