import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MandapCanvas",
    short_name: "MandapCanvas",
    description: "See your Desi wedding before it happens.",
    start_url: "/",
    display: "standalone",
    background_color: "#fbf1ee",
    theme_color: "#7a1426",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
