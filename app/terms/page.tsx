import type { Metadata } from "next";
import { PageShell } from "@/components/SiteChrome";
import { SITE } from "@/lib/config";

export const metadata: Metadata = { title: "Terms of service" };

export default function Terms() {
  return (
    <PageShell>
      <article className="prose-legal mx-auto max-w-2xl px-4 pb-24 pt-12 sm:px-6">
        <h1 className="text-[2.6rem]">Terms of service</h1>
        <p>Last updated: October 30, 2026. These terms are a starting template and should be reviewed by a lawyer before launch.</p>
        <h2>The service</h2>
        <p>
          MandapCanvas, operated by OneCreator LLC (&ldquo;we&rdquo;), creates AI-generated concept images of wedding decor, outfits and
          people from inputs you provide. Images are illustrations for planning. They are not guarantees of how any decor, outfit, venue
          or person will look, and vendors are not bound by them.
        </p>
        <h2>Your content and permission</h2>
        <ul>
          <li>You may only upload sketches, photos and logos you own or have permission to use.</li>
          <li>You may only upload photos of people who are adults (18+) and who have given you permission.</li>
          <li>You may not use the service to create sexual, hateful, harassing, deceptive or unlawful content, or images of anyone without their consent.</li>
        </ul>
        <h2>What you can do with images</h2>
        <p>
          You may use images from albums you paid for for personal planning, sharing with family and vendors, and — for Pro and Studio
          subscribers — in client proposals and your own marketing, labeled as concept renderings. Free previews are watermarked and for
          evaluation only.
        </p>
        <h2>Payments and refunds</h2>
        <p>
          Album packs are one-time purchases. Pro and Studio plans renew monthly or yearly until canceled in your billing settings. See our
          refund policy for details.
        </p>
        <h2>Availability</h2>
        <p>
          We work to keep the service running but don&apos;t guarantee uninterrupted availability. We may pause generation to protect the
          service, for example if we detect abuse.
        </p>
        <h2>Liability</h2>
        <p>
          To the extent permitted by law, our total liability for any claim is limited to the amount you paid us in the 12 months before
          the claim.
        </p>
        <h2>Contact</h2>
        <p>
          <a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a>
        </p>
      </article>
    </PageShell>
  );
}
