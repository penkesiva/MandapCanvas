import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageShell } from "@/components/SiteChrome";
import { currentUser, isAdmin } from "@/lib/auth";
import { albumsForUser, getCredits } from "@/lib/albums";
import { PLANS, PACKS } from "@/lib/config";
import { Images } from "lucide-react";
import { eventLabel } from "@/lib/catalog";
import { getCollection } from "@/lib/lookCollections";
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

        <ul className="mt-10 grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {albums.map((a) => {
            const done = a.shots.filter((s) => s.status === "done" && s.url);
            const pics = (done.length ? done : a.previews.filter((p) => p.url)).slice(0, 3).map((x) => x.url!);
            const count = a.paid ? (a.status === "complete" ? done.length : a.shots.length) : a.previews.filter((p) => p.url).length;
            const countLabel = a.paid ? `${count} ${count === 1 ? "image" : "images"}` : `${count} ${count === 1 ? "preview" : "previews"}`;
            const packName = PACKS[a.packId].name.endsWith("pack") ? PACKS[a.packId].name : `${PACKS[a.packId].name} pack`;
            const kindLine = a.config.artPack
              ? "Art portraits"
              : getCollection(a.config.look?.collection)
                ? getCollection(a.config.look?.collection)!.name
                : a.config.look
                  ? "Wedding looks"
              : a.config.venuePack
                ? "Venue pack"
                : a.config.events.map((e) => eventLabel(e, a.config.tradition)).join(", ");
            return (
              <li key={a.id} className="pt-3">
                <Link href={`/album/${a.id}`} className="group relative block">
                  {/* page edges behind the cover, so it reads as an album */}
                  <span aria-hidden="true" className="absolute inset-x-6 -top-3 h-8 rounded-t-[18px] border border-[#dcc3b6] bg-[#ead6cb]" />
                  <span aria-hidden="true" className="absolute inset-x-3 -top-1.5 h-8 rounded-t-[19px] border border-[#e3cfc4] bg-[#f4e6de]" />
                  <span className="relative block overflow-hidden rounded-[20px] border border-line bg-white transition group-hover:border-ink group-hover:shadow-[0_18px_40px_-26px_rgba(42,11,20,0.7)]">
                    <span className="relative grid aspect-[4/3] grid-cols-3 grid-rows-2 gap-0.5 bg-white">
                      {pics.length ? (
                        pics.map((url, i) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            key={url}
                            src={url}
                            alt=""
                            loading="lazy"
                            className={`h-full w-full object-cover ${tileClass(pics.length, i)}`}
                          />
                        ))
                      ) : (
                        <span className="col-span-3 row-span-2 bg-gradient-to-br from-silk to-line" />
                      )}
                      {count ? (
                        <span className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">
                          <Images size={13} aria-hidden="true" /> {countLabel}
                        </span>
                      ) : null}
                      {!a.paid ? (
                        <span className="absolute right-2.5 top-2.5 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-maroon">Draft</span>
                      ) : null}
                    </span>
                    <span className="block px-4 py-3">
                      <span className="block font-semibold">{a.title}</span>
                      <span className="block text-sm text-ink-soft">
                        {a.paid
                          ? a.status === "complete"
                            ? `${packName}, ${countLabel} included`
                            : `${done.length} of ${a.shots.length} ready`
                          : `${packName} not yet purchased`}
                        {a.clientName ? `. For ${a.clientName}` : ""}
                      </span>
                      <span className="mt-0.5 block text-xs text-ink-soft">{kindLine}</span>
                    </span>
                  </span>
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

/** Collage layout: one big picture on the left, up to two stacked on the right. */
function tileClass(count: number, i: number): string {
  if (count === 1) return "col-span-3 row-span-2";
  if (i === 0) return "col-span-2 row-span-2";
  return count === 2 ? "row-span-2" : "";
}
