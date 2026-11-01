import type { Metadata } from "next";
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
  const { total, daily } = await readStats(14);
  const ids = (await listAlbumIds("albums:all")).slice(0, 25);
  const albums = (await Promise.all(ids.map(getAlbum))).filter(Boolean);
  const users = (await kv().lrange("users:all", 0, -1)).length;
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
