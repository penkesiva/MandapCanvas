import type { Metadata } from "next";
import { PageShell } from "@/components/SiteChrome";
import { SITE, FACE_RETENTION_DAYS } from "@/lib/config";

export const metadata: Metadata = {
  alternates: { canonical: "/privacy" }, title: "Privacy" };

export default function Privacy() {
  return (
    <PageShell>
      <article className="prose-legal mx-auto max-w-2xl px-4 pb-24 pt-12 sm:px-6">
        <h1 className="text-[2.6rem]">Privacy</h1>
        <p>Last updated: October 30, 2026. Please have this reviewed by a lawyer for your jurisdiction (including CCPA/CPRA) before launch.</p>
        <h2>What we collect</h2>
        <ul>
          <li>Your email address, to sign you in and send receipts and album-ready notices.</li>
          <li>The sketches, photos, logos and settings you upload to create images, and the images we create.</li>
          <li>Payment details are handled by Stripe. We never see or store your card number.</li>
          <li>Basic, privacy-friendly analytics about page visits and feature use, without cross-site tracking.</li>
        </ul>
        <h2>Photos of people</h2>
        <ul>
          <li>Face photos are used only to create images in your album, or your portrait in the free AI bridal look tool.</li>
          <li>They are deleted from our storage within {FACE_RETENTION_DAYS} days of upload. Portraits made with the free AI bridal look tool are deleted on the same schedule.</li>
          <li>We never use your photos or albums to train AI models, and we never sell them.</li>
          <li>We strip location and camera metadata from every upload.</li>
        </ul>
        <h2>Who processes your data</h2>
        <p>
          We use service providers to run MandapCanvas: Google (Gemini) to generate images from your inputs, Vercel for hosting, Supabase for our database and file
          storage, Stripe for payments and Resend for email. They process data on our behalf under their own
          terms.
        </p>
        <h2>Sharing</h2>
        <p>Your album is private. If you create a share link, anyone with the link can view the finished images and add hearts.</p>
        <h2>Your choices</h2>
        <p>
          Email <a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a> to download or delete your account and albums. We&apos;ll
          respond within 30 days.
        </p>
      </article>
    </PageShell>
  );
}
