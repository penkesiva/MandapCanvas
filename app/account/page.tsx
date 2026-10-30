import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageShell } from "@/components/SiteChrome";
import { currentUser, isAdmin } from "@/lib/auth";
import { albumsForUser, getCredits } from "@/lib/albums";
import { PLANS, PACKS } from "@/lib/config";
import { eventLabel } from "@/lib/catalog";
import { BrandSettings } from "@/components/account/BrandSettings";
import { InventoryManager } from "@/components/account/InventoryManager";

export const metadata: Metadata = { title: "My albums", robots: { index: false } };

export default async function Account(props: { searchParams: Promise<{ welcome?: string; billing?: string }> }) {
  const user = await currentUser();
  if (!user) redirect("/signin?next=/account");
  const sp = await props.searchParams;
  const [albums, credits] = await Promise.all([albumsForUser(user.id), getCredits(user.id)]);
  albums.sort((a, b) => b.createdAt - a.createdAt);
  const plan = user.plan ? PLANS[user.plan] : null;

  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-4 pb-24 pt-10 sm:px-6">
        {sp.welcome === "pro" ? (
          <p className="mb-6 rounded-2xl bg-[#e8efdc] px-4 py-3 text-mehndi">
            Welcome to {plan?.name ?? "Pro"}. Add your logo below, then create your first client proposal.
          </p>
        ) : null}
        {sp.billing === "unavailable" ? (
          <p className="mb-6 rounded-2xl bg-[#fdecee] px-4 py-3 text-kumkum-deep">Billing management isn&apos;t available for this account yet.</p>
        ) : null}

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-[2.4rem]">{plan ? "Your studio" : "Your albums"}</h1>
            <p className="mt-1 text-ink-soft">
              {user.email}
              {plan ? `. ${plan.name} plan${user.planStatus && user.planStatus !== "active" ? ` (${user.planStatus.replace("_", " ")})` : ""}.` : "."} {credits} image credits available.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {plan ? (
              <Link href="/create?mode=proposal" className="btn btn-primary">New client proposal</Link>
            ) : (
              <Link href="/create" className="btn btn-primary">New album</Link>
            )}
            {user.stripeCustomerId ? (
              <form action="/api/account/portal" method="post">
                <button className="btn btn-ghost">Billing</button>
              </form>
            ) : null}
            {isAdmin(user) ? <Link href="/admin" className="btn btn-ghost">Admin</Link> : null}
            <form action="/api/auth/signout" method="post">
              <button className="btn btn-ghost">Sign out</button>
            </form>
          </div>
        </div>

        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {albums.map((a) => {
            const cover = a.shots.find((s) => s.status === "done" && s.url) ?? a.previews.find((p) => p.url);
            const done = a.shots.filter((s) => s.status === "done").length;
            return (
              <li key={a.id}>
                <Link href={`/album/${a.id}`} className="block overflow-hidden rounded-[20px] border border-line bg-white hover:border-ink">
                  {cover?.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={cover.url} alt="" className="aspect-[4/3] w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="aspect-[4/3] w-full bg-gradient-to-br from-silk to-line" />
                  )}
                  <div className="px-4 py-3">
                    <p className="font-semibold">{a.title}</p>
                    <p className="text-sm text-ink-soft">
                      {a.paid
                        ? a.status === "complete"
                          ? `${done} images`
                          : `${done} of ${a.shots.length} ready`
                        : `Draft, ${PACKS[a.packId].name} pack not yet purchased`}
                      {a.clientName ? `. For ${a.clientName}` : ""}
                    </p>
                    <p className="mt-0.5 text-xs text-ink-soft">{a.config.events.map((e) => eventLabel(e, a.config.tradition)).join(", ")}</p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
        {albums.length === 0 ? (
          <div className="mt-10 rounded-[22px] border border-dashed border-line p-10 text-center">
            <p className="text-lg font-semibold">No albums yet</p>
            <p className="mt-1 text-ink-soft">Start with a free preview — it takes about two minutes.</p>
            <Link href={plan ? "/create?mode=proposal" : "/create"} className="btn btn-primary mt-6">
              {plan ? "Create a proposal" : "Make a free preview"}
            </Link>
          </div>
        ) : null}

        {plan ? (
          <div className="mt-16 grid gap-10 lg:grid-cols-2">
            <BrandSettings brand={user.brand ?? null} />
            <InventoryManager items={user.inventory ?? []} enabled={user.plan === "studio"} />
          </div>
        ) : (
          <div className="mt-16 rounded-[22px] bg-silk p-6">
            <p className="font-semibold">Are you a decorator or planner?</p>
            <p className="mt-1 text-ink-soft">
              Pro gives you {PLANS.pro.monthlyImages} images a month, your logo on proposals and client share links.{" "}
              <Link href="/pro" className="font-medium text-kumkum underline">See Pro</Link>
            </p>
          </div>
        )}
      </div>
    </PageShell>
  );
}
