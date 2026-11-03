import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PageShell } from "@/components/SiteChrome";
import { getJSON } from "@/lib/kv";
import { getCardTemplate, type SharedCard } from "@/lib/weddingCards";

async function load(id: string): Promise<SharedCard | null> {
  if (!/^[\w-]{6,16}$/.test(id)) return null;
  return getJSON<SharedCard>(`card:${id}`);
}

export async function generateMetadata(props: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const card = await load((await props.params).id);
  if (!card) return { title: "Invitation not found" };
  return {
    title: "You're invited",
    description: "A wedding invitation made with MandapCanvas.",
    robots: { index: false },
    openGraph: card.url.startsWith("http") ? { title: "You're invited", images: [{ url: card.url }] } : undefined,
    twitter: { card: "summary_large_image", title: "You're invited" },
  };
}

/** A shared invitation: the card, a download, and a way to make your own. */
export default async function SharedCardPage(props: { params: Promise<{ id: string }> }) {
  const card = await load((await props.params).id);
  if (!card) notFound();
  const t = getCardTemplate(card.template);
  return (
    <PageShell>
      <div className="mx-auto flex max-w-xl flex-col items-center px-4 pb-20 pt-8 sm:px-6">
        <h1 className="text-center text-[2.2rem] text-maroon">You&apos;re invited</h1>
        <div className="frame-gold mt-6 w-full overflow-hidden rounded-[22px] bg-white p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={card.url} alt="Wedding invitation" className="block h-auto w-full rounded-xl" />
        </div>
        <a href={card.url} download="wedding-invitation.jpg" className="btn btn-ghost btn-sm mt-4">
          Save the invitation
        </a>
        <div className="mt-10 w-full rounded-[22px] bg-maroon p-6 text-center text-[#fff8ef]">
          <p className="font-display text-2xl text-gold-light">Planning a wedding too?</p>
          <p className="mt-1 text-sm text-[#f3e3d3]">Make an invitation like this one, in the {t.name} style or 12 others. Try for free.</p>
          <Link href="/tools/wedding-invitation-maker" className="btn btn-gold mt-4">
            Make my invitation
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
