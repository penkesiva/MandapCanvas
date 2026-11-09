import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { SITE } from "@/lib/config";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "MandapCanvas — See your Desi wedding before it happens",
    template: "%s · MandapCanvas",
  },
  description:
    "See yourself as a Desi bride or groom at every event, as a Maharani or in nine Navratri sarees, and your mandap and decor before the wedding. Photo-real, from your own photos. Try for free.",
  applicationName: "MandapCanvas",
  // favicon.ico is added automatically from app/favicon.ico.
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/apple-icon.png",
  },
  openGraph: {
    type: "website",
    siteName: "MandapCanvas",
    url: "/",
    images: [{ url: "/og-home.jpg", width: 1200, height: 630, alt: "Bridal, Maharani and Navratri portraits beside a photo-real mandap" }],
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#fbf1ee",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
