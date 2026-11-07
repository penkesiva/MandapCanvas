import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Images, Sparkles } from "lucide-react";
import { PageShell } from "@/components/SiteChrome";
import { currentUser } from "@/lib/auth";
import { albumsForUser, getCredits } from "@/lib/albums";
import { PLANS, PACKS, formatUSD } from "@/lib/config";
import { eventLabel } from "@/lib/catalog";
import { getCollection } from "@/lib/lookCollections";
import { listCreations, type Creation } from "@/lib/creations";
import type { Album } from "@/lib/types";

export const metadata: Metadata = { title: "My albums", robots: { index: false } };

type Tab = "albums" | "drafts" | "creations";

export default async function Account(props: { searchParams: Promise<{ welcome?: string; billing?: string; tab?: string }> }) {
  const user = await currentUser();
  if (!user) redirect("/signin?next=/account");
  const sp = await props.searchParams;
  const [all, credits, creations] = await Promise.all([albumsForUser(user.id), getCredits(user.id), listCreations(user.id).catch(() => [])]);
  all.sort((a, b) => b.createdAt - a.createdAt);
  const paid = all.filter((a) => a.paid);
  const drafts = all.filter((a) => !a.paid);
  const plan = user.plan ? PLANS[user.plan] : null;
  const tab: Tab = sp.tab === "drafts" || sp.tab === "creations" ? sp.tab : "albums";
  const first = user.name?.trim().split(/\s+/)[0];
  const days = daysUntil(user.weddingDate);
  // A server page renders once per request, so one clock reading for the whole page.
  const now = requestTime();

  const tabs: [Tab, string, number][] = [
    ["albums", "Albums", paid.length],
    ["drafts", "Waiting for checkout", drafts.length],
    ["creations", "Free creations", creations.length],
  ];

  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-4 pb-24 pt-10 sm:px-6">
        {sp.welcome === "pro" ? (
          <p className="mb-6 rounded-2xl bg-[#e8efdc] px-4 py-3 text-mehndi">
            Welcome to {plan?.name ?? "Pro"}. Add your logo in <Link href="/account/profile" className="underline">Profile and settings</Link>, then create your first client proposal.
          </p>
        ) : null}
        {sp.billing === "unavailable" ? (
          <p className="mb-6 rounded-2xl bg-[#fdecee] px-4 py-3 text-kumkum-deep">Billing management isn&apos;t available for this account yet.</p>
        ) : null}

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-[2.4rem]">{first ? `Hi, ${first}` : plan ? "Your studio" : "Your albums"}</h1>
            <p className="mt-1 text-ink-soft">
              {days !== null && days >= 0 ? (
                <span className="mr-2 inline-flex items-center rounded-full bg-[#fbe9d0] px-2.5 py-0.5 text-sm font-semibold text-maroon">
                  {days === 0 ? "The big day is today!" : `${days} ${days === 1 ? "day" : "days"} to the wedding`}
                </span>
              ) : null}
              {plan ? `${plan.name} plan. ` : ""}
              {credits} image credits available.{" "}
              {!user.name || !user.weddingDate ? (
                <Link href="/account/profile" className="font-medium text-kumkum underline underline-offset-2">
                  {days === null ? "Add your wedding date" : "Complete your profile"}
                </Link>
              ) : null}
            </p>
          </div>
          <Link href={plan ? "/create?mode=proposal" : "/create"} className="btn btn-primary max-sm:w-full">
            {plan ? "New client proposal" : "New album"}
          </Link>
        </div>

        <nav className="mt-8 flex gap-1 overflow-x-auto border-b border-line [scrollbar-width:none]" aria-label="Your things">
          {tabs.map(([id, label, n]) => (
            <Link
              key={id}
              href={id === "albums" ? "/account" : `/account?tab=${id}`}
              aria-current={tab === id ? "page" : undefined}
              className={`-mb-px flex flex-none items-center gap-2 border-b-2 px-3 py-2.5 text-[0.95rem] font-medium ${
                tab === id ? "border-kumkum text-ink" : "border-transparent text-ink-soft hover:text-ink"
              }`}
            >
              {label}
              <span className={`rounded-full px-1.5 text-xs font-semibold ${tab === id ? "bg-kumkum text-white" : "bg-silk text-ink-soft"}`}>{n}</span>
            </Link>
          ))}
        </nav>

        {tab === "albums" ? (
          paid.length ? (
            <AlbumGrid albums={paid} />
          ) : (
            <Empty
              title="No albums yet"
              text={drafts.length ? `You have ${drafts.length} waiting for checkout.` : "Start with a free preview. It takes about two minutes."}
              href={drafts.length ? "/account?tab=drafts" : plan ? "/create?mode=proposal" : "/create"}
              cta={drafts.length ? "See them" : plan ? "Create a proposal" : "Make a free preview"}
            />
          )
        ) : null}

        {tab === "drafts" ? (
          drafts.length ? (
            <>
              <p className="mt-5 text-ink-soft">Picked and ready. Finish one to get every image, with no watermark.</p>
              <AlbumGrid albums={drafts} />
            </>
          ) : (
            <Empty title="Nothing waiting" text="Albums and packs you set up but haven't paid for show up here." href="/looks" cta="Try your look free" />
          )
        ) : null}

        {tab === "creations" ? (
          creations.length ? (
            <>
              <p className="mt-5 text-ink-soft">What you made in the free tools in the last 7 days. Pictures are deleted after 7 days, so save the ones you love.</p>
              <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {creations.map((c) => (
                  <CreationCard key={`${c.url}-${c.at}`} c={c} now={now} />
                ))}
              </ul>
            </>
          ) : (
            <Empty title="No free creations yet" text="Bridal looks, art portraits, venue decor and invitation art you make in the free tools are kept here for 7 days." href="/tools" cta="See the free tools" />
          )
        ) : null}

        {!plan ? (
          <div className="mt-16 rounded-[22px] bg-silk p-6">
            <p className="font-semibold">Are you a decorator or planner?</p>
            <p className="mt-1 text-ink-soft">
              Pro gives you {PLANS.pro.monthlyImages} images a month, your logo on proposals and client share links.{" "}
              <Link href="/pro" className="font-medium text-kumkum underline">See Pro</Link>
            </p>
          </div>
        ) : null}
      </div>
    </PageShell>
  );
}

function AlbumGrid({ albums }: { albums: Album[] }) {
  return (
    <ul className="mt-8 grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
      {albums.map((a) => (
        <AlbumCard key={a.id} a={a} />
      ))}
    </ul>
  );
}

function AlbumCard({ a }: { a: Album }) {
  const done = a.shots.filter((s) => s.status === "done" && s.url);
  const pics = (done.length ? done : a.previews.filter((p) => p.url)).slice(0, 3).map((x) => x.url!);
  const count = a.paid ? (a.status === "complete" ? done.length : a.shots.length) : a.previews.filter((p) => p.url).length;
  const countLabel = a.paid ? `${count} ${count === 1 ? "image" : "images"}` : `${count} ${count === 1 ? "preview" : "previews"}`;
  const pack = PACKS[a.packId];
  const packName = pack.name.endsWith("pack") ? pack.name : `${pack.name} pack`;
  const collection = getCollection(a.config.look?.collection);
  const kindLine = a.config.artPack
    ? "Art portraits"
    : collection
      ? collection.name
      : a.config.look
        ? "Wedding looks"
        : a.config.venuePack
          ? "Venue pack"
          : a.config.events.map((e) => eventLabel(e, a.config.tradition)).join(", ");
  return (
    <li className="pt-3">
      <Link href={`/album/${a.id}`} className="group relative block">
        {/* page edges behind the cover, so it reads as an album */}
        <span aria-hidden="true" className="absolute inset-x-6 -top-3 h-8 rounded-t-[18px] border border-[#dcc3b6] bg-[#ead6cb]" />
        <span aria-hidden="true" className="absolute inset-x-3 -top-1.5 h-8 rounded-t-[19px] border border-[#e3cfc4] bg-[#f4e6de]" />
        <span className="relative block overflow-hidden rounded-[20px] border border-line bg-white transition group-hover:border-ink group-hover:shadow-[0_18px_40px_-26px_rgba(42,11,20,0.7)]">
          <span className="relative grid aspect-[4/3] grid-cols-3 grid-rows-2 gap-0.5 bg-white">
            {pics.length ? (
              pics.map((url, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={url} src={url} alt="" loading="lazy" className={`h-full w-full object-cover ${tileClass(pics.length, i)}`} />
              ))
            ) : (
              <span className="col-span-3 row-span-2 bg-gradient-to-br from-silk to-line" />
            )}
            {count ? (
              <span className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">
                <Images size={13} aria-hidden="true" /> {countLabel}
              </span>
            ) : null}
            {!a.paid ? <span className="absolute right-2.5 top-2.5 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-maroon">Draft</span> : null}
          </span>
          <span className="block px-4 py-3">
            <span className="block font-semibold">{a.title}</span>
            <span className="block text-sm text-ink-soft">
              {a.paid
                ? a.status === "complete"
                  ? `${packName}, ${countLabel} included`
                  : `${done.length} of ${a.shots.length} ready`
                : `${packName}, ${pack.images} images`}
              {a.clientName ? `. For ${a.clientName}` : ""}
            </span>
            <span className="mt-0.5 block text-xs text-ink-soft">{kindLine}</span>
            {!a.paid ? (
              <span className="btn btn-primary btn-sm mt-3 w-full">Finish, {formatUSD(pack.priceCents)}</span>
            ) : null}
          </span>
        </span>
      </Link>
    </li>
  );
}

function CreationCard({ c, now }: { c: Creation; now: number }) {
  const left = Math.max(0, 7 - Math.floor((now - c.at) / 86400000));
  return (
    <li className="overflow-hidden rounded-2xl border border-line bg-white">
      <a href={c.url} target="_blank" rel="noreferrer" className="block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={c.url} alt={c.title} loading="lazy" className="aspect-[3/4] w-full object-cover" />
      </a>
      <div className="px-3 py-2.5">
        <p className="truncate text-sm font-semibold">{c.title}</p>
        <p className="text-xs text-ink-soft">{left <= 1 ? "Deleted tomorrow" : `Kept ${left} more days`}</p>
        <div className="mt-2 flex gap-3 text-sm">
          <a href={c.url} download className="font-medium text-kumkum underline underline-offset-2">
            Save
          </a>
          <Link href={c.href} className="inline-flex items-center gap-1 text-ink-soft hover:text-ink">
            <Sparkles size={13} aria-hidden="true" /> Make another
          </Link>
        </div>
      </div>
    </li>
  );
}

function Empty({ title, text, href, cta }: { title: string; text: string; href: string; cta: string }) {
  return (
    <div className="mt-8 rounded-[22px] border border-dashed border-line p-10 text-center">
      <p className="text-lg font-semibold">{title}</p>
      <p className="mt-1 text-ink-soft">{text}</p>
      <Link href={href} className="btn btn-primary mt-6">
        {cta}
      </Link>
    </div>
  );
}

function requestTime(): number {
  return Date.now();
}

/** Whole days from today (Pacific) to a YYYY-MM-DD date, or null. */
function daysUntil(date?: string): number | null {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });
  return Math.round((Date.parse(`${date}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86400000);
}

/** Collage layout: one big picture on the left, up to two stacked on the right. */
function tileClass(count: number, i: number): string {
  if (count === 1) return "col-span-3 row-span-2";
  if (i === 0) return "col-span-2 row-span-2";
  return count === 2 ? "row-span-2" : "";
}
