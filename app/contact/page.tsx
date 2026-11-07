import type { Metadata } from "next";
import { Mail } from "lucide-react";
import { PageShell } from "@/components/SiteChrome";
import { FeedbackForm } from "@/components/FeedbackForm";
import { SITE } from "@/lib/config";

export const metadata: Metadata = {
  title: "Contact us",
  description: "Questions about an order, a refund or your album? Write to MandapCanvas and we'll reply by email.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <PageShell>
      <div className="mx-auto grid max-w-5xl gap-10 px-4 pb-24 pt-10 sm:px-6 md:grid-cols-[1fr_1.1fr]">
        <div>
          <h1 className="text-[2.4rem] text-maroon sm:text-[3rem]">Contact us</h1>
          <p className="mt-4 text-lg text-ink-soft">
            Questions about an order, a refund or your album? Ideas or something broken? Write to us and we&apos;ll reply by email, usually within a day.
          </p>
          <p className="mt-6 flex items-center gap-2 text-ink">
            <Mail size={18} className="text-kumkum" />
            <a href={`mailto:${SITE.supportEmail}`} className="font-semibold underline underline-offset-4">
              {SITE.supportEmail}
            </a>
          </p>
          <p className="mt-2 text-sm text-ink-soft">For an order, include the link to your album so we can find it quickly.</p>
        </div>
        <div className="rounded-[24px] border border-gold/40 bg-white p-5 shadow-[0_30px_60px_-44px_rgba(74,13,26,0.6)] sm:p-7">
          <FeedbackForm kind="contact" />
        </div>
      </div>
    </PageShell>
  );
}
