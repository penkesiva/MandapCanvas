"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { MessageCircleHeart, X } from "lucide-react";
import { FeedbackForm } from "./FeedbackForm";

/** A small "Feedback" tab on every page that opens a short form. */
export function FeedbackButton() {
  const path = usePathname() || "";
  // Remember which page the box was opened on, so it closes by itself after navigating.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === path;
  const setOpen = (v: boolean) => {
    setOpenOn(v ? path : null);
    if (v) {
      // Once someone opens it, stop nudging them (this visit and later ones).
      try {
        localStorage.setItem("mc:feedback:seen", "1");
      } catch {}
      setNudge(false);
    }
  };

  // An occasional wiggle to say "tell us": first after ~30s, then every 45s, at most 3 times a page.
  const [nudge, setNudge] = useState(false);
  useEffect(() => {
    let seen = false;
    try {
      seen = localStorage.getItem("mc:feedback:seen") === "1";
    } catch {}
    if (seen || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    let count = 0;
    let off: number | undefined;
    const ping = () => {
      if (document.hidden) return;
      count += 1;
      setNudge(true);
      off = window.setTimeout(() => setNudge(false), 1300);
      if (count >= 3) window.clearInterval(every);
    };
    let every: number | undefined;
    const first = window.setTimeout(() => {
      ping();
      every = window.setInterval(ping, 45000);
    }, 30000);
    return () => {
      window.clearTimeout(first);
      window.clearTimeout(off);
      window.clearInterval(every);
    };
  }, [path]);
  if (path.startsWith("/admin") || path.startsWith("/contact")) return null;

  return (
    <div className="no-print fixed bottom-3 left-3 z-40 sm:bottom-5 sm:left-5">
      {open ? (
        <div className="pop-in w-[calc(100vw-1.5rem)] max-w-sm rounded-[22px] border border-gold/50 bg-white p-4 shadow-[0_30px_70px_-30px_rgba(74,13,26,0.7)]" role="dialog" aria-label="Send feedback">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <p className="font-display text-xl text-maroon">How is it so far?</p>
              <p className="text-sm text-ink-soft">We&apos;re new. Every note helps.</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="rounded-full p-1 text-ink-soft hover:bg-silk" aria-label="Close">
              <X size={18} />
            </button>
          </div>
          <FeedbackForm kind="feedback" autoFocus onDone={() => setOpen(false)} />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`flex items-center gap-1.5 rounded-full border border-gold/60 bg-white/95 px-3 py-1.5 text-sm font-semibold text-maroon shadow-md backdrop-blur hover:border-kumkum ${nudge ? "mc-nudge" : ""}`}
        >
          <MessageCircleHeart size={16} /> Feedback
        </button>
      )}
    </div>
  );
}
