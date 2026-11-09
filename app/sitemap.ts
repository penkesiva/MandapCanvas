import type { MetadataRoute } from "next";
import { SITE } from "@/lib/config";
import { FREE_TOOLS, toolHref } from "@/lib/tools";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/looks", "/looks/maharani", "/looks/navratri", "/mandap", "/create", "/gallery", "/pricing", "/pro", "/tools", "/faq", "/about", "/contact", "/terms", "/privacy", "/refunds"];
  return [
    ...pages.map((p) => ({
      url: `${SITE.url}${p}`,
      changeFrequency: "weekly" as const,
      priority: p === "" ? 1 : ["/looks", "/looks/maharani", "/looks/navratri", "/mandap", "/tools"].includes(p) ? 0.9 : 0.6,
    })),
    ...FREE_TOOLS.map((t) => ({ url: `${SITE.url}${toolHref(t)}`, changeFrequency: "monthly" as const, priority: 0.8 })),
  ];
}
