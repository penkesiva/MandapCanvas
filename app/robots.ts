import type { MetadataRoute } from "next";
import { SITE } from "@/lib/config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/album/", "/s/", "/account", "/admin", "/checkout"] }],
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
