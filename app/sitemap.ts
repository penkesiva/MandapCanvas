import type { MetadataRoute } from "next";
import { SITE } from "@/lib/config";
import { FREE_TOOLS } from "@/lib/tools";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/create", "/gallery", "/pricing", "/pro", "/tools", "/faq", "/about", "/terms", "/privacy", "/refunds"];
  return [
    ...pages.map((p) => ({
      url: `${SITE.url}${p}`,
      changeFrequency: "weekly" as const,
      priority: p === "" ? 1 : p === "/tools" ? 0.8 : 0.6,
    })),
    ...FREE_TOOLS.map((t) => ({ url: `${SITE.url}/tools/${t.slug}`, changeFrequency: "monthly" as const, priority: 0.8 })),
  ];
}
