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
    "Turn a sketch, a photo or a style you love into a photo-real album of your Desi wedding: mandap, Haldi, Mehndi, Sangeet and reception decor, plus outfits matched to every palette.",
  openGraph: {
    type: "website",
    siteName: "MandapCanvas",
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "A hand-drawn mandap sketch beside its photo-real preview" }],
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
