import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { SITE } from "@/lib/config";

export async function SiteHeader() {
  const user = await currentUser();
  return (
    <header className="no-print sticky top-0 z-40 border-b border-line/70 bg-milk/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Link href="/" className="font-display text-[1.6rem] leading-none text-kumkum" aria-label="MandapCanvas home">
          MandapCanvas
        </Link>
        <nav className="hidden items-center gap-6 text-[0.95rem] font-medium text-ink-soft md:flex" aria-label="Main">
          <Link href="/gallery" className="hover:text-ink">Gallery</Link>
          <Link href="/pricing" className="hover:text-ink">Pricing</Link>
          <Link href="/pro" className="hover:text-ink">For decorators</Link>
          <Link href="/faq" className="hover:text-ink">FAQ</Link>
        </nav>
        <div className="ml-auto flex items-center gap-3">
          {user ? (
            <Link href="/account" className="hidden text-[0.95rem] font-medium text-ink-soft hover:text-ink sm:inline">
              My albums
            </Link>
          ) : (
            <Link href="/signin" className="hidden text-[0.95rem] font-medium text-ink-soft hover:text-ink sm:inline">
              Sign in
            </Link>
          )}
          <Link href="/create" className="btn btn-primary !min-h-10 !px-4 text-[0.95rem]">
            <span className="sm:hidden">Free preview</span>
            <span className="hidden sm:inline">Make a free preview</span>
          </Link>
        </div>
      </div>
      <nav className="flex gap-5 overflow-x-auto px-4 pb-2.5 text-sm font-medium text-ink-soft md:hidden" aria-label="Main mobile">
        <Link href="/gallery">Gallery</Link>
        <Link href="/pricing">Pricing</Link>
        <Link href="/pro">For decorators</Link>
        <Link href="/faq">FAQ</Link>
        <Link href={user ? "/account" : "/signin"}>{user ? "My albums" : "Sign in"}</Link>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="no-print mt-auto border-t border-line bg-silk">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <p className="font-display text-2xl text-kumkum">MandapCanvas</p>
          <p className="mt-2 max-w-xs text-sm text-ink-soft">
            Photo-real previews of Desi weddings in the U.S. — for couples, families and the decorators who make it real.
          </p>
        </div>
        <FooterCol title="Couples" links={[["Make a free preview", "/create"], ["Gallery", "/gallery"], ["Pricing", "/pricing"], ["FAQ", "/faq"]]} />
        <FooterCol title="Decorators" links={[["MandapCanvas Pro", "/pro"], ["Sign in", "/signin"], ["My account", "/account"]]} />
        <FooterCol title="Company" links={[["About", "/about"], ["Terms", "/terms"], ["Privacy", "/privacy"], ["Refunds", "/refunds"]]} />
      </div>
      <div className="border-t border-line">
        <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-ink-soft sm:px-6">
          © {new Date().getFullYear()} OneCreator LLC. Images are AI concept previews; real decor and outfits will vary. Questions:{" "}
          <a className="underline" href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a>
        </p>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <p className="text-sm font-semibold">{title}</p>
      <ul className="mt-3 space-y-2 text-sm text-ink-soft">
        {links.map(([label, href]) => (
          <li key={href}>
            <Link href={href} className="hover:text-ink">{label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </>
  );
}
