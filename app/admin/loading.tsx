import { PageShell } from "@/components/SiteChrome";

/** Shown instantly while the admin numbers load. */
export default function AdminLoading() {
  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-4 pb-24 pt-10 sm:px-6" aria-busy="true" aria-live="polite">
        <h1 className="text-[2.4rem]">Admin</h1>
        <p className="mt-1 text-sm text-ink-soft">Loading the numbers…</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 9 }, (_, i) => (
            <div key={i} className="rounded-2xl border border-line bg-white p-4">
              <div className="h-3 w-20 animate-pulse rounded bg-silk" />
              <div className="mt-3 h-6 w-14 animate-pulse rounded bg-silk" />
            </div>
          ))}
        </div>
        <div className="mt-10 space-y-3">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="h-5 animate-pulse rounded bg-silk" style={{ width: `${90 - i * 8}%` }} />
          ))}
        </div>
      </div>
    </PageShell>
  );
}
