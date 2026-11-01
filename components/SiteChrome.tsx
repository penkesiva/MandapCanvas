import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { SITE } from "@/lib/config";

export async function SiteHeader() {
  const user = await currentUser();
  return (
    <header className="no-print sticky top-0 z-40 border-b border-gold/40 bg-milk/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-display text-[1.6rem] leading-none text-kumkum" aria-label="MandapCanvas home">
          <Logo />
          MandapCanvas
        </Link>
        <nav className="hidden items-center gap-6 text-[0.95rem] font-medium text-ink-soft md:flex" aria-label="Main">
          <Link href="/gallery" className="hover:text-ink">Gallery</Link>
          <Link href="/pricing" className="hover:text-ink">Pricing</Link>
          <Link href="/pro" className="hover:text-ink">For decorators</Link>
          <Link href="/tools" className="hover:text-ink">Free tools</Link>
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
          <Link href="/create" className="btn btn-primary btn-sm">
            <span className="sm:hidden">Free preview</span>
            <span className="hidden sm:inline">Make a free preview</span>
          </Link>
        </div>
      </div>
      <nav className="flex gap-5 overflow-x-auto px-4 pb-2.5 text-sm font-medium text-ink-soft md:hidden" aria-label="Main mobile">
        <Link href="/gallery">Gallery</Link>
        <Link href="/pricing">Pricing</Link>
        <Link href="/pro">For decorators</Link>
        <Link href="/tools">Free tools</Link>
        <Link href="/faq">FAQ</Link>
        <Link href={user ? "/account" : "/signin"}>{user ? "My albums" : "Sign in"}</Link>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="no-print relative mt-auto overflow-hidden bg-maroon text-[#f3e3d3]">
      <div className="bg-jaali-dark absolute inset-0" aria-hidden="true" />
      <div className="toran relative" aria-hidden="true" />
      <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 sm:grid-cols-2 md:grid-cols-[1.4fr_1fr_1fr_1fr_1fr]">
        <div>
          <p className="flex items-center gap-2 font-display text-2xl text-gold-light">
            <Logo light />
            MandapCanvas
          </p>
          <p className="mt-3 max-w-xs text-sm">
            Photo-real previews of Desi weddings in the U.S. — for couples, families and the decorators who make it real.
          </p>
        </div>
        <FooterCol title="Couples" links={[["Make a free preview", "/create"], ["Gallery", "/gallery"], ["Pricing", "/pricing"], ["FAQ", "/faq"]]} />
        <FooterCol title="Free tools" links={[["All free tools", "/tools"], ["Palette from your outfit photo", "/tools/outfit-photo-color-palette"], ["Color palette finder", "/tools/wedding-color-palette-finder"], ["Outfit color matcher", "/tools/outfit-color-matcher"], ["Wedding hashtag generator", "/tools/wedding-hashtag-generator"]]} />
        <FooterCol title="Decorators" links={[["MandapCanvas Pro", "/pro"], ["Sign in", "/signin"], ["My account", "/account"]]} />
        <FooterCol title="Company" links={[["About", "/about"], ["Terms", "/terms"], ["Privacy", "/privacy"], ["Refunds", "/refunds"]]} />
      </div>
      <div className="relative border-t border-gold-light/20">
        <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-[#e6cfc0] sm:px-6">
          © {new Date().getFullYear()} OneCreator LLC. Images are AI concept previews; real decor and outfits will vary. Questions:{" "}
          <a className="underline hover:text-white" href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a>
        </p>
      </div>
    </footer>
  );
}

/** A small mandap mark: four pillars under a domed canopy. */
function Logo({ light = false }: { light?: boolean }) {
  const c = light ? "#ecd08a" : "#9e1b32";
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M4 12c3-7 21-7 24 0" stroke={c} strokeWidth="2" strokeLinecap="round" />
      <path d="M16 3v3" stroke={c} strokeWidth="2" strokeLinecap="round" />
      <circle cx="16" cy="2.5" r="1.5" fill="#e9a23b" />
      <path d="M3 12h26M6 12v15M12 12v15M20 12v15M26 12v15M2 28h28" stroke={c} strokeWidth="2" strokeLinecap="round" />
      <circle cx="9" cy="16" r="1.6" fill="#e9a23b" />
      <circle cx="23" cy="16" r="1.6" fill="#e9a23b" />
    </svg>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <p className="font-display text-lg text-gold-light">{title}</p>
      <ul className="mt-3 space-y-2 text-sm">
        {links.map(([label, href]) => (
          <li key={href}>
            <Link href={href} className="hover:text-white hover:underline">{label}</Link>
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
      <div className="toran no-print pointer-events-none" aria-hidden="true" />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </>
  );
}
