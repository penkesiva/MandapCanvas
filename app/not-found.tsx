import Link from "next/link";
import { PageShell } from "@/components/SiteChrome";

export default function NotFound() {
  return (
    <PageShell>
      <div className="mx-auto max-w-xl px-4 py-28 text-center sm:px-6">
        <h1 className="text-[2.4rem]">We couldn&apos;t find that page</h1>
        <p className="mt-3 text-ink-soft">The link may be old, or the album may be private.</p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/" className="btn btn-ghost">Home</Link>
          <Link href="/create" className="btn btn-primary">Make a free preview</Link>
        </div>
      </div>
    </PageShell>
  );
}
