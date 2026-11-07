import type { Metadata } from "next";
import { CollectionPage } from "@/components/looks/CollectionPage";
import { PACKS, formatUSD } from "@/lib/config";

const title = "Maharani Portraits: See Yourself in Heritage Sarees at Palaces and Temples";
const description = `Upload a few selfies and see yourself as a maharani: ${PACKS.maharani12.images} photo-real portraits in Banarasi, Kanjeevaram and Paithani silk sarees, at palace halls and temple courtyards. Still unmistakably you. ${formatUSD(PACKS.maharani12.priceCents)}.`;

export const metadata: Metadata = {
  title: { absolute: `${title} · MandapCanvas` },
  description,
  alternates: { canonical: "/looks/maharani" },
  openGraph: { title: "See yourself as a maharani", description, url: "/looks/maharani", type: "website", images: [{ url: "/og-maharani.jpg", width: 1200, height: 630, alt: "The same woman in four heritage silk sarees at palaces and temples" }] },
  twitter: { card: "summary_large_image", images: ["/og-maharani.jpg"] },
};

export default function MaharaniPage() {
  return (
    <CollectionPage
      id="maharani"
      title="See yourself as a maharani"
      intro={`Twelve grand portraits of you in heritage silk sarees, at palace durbar halls, mirror halls and temple courtyards. Made from your own photos, so it's still unmistakably you. ${PACKS.maharani12.images} portraits for ${formatUSD(PACKS.maharani12.priceCents)}.`}
      galleryTitle="Twelve sarees, twelve settings"
      steps={[
        ["Add your photos", "One to five clear selfies. More angles give a closer likeness."],
        ["We dress you like royalty", "Banarasi, Kanjeevaram, Paithani and more, with heirloom jewelry, at palaces and temples."],
        ["Share your album", "Twelve portraits in a private album, no watermark, ready in about 10 minutes."],
      ]}
      faq={[
        { q: "Will it really look like me?", a: "Yes. Every portrait is made from your own photos with strict rules to keep your face, skin tone and features exactly as they are. Only the saree, jewelry, hair and setting change. Uploading 3 to 5 photos from different angles gives the closest likeness." },
        { q: "What do I get?", a: `${PACKS.maharani12.images} portraits, one in each of the twelve sarees and settings, in a private album with no watermark, plus ${PACKS.maharani12.freeRegens} free redos if one isn't quite right.` },
        { q: "Can I keep my glasses?", a: "Yes. Glasses are removed by default; choose \"Keep my glasses\" and they stay exactly as in your photo." },
        { q: "What happens to my photos?", a: "They're used only to make your portraits and are deleted after 7 days. Your portraits stay in your album." },
        { q: "Are these real photos?", a: "They're AI portraits made from your photos: concept images, not photographs of real places on a real day." },
      ]}
    />
  );
}
