"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { track } from "@vercel/analytics";
import { Check, X } from "lucide-react";
import { Bride, Groom } from "./tools/Figures";

const KEY = "mc:nudge:v1";
const SKIP = ["/create", "/album", "/checkout", "/signin", "/account", "/admin", "/s/", "/pro/"];
const SNOOZE_MS = 7 * 86400000;

type State = { seconds: number; pages: string[]; engaged: number; snoozeUntil: number; done: boolean };

function load(): State {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || "null");
    if (s && typeof s === "object") return { seconds: 0, pages: [], engaged: 0, snoozeUntil: 0, done: false, ...s };
  } catch {
    /* storage blocked */
  }
  return { seconds: 0, pages: [], engaged: 0, snoozeUntil: 0, done: false };
}
function save(s: State) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...s, pages: s.pages.slice(-20) }));
  } catch {
    /* storage blocked */
  }
}
function ready(s: State) {
  if (s.done || Date.now() < s.snoozeUntil) return false;
  return (s.seconds >= 75 && s.pages.length >= 2) || s.engaged >= 3 || s.seconds >= 150;
}

/** After someone has spent real time on the site, invite them to save their ideas with a free account. */
export function SignupNudge({ signedIn, offer }: { signedIn: boolean; offer: { active: boolean; code: string; text: string } }) {
  const path = usePathname() || "/";
  const skip = signedIn || SKIP.some((p) => path.startsWith(p));
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [msg, setMsg] = useState("");
  const shown = useRef(false);

  useEffect(() => {
    if (skip) return;
    const s = load();
    if (!s.pages.includes(path)) s.pages.push(path);
    save(s);
    const check = (st: State) => {
      // A tool's own "one more free try" card is already asking; don't stack a second sign-up prompt on it.
      if (document.querySelector("[data-signup-card]")) return;
      if (!shown.current && ready(st)) {
        shown.current = true;
        setOpen(true);
        track("nudge_shown", { path });
      }
    };
    check(s);
    const tick = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      const st = load();
      st.seconds += 5;
      save(st);
      check(st);
    }, 5000);
    const onEngage = () => {
      const st = load();
      st.engaged += 1;
      save(st);
      // Wait for the tool to render its result (and any sign-up card) before deciding.
      window.setTimeout(() => check(load()), 400);
    };
    window.addEventListener("mc:engaged", onEngage);
    return () => {
      clearInterval(tick);
      window.removeEventListener("mc:engaged", onEngage);
    };
  }, [path, skip]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && dismiss();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (skip || !open) return null;

  function dismiss() {
    const st = load();
    st.snoozeUntil = Date.now() + SNOOZE_MS;
    save(st);
    setOpen(false);
    track("nudge_dismissed", { path });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/auth/request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, next: "/account", source: "nudge" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Couldn't send the email. Try again.");
      const st = load();
      st.done = true;
      save(st);
      setStatus("sent");
      track("nudge_signup", { path });
      if (data.devLink) console.log("[dev] sign-in link:", data.devLink);
    } catch (err) {
      setStatus("error");
      setMsg(err instanceof Error ? err.message : "Couldn't send the email. Try again.");
    }
  }

  return (
    <aside
      role="dialog"
      aria-labelledby="nudge-title"
      className="no-print pop-in fixed inset-x-3 bottom-3 z-50 overflow-hidden rounded-[22px] border border-gold/50 bg-white shadow-[0_30px_70px_-30px_rgba(74,13,26,0.7)] sm:inset-x-auto sm:bottom-5 sm:right-5 sm:w-[380px]"
    >
      <div className="relative flex items-end gap-1 bg-maroon px-5 pt-4 text-[#fff8ef]">
        <div className="flex flex-none items-end" aria-hidden="true">
          <Groom outfit="#F6EFE2" safa="#B3131B" className="-mr-5 h-24 w-12" />
          <Bride outfit="#B3131B" dupatta="#C2185B" className="h-24 w-12" />
        </div>
        <div className="min-w-0 pb-3 pl-2">
          <p id="nudge-title" className="font-display text-xl leading-tight text-gold-light">
            Planning your wedding?
          </p>
          <p className="text-sm text-[#f3e3d3]">Save your palettes and previews in one place.</p>
        </div>
        <button type="button" onClick={dismiss} className="absolute right-2.5 top-2.5 rounded-full p-1.5 text-[#f3e3d3] hover:bg-white/10" aria-label="Not now">
          <X size={18} />
        </button>
      </div>
      <div className="p-5">
        {status === "sent" ? (
          <p className="flex gap-2 text-[0.95rem]">
            <Check size={20} className="mt-0.5 flex-none text-mehndi" />
            <span>
              Check your inbox for a sign-in link. Your code <strong>{offer.code}</strong> is in the email too.
            </span>
          </p>
        ) : (
          <>
            <ul className="space-y-1 text-[0.95rem]">
              <li>✓ A free account, no password</li>
              {offer.active ? (
                <li>
                  ✓ <strong>{offer.text}</strong> as a founding couple
                </li>
              ) : null}
              <li>✓ Your two free previews, saved</li>
            </ul>
            <form onSubmit={submit} className="mt-4 flex flex-col gap-2 sm:flex-row">
              <label htmlFor="nudge-email" className="sr-only">
                Email
              </label>
              <input
                id="nudge-email"
                type="email"
                required
                className="field min-w-0 flex-1"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
              <button type="submit" className="btn btn-primary btn-sm flex-none" disabled={status === "sending"}>
                {status === "sending" ? "Sending…" : "Create account"}
              </button>
            </form>
            {status === "error" ? <p className="mt-2 text-sm text-kumkum-deep">{msg}</p> : null}
            <button type="button" onClick={dismiss} className="mt-3 text-sm text-ink-soft underline-offset-2 hover:underline">
              Not now
            </button>
          </>
        )}
      </div>
    </aside>
  );
}
