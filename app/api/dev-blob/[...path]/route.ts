import { readDevBlob, usingDevBlob } from "@/lib/blob";

export const runtime = "nodejs";

/** Serves locally stored images in development (when Vercel Blob isn't configured). */
export async function GET(_req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  if (!usingDevBlob()) return new Response("Not found", { status: 404 });
  const { path } = await ctx.params;
  const rel = path.join("/");
  if (rel.includes("..")) return new Response("Not found", { status: 404 });
  const file = await readDevBlob(rel);
  if (!file) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(file.data), {
    headers: { "Content-Type": file.mimeType, "Cache-Control": "public, max-age=31536000, immutable" },
  });
}
