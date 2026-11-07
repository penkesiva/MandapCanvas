import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageShell } from "@/components/SiteChrome";
import { currentUser, isAdmin } from "@/lib/auth";
import { getCredits } from "@/lib/albums";
import { PLANS, formatUSD } from "@/lib/config";
import { ProfileForm } from "@/components/account/ProfileForm";
import { BrandSettings } from "@/components/account/BrandSettings";
import { InventoryManager } from "@/components/account/InventoryManager";

export const metadata: Metadata = { title: "Profile and settings", robots: { index: false } };

export default async function Profile() {
  const user = await currentUser();
  if (!user) redirect("/signin?next=/account/profile");
  const credits = await getCredits(user.id);
  const plan = user.plan ? PLANS[user.plan] : null;

  return (
    <PageShell>
      <div className="mx-auto max-w-3xl px-4 pb-24 pt-10 sm:px-6">
        <Link href="/account" className="text-sm font-medium text-kumkum underline underline-offset-2">
          My albums
        </Link>
        <h1 className="mt-2 text-[2.4rem]">Profile and settings</h1>

        <Section title="About you" text="We use your first name to greet you, and your wedding date for a countdown on My albums.">
          <ProfileForm name={user.name ?? ""} weddingDate={user.weddingDate ?? ""} />
        </Section>

        <Section title="Account">
          <dl className="grid gap-3 text-[0.95rem]">
            <Row label="Email">{user.email}</Row>
            <Row label="Image credits">{credits}</Row>
            <Row label="Plan">
              {plan ? (
                <>
                  {plan.name}, {formatUSD(plan.monthlyCents)} a month
                  {user.planStatus && user.planStatus !== "active" ? ` (${user.planStatus.replace("_", " ")})` : ""}
                </>
              ) : (
                <>
                  None.{" "}
                  <Link href="/pro" className="font-medium text-kumkum underline underline-offset-2">
                    See Pro for decorators
                  </Link>
                </>
              )}
            </Row>
          </dl>
          <div className="mt-5 flex flex-wrap gap-2">
            {user.stripeCustomerId ? (
              <form action="/api/account/portal" method="post">
                <button className="btn btn-ghost btn-sm">Billing and receipts</button>
              </form>
            ) : null}
            {isAdmin(user) ? (
              <Link href="/admin" className="btn btn-ghost btn-sm">
                Admin
              </Link>
            ) : null}
            <form action="/api/auth/signout" method="post">
              <button className="btn btn-ghost btn-sm">Sign out</button>
            </form>
          </div>
        </Section>

        {plan ? (
          <Section title="Your brand" text="Your logo and colors on every client proposal.">
            <div className="grid gap-10">
              <BrandSettings brand={user.brand ?? null} />
              <InventoryManager items={user.inventory ?? []} enabled={user.plan === "studio"} />
            </div>
          </Section>
        ) : null}

        <Section title="Privacy">
          <p className="text-ink-soft">
            Photos of faces you upload, and free-tool pictures that show a face, are deleted automatically after 7 days. Albums you pay for are kept. To delete your
            account and everything in it, <Link href="/contact" className="font-medium text-kumkum underline underline-offset-2">contact us</Link>.
          </p>
        </Section>
      </div>
    </PageShell>
  );
}

function Section({ title, text, children }: { title: string; text?: string; children: React.ReactNode }) {
  return (
    <section className="mt-8 rounded-[22px] border border-line bg-white p-5 sm:p-7">
      <h2 className="text-2xl">{title}</h2>
      {text ? <p className="mt-1 text-ink-soft">{text}</p> : null}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-0.5 border-b border-line pb-3 last:border-0 last:pb-0">
      <dt className="w-32 flex-none text-ink-soft">{label}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  );
}
