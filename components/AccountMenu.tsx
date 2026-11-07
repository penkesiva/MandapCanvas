"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Images, LogOut, Settings, ShieldCheck, ShoppingBag, Sparkles } from "lucide-react";

/** The signed-in badge in the header: their initial, a count of drafts waiting for checkout, and a menu. */
export function AccountMenu({ label, email, drafts, admin }: { label: string; email: string; drafts: number; admin: boolean }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const initial = (label.trim()[0] ?? "?").toUpperCase();
  const item = "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[0.95rem] text-ink hover:bg-silk";

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Your account${drafts ? `, ${drafts} waiting for checkout` : ""}`}
        className="relative flex h-10 w-10 items-center justify-center rounded-full bg-maroon font-display text-lg text-gold-light ring-2 ring-gold/60 transition hover:ring-gold"
      >
        {initial}
        {drafts ? (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-kumkum px-1 text-[11px] font-semibold leading-none text-white ring-2 ring-milk">
            {drafts > 9 ? "9+" : drafts}
          </span>
        ) : null}
      </button>
      {open ? (
        <div role="menu" className="pop-in absolute right-0 top-12 z-50 w-72 rounded-2xl border border-gold/40 bg-white p-2 shadow-[0_24px_50px_-24px_rgba(42,11,20,0.6)]">
          <div className="border-b border-line px-3 pb-2.5 pt-1.5">
            <p className="truncate font-semibold">{label}</p>
            {label !== email ? <p className="truncate text-xs text-ink-soft">{email}</p> : null}
          </div>
          <div className="pt-1.5">
            <Link role="menuitem" href="/account" className={item} onClick={() => setOpen(false)}>
              <Images size={18} className="text-kumkum" /> My albums
            </Link>
            <Link role="menuitem" href="/account?tab=drafts" className={item} onClick={() => setOpen(false)}>
              <ShoppingBag size={18} className="text-kumkum" /> Waiting for checkout
              {drafts ? <span className="ml-auto rounded-full bg-kumkum px-2 py-0.5 text-xs font-semibold text-white">{drafts}</span> : null}
            </Link>
            <Link role="menuitem" href="/account?tab=creations" className={item} onClick={() => setOpen(false)}>
              <Sparkles size={18} className="text-kumkum" /> Free creations
            </Link>
            <Link role="menuitem" href="/account/profile" className={item} onClick={() => setOpen(false)}>
              <Settings size={18} className="text-kumkum" /> Profile and settings
            </Link>
            {admin ? (
              <Link role="menuitem" href="/admin" className={item} onClick={() => setOpen(false)}>
                <ShieldCheck size={18} className="text-kumkum" /> Admin
              </Link>
            ) : null}
          </div>
          <form action="/api/auth/signout" method="post" className="mt-1.5 border-t border-line pt-1.5">
            <button role="menuitem" className={`${item} w-full text-ink-soft`}>
              <LogOut size={18} /> Sign out
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
