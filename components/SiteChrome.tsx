import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { FOUNDING_OFFER, SITE } from "@/lib/config";
import { SignupNudge } from "./SignupNudge";

export async function SiteHeader() {
  const user = await currentUser();
  return (
    <>
    <header className="no-print sticky top-0 z-40 border-b border-gold/40 bg-milk/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-display text-[1.6rem] leading-none text-kumkum" aria-label="MandapCanvas home">
          <Logo />
          MandapCanvas
        </Link>
        <nav className="hidden items-center gap-6 text-[0.95rem] font-medium text-ink-soft md:flex" aria-label="Main">
          <Link href="/looks" className="hover:text-ink">Bridal looks</Link>
          <Link href="/mandap" className="hover:text-ink">Mandap designs</Link>
          <Link href="/tools" className="hover:text-ink">Free tools</Link>
          <Link href="/pricing" className="hover:text-ink">Pricing</Link>
          <Link href="/pro" className="hover:text-ink">For decorators</Link>
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
          <Link href="/looks" className="btn btn-primary btn-sm">
            <span className="sm:hidden">Try free</span>
            <span className="hidden sm:inline">Try your look free</span>
          </Link>
        </div>
      </div>
      <nav className="flex gap-4 overflow-x-auto whitespace-nowrap px-4 pb-2.5 text-sm font-medium text-ink-soft [scrollbar-width:none] md:hidden" aria-label="Main mobile">
        <Link href="/looks">Bridal looks</Link>
        <Link href="/mandap">Mandap designs</Link>
        <Link href="/tools">Free tools</Link>
        <Link href="/pricing">Pricing</Link>
        <Link href="/pro">Decorators</Link>
        <Link href={user ? "/account" : "/signin"}>{user ? "My albums" : "Sign in"}</Link>
      </nav>
    </header>
    <SignupNudge signedIn={!!user} offer={FOUNDING_OFFER} />
    </>
  );
}

export function SiteFooter() {
  return (
    <footer className="no-print relative mt-auto overflow-hidden bg-maroon text-[#f3e3d3]">
      <div className="bg-jaali-dark absolute inset-0" aria-hidden="true" />
      <div className="toran relative" aria-hidden="true" />
      <div className="relative mx-auto grid max-w-6xl grid-cols-2 gap-x-6 gap-y-8 px-4 py-10 sm:px-6 sm:py-12 md:grid-cols-[1.4fr_1fr_1fr_1fr_1fr] md:gap-10">
        <div className="col-span-2 md:col-span-1">
          <p className="flex items-center gap-2 font-display text-2xl text-gold-light">
            <Logo light />
            MandapCanvas
          </p>
          <p className="mt-3 max-w-xs text-sm">
            See your Desi wedding before it happens: your looks, your mandap, every event.
          </p>
        </div>
        <FooterCol title="Couples" links={[["Bridal looks", "/looks"], ["Maharani portraits", "/looks/maharani"], ["Navratri portraits", "/looks/navratri"], ["Mandap designs", "/mandap"], ["Gallery", "/gallery"], ["Pricing", "/pricing"], ["FAQ", "/faq"]]} />
        <FooterCol title="Free tools" links={[["All free tools", "/tools"], ["Venue decor visualizer", "/tools/ai-venue-decor-visualizer"], ["Invitation maker", "/tools/wedding-invitation-maker"], ["Palette from a photo", "/tools/outfit-photo-color-palette"], ["Palette finder", "/tools/wedding-color-palette-finder"], ["Outfit color matcher", "/tools/outfit-color-matcher"], ["Hashtag generator", "/tools/wedding-hashtag-generator"]]} />
        <FooterCol title="Decorators" links={[["MandapCanvas Pro", "/pro"], ["Sign in", "/signin"]]} />
        <FooterCol title="Company" links={[["About", "/about"], ["Terms", "/terms"], ["Privacy", "/privacy"], ["Refunds", "/refunds"]]} />
      </div>
      <div className="relative border-t border-gold-light/20">
        <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-[#e6cfc0] sm:px-6">
          © {new Date().getFullYear()} OneCreator LLC. Images are AI concept previews; real decor and outfits will vary. People in our examples are AI models, not customers. Questions:{" "}
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
