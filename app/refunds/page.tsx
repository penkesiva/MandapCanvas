import type { Metadata } from "next";
import { PageShell } from "@/components/SiteChrome";
import { SITE } from "@/lib/config";

export const metadata: Metadata = {
  alternates: { canonical: "/refunds" }, title: "Refunds" };

export default function Refunds() {
  return (
    <PageShell>
      <article className="prose-legal mx-auto max-w-2xl px-4 pb-24 pt-12 sm:px-6">
        <h1 className="text-[2.6rem]">Refunds</h1>
        <h2>Album packs</h2>
        <p>
          If your album isn&apos;t what you hoped, email <a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a> within 14 days of
          purchase. We&apos;ll first try to fix it with extra new versions. If that doesn&apos;t work, we&apos;ll refund you in full.
        </p>
        <h2>Images that fail</h2>
        <p>Any image that fails to generate can be retried for free from your album page.</p>
        <h2>Pro and Studio plans</h2>
        <p>
          Cancel any time in billing settings; your plan stays active until the end of the period you paid for. If you&apos;re charged for
          a renewal you didn&apos;t intend and haven&apos;t used it, email us within 7 days for a refund.
        </p>
      </article>
    </PageShell>
  );
}
