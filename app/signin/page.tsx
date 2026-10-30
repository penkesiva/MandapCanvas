import type { Metadata } from "next";
import { PageShell } from "@/components/SiteChrome";
import { SignInForm } from "@/components/SignInForm";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default async function SignIn(props: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const sp = await props.searchParams;
  return (
    <PageShell>
      <div className="mx-auto max-w-md px-4 py-20 sm:px-6">
        <h1 className="text-[2.4rem]">Sign in</h1>
        <p className="mt-2 text-ink-soft">We&apos;ll email you a link. No password to remember. Use the email you paid with to see your albums.</p>
        {sp.error === "expired" ? (
          <p role="alert" className="mt-5 rounded-2xl bg-[#fdecee] px-4 py-3 text-kumkum-deep">That link has expired or was already used. Request a new one below.</p>
        ) : null}
        <SignInForm next={sp.next} />
      </div>
    </PageShell>
  );
}
