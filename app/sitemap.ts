import type { MetadataRoute } from "next";
import { SITE } from "@/lib/config";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/create", "/gallery", "/pricing", "/pro", "/faq", "/about", "/terms", "/privacy", "/refunds"].map((p) => ({
    url: `${SITE.url}${p}`,
    changeFrequency: "weekly",
    priority: p === "" ? 1 : 0.6,
  }));
}
