"use client";

import { useState, useSyncExternalStore } from "react";
import { Check, Copy, X } from "lucide-react";
import { engage as track } from "@/lib/engage";

const noop = () => () => {};

/** A slim offer bar above the header: tap the code to copy it, × hides it for this visitor. */
export function PromoBar({ text, code, endsLabel, id }: { text: string; code: string; endsLabel: string; id: string }) {
  // Hidden on the server and until we know this visitor hasn't closed it.
  const dismissed = useSyncExternalStore(
    noop,
    () => {
      try {
        return localStorage.getItem(`mc:promo:${id}`) === "1";
      } catch {
        return false;
      }
    },
    () => true,
  );
  const [closed, setClosed] = useState(false);
  const [copied, setCopied] = useState(false);
  const hidden = dismissed || closed;

  if (hidden) return null;
  return (
    <div className="no-print relative z-50 bg-[linear-gradient(90deg,#3b0a15,#7a1426_50%,#3b0a15)] px-10 py-2 text-center text-[13px] text-[#fff8ef] sm:text-sm">
      <span className="font-semibold text-gold-light">{text}</span>
      <span className="mx-2 text-white/40 max-sm:hidden" aria-hidden="true">·</span>
      <br className="sm:hidden" />
      <button
        type="button"
        onClick={() => {
          navigator.clipboard?.writeText(code).catch(() => {});
          setCopied(true);
          track("promo_copy", { code });
          setTimeout(() => setCopied(false), 2000);
        }}
        className="inline-flex items-center gap-1 rounded-md border border-dashed border-gold/70 px-1.5 py-0.5 font-semibold tracking-wide text-white hover:bg-white/10"
        aria-label={`Copy the code ${code}`}
      >
        {code} {copied ? <Check size={13} /> : <Copy size={13} />}
      </button>
      {copied || endsLabel ? <span className="ml-2 text-white/75">{copied ? "Copied. Paste it at checkout." : endsLabel}</span> : null}
      <button
        type="button"
        onClick={() => {
          setClosed(true);
          try {
            localStorage.setItem(`mc:promo:${id}`, "1");
          } catch {
            /* fine */
          }
        }}
        aria-label="Hide this offer"
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-white/70 hover:bg-white/10 hover:text-white"
      >
        <X size={15} />
      </button>
    </div>
  );
}
