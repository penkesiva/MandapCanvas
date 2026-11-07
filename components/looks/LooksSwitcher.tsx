import Link from "next/link";

const LINKS = [
  { href: "/looks", label: "Wedding" },
  { href: "/looks/maharani", label: "Maharani" },
  { href: "/looks/navratri", label: "Navratri" },
] as const;

/** The three Looks collections, one tap apart. */
export function LooksSwitcher({ current }: { current: "/looks" | "/looks/maharani" | "/looks/navratri" }) {
  return (
    <nav aria-label="Looks collections" className="inline-flex rounded-full border border-gold/50 bg-white p-1 text-sm">
      {LINKS.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          aria-current={l.href === current ? "page" : undefined}
          className={`rounded-full px-3.5 py-1.5 font-semibold transition ${l.href === current ? "bg-maroon text-gold-light" : "text-ink-soft hover:text-maroon"}`}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
