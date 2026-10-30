import { loadImage } from "@/lib/blob";
import { isOurImageUrl } from "@/lib/validate";

export const runtime = "nodejs";

/** Same-origin proxy for our own stored images, used by ZIP downloads to avoid CORS issues. */
export async function GET(request: Request) {
  const u = new URL(request.url).searchParams.get("u");
  if (!isOurImageUrl(u)) return new Response("Not found", { status: 404 });
  try {
    const img = await loadImage(u);
    return new Response(new Uint8Array(img.data), {
      headers: { "Content-Type": img.mimeType, "Cache-Control": "private, max-age=3600" },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
