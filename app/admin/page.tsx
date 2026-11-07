import type { Metadata } from "next";
import type { FeedbackEntry } from "@/app/api/feedback/route";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/SiteChrome";
import { currentUser, isAdmin } from "@/lib/auth";
import { readStats } from "@/lib/stats";
import { getAlbum, listAlbumIds } from "@/lib/albums";
import { kv, kvBackend } from "@/lib/kv";
import { blobBackend } from "@/lib/blob";
import { flags, formatUSD } from "@/lib/config";
import { imageModel, usingVertex } from "@/lib/imagegen";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function Admin() {
  const user = await currentUser();
  if (!isAdmin(user)) notFound();
  // Everything the page needs, fetched in parallel (it used to be ~19 round trips in a row).
  const [{ total, daily }, albums, userList, leadRows, feedbackRows] = await Promise.all([
    readStats(14),
    listAlbumIds("albums:all").then(async (ids) => (await Promise.all(ids.slice(0, 25).map(getAlbum))).filter(Boolean)),
    kv().lrange("users:all", 0, -1),
    kv().lrange("leads", 0, 49),
    kv().lrange("feedback", 0, 49),
  ]);
  const feedback = feedbackRows
    .map((r) => {
      try {
        return (typeof r === "string" ? JSON.parse(r) : r) as FeedbackEntry;
      } catch {
        return null;
      }
    })
    .filter((f): f is FeedbackEntry => !!f);
  const users = userList.length;
  const leads = leadRows
    .map((l) => {
      try {
        return JSON.parse(l) as { email: string; source: string; path: string; at: number };
      } catch {
        return null;
      }
    })
    .filter((l) => l !== null);
  const revenue = total.revenueCents ?? 0;
  const cost = Math.round((total.costMilliCents ?? 0) / 1000);

  const setup = [
    ["Image model", flags.mockGeneration() ? "MOCK (set Vertex AI or GEMINI_API_KEY)" : `${imageModel()} via ${usingVertex() ? "Vertex AI" : "AI Studio key"}`],
    ["Payments", flags.stripeEnabled() ? "Stripe live/test key set" : "Test checkout (set STRIPE_SECRET_KEY)"],
    ["Database", kvBackend()],
    ["Image storage", blobBackend()],
    ["Email", process.env.RESEND_API_KEY ? "Resend" : "Logged to console (set RESEND_API_KEY)"],
  ];

  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-4 pb-24 pt-10 sm:px-6">
        <h1 className="text-[2.4rem]">Admin</h1>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            ["Revenue", formatUSD(revenue)],
            ["Model cost", formatUSD(cost)],
            ["Gross margin", revenue ? `${Math.round(((revenue - cost) / revenue) * 100)}%` : "—"],
            ["Orders + subs", String((total.orders ?? 0) + (total.subscriptions ?? 0))],
            ["Users", String(users)],
            ["Sign-up leads", String(total.leads ?? 0)],
            ["Images", String(total.images ?? 0)],
            ["Free previews", String(total.previews ?? 0)],
            ["Failures", String(total.failures ?? 0)],
          ].map(([k, v]) => (
            <div key={k} className="rounded-2xl border border-line bg-white p-4">
              <p className="text-sm text-ink-soft">{k}</p>
              <p className="font-display text-3xl">{v}</p>
            </div>
          ))}
        </div>

        <h2 className="mt-12 text-2xl">Setup</h2>
        <table className="mt-3 w-full text-left text-sm">
          <tbody>
            {setup.map(([k, v]) => (
              <tr key={k} className="border-b border-line">
                <th className="py-2 pr-4 font-medium">{k}</th>
                <td className="py-2">{v}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2 className="mt-12 text-2xl">Recent feedback</h2>
        {feedback.length === 0 ? (
          <p className="mt-3 text-sm text-ink-soft">None yet. Visitors can send it from the Feedback button on every page, or from /contact.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {feedback.map((f) => (
              <li key={f.at} className="rounded-2xl border border-line bg-white p-4 text-sm">
                <p className="whitespace-pre-wrap text-ink">
                  {f.rating ? <span className="mr-1.5">{f.rating}</span> : null}
                  {f.message}
                </p>
                <p className="mt-2 text-xs text-ink-soft">
                  {f.kind === "contact" ? "Contact" : "Feedback"} · {f.page || "/"} · {f.email ? <a className="underline" href={`mailto:${f.email}`}>{f.email}</a> : "no email"} · {new Date(f.at).toLocaleString("en-US")}
                </p>
              </li>
            ))}
          </ul>
        )}

        <h2 className="mt-12 text-2xl">Recent sign-up leads</h2>
        {leads.length === 0 ? (
          <p className="mt-3 text-sm text-ink-soft">None yet. The sign-up prompt appears after someone spends a minute or two on the site.</p>
        ) : (
          <table className="mt-3 w-full text-left text-sm">
            <tbody>
              {leads.map((l) => (
                <tr key={`${l.email}-${l.at}`} className="border-b border-line">
                  <td className="py-2 pr-4">{l.email}</td>
                  <td className="py-2 pr-4 text-ink-soft">{l.source}</td>
                  <td className="py-2 text-ink-soft">{new Date(l.at).toLocaleString("en-US")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <h2 className="mt-12 text-2xl">Last 14 days</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-ink-soft">
                {["Day", "Previews", "Images", "Orders", "Revenue", "Cost", "Failures"].map((h) => (
                  <th key={h} className="py-2 pr-4 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {daily.map(({ day, v }) => (
                <tr key={day} className="border-b border-line tabular-nums">
                  <td className="py-2 pr-4">{day}</td>
                  <td className="py-2 pr-4">{v.previews ?? 0}</td>
                  <td className="py-2 pr-4">{v.images ?? 0}</td>
                  <td className="py-2 pr-4">{(v.orders ?? 0) + (v.subscriptions ?? 0)}</td>
                  <td className="py-2 pr-4">{formatUSD(v.revenueCents ?? 0)}</td>
                  <td className="py-2 pr-4">{formatUSD(Math.round((v.costMilliCents ?? 0) / 1000))}</td>
                  <td className="py-2 pr-4">{v.failures ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 className="mt-12 text-2xl">Recent albums</h2>
        <ul className="mt-3 divide-y divide-line">
          {albums.map((a) => (
            <li key={a!.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
              <span>
                {a!.title} <span className="text-ink-soft">({a!.kind}, {a!.paid ? a!.packId : "draft"}, {a!.status})</span>
              </span>
              <span className="text-ink-soft">
                {a!.shots.filter((s) => s.status === "done").length}/{a!.shots.length} images, {formatUSD(Math.round((a!.costMilliCents ?? 0) / 1000))} cost{" "}
                <Link className="ml-2 underline" href={`/album/${a!.id}`}>open</Link>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </PageShell>
  );
}
