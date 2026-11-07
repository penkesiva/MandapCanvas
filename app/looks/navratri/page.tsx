import type { Metadata } from "next";
import { CollectionPage } from "@/components/looks/CollectionPage";
import { PACKS, formatUSD } from "@/lib/config";

const title = "Navratri Saree Portraits: Nine Days, Nine Colors, From Your Selfies";
const description = `Upload a few selfies and get a Navratri portrait for each of the nine days, in that day's saree color, at a temple, a lawn, a garba night or your balcony. ${PACKS.navratri9.images} for ${formatUSD(PACKS.navratri9.priceCents)} or ${PACKS.navratri18.images} for ${formatUSD(PACKS.navratri18.priceCents)}.`;

export const metadata: Metadata = {
  title: { absolute: `${title} · MandapCanvas` },
  description,
  alternates: { canonical: "/looks/navratri" },
  openGraph: { title: "Nine days, nine sarees, all you", description, url: "/looks/navratri", type: "website" },
};

export default function NavratriPage() {
  return (
    <CollectionPage
      id="navratri"
      title="Nine days, nine sarees, all you"
      intro="A portrait for every day of Navratri, each in that day's color, at a temple hall, a garba night, a fall park, your balcony and more. Made from your own photos, so it's still you. Post one each day."
      galleryTitle="One color for each day"
      steps={[
        ["Add your photos", "One to five clear selfies. More angles give a closer likeness."],
        ["Nine colors, nine places", "Red, royal blue, yellow, green, grey, orange, white, pink and purple, at temples, lawns, balconies and garba nights."],
        ["Post one a day", `Get ${PACKS.navratri9.images} portraits, or ${PACKS.navratri18.images} with a close-up and a full-length look for every day.`],
      ]}
      faq={[
        { q: "Will it really look like me?", a: "Yes. Every portrait is made from your own photos with strict rules to keep your face, skin tone and features exactly as they are. Only the saree, jewelry, hair and backdrop change. Uploading 3 to 5 photos from different angles gives the closest likeness." },
        { q: "Which colors are the nine days?", a: "Red, royal blue, yellow, green, grey and silver, orange, white, pink and purple. Families follow different color calendars, so treat these as a festive set rather than an official list." },
        { q: "What's the difference between the two packs?", a: `${PACKS.navratri9.images} portraits (${formatUSD(PACKS.navratri9.priceCents)}) gives one for each day. ${PACKS.navratri18.images} portraits (${formatUSD(PACKS.navratri18.priceCents)}) gives two for each day: a close portrait and a full-length one.` },
        { q: "Can I keep my glasses?", a: "Yes. Glasses are removed by default; choose \"Keep my glasses\" and they stay exactly as in your photo." },
        { q: "What happens to my photos?", a: "They're used only to make your portraits and are deleted after 7 days. Your portraits stay in your album." },
      ]}
    />
  );
}
