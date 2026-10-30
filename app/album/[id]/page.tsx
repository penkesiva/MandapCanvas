import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/SiteChrome";
import { AlbumView } from "@/components/album/AlbumView";
import { anonId, currentUser } from "@/lib/auth";
import { canEdit, getAlbum, getCredits, publicAlbum } from "@/lib/albums";
import { kv } from "@/lib/kv";

export const metadata: Metadata = { title: "Your album", robots: { index: false } };

export default async function AlbumPage(props: { params: Promise<{ id: string }>; searchParams: Promise<{ welcome?: string }> }) {
  const { id } = await props.params;
  const sp = await props.searchParams;
  const [album, user, anon] = await Promise.all([getAlbum(id), currentUser(), anonId(false)]);

  if (!album || !canEdit(album, user, anon)) {
    return (
      <PageShell>
        <div className="mx-auto max-w-xl px-4 py-24 text-center sm:px-6">
          <h1 className="text-[2.2rem]">This album is private</h1>
          <p className="mt-3 text-ink-soft">
            {user ? "This album belongs to a different account." : "Sign in with the email you used at checkout to open it."}
          </p>
          {!user ? (
            <Link href={`/signin?next=/album/${id}`} className="btn btn-primary mt-8">Sign in</Link>
          ) : (
            <Link href="/account" className="btn btn-ghost mt-8">Go to my albums</Link>
          )}
        </div>
      </PageShell>
    );
  }

  const votesRaw = await kv().hgetall(`votes:${album.id}`);
  const votes = Object.fromEntries(Object.entries(votesRaw).map(([k, v]) => [k, Number(v)]));
  return (
    <PageShell>
      <AlbumView
        initial={publicAlbum(album)}
        votes={votes}
        credits={user ? await getCredits(user.id) : null}
        signedIn={!!user}
        welcome={sp.welcome === "1"}
      />
    </PageShell>
  );
}
