"use client";

import { useRef, useState } from "react";
import { Loader2, Lock } from "lucide-react";
import { useRouter } from "next/navigation";

/** Six boxes for the album's code. Pasting or typing the full code submits it. */
export function SharePinGate({ token, accent }: { token: string; accent: string }) {
  const router = useRouter();
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const boxes = useRef<(HTMLInputElement | null)[]>([]);

  async function submit(code: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/share/${token}/unlock`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ pin: code }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "That code doesn't match.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "That code doesn't match.");
      setDigits(Array(6).fill(""));
      boxes.current[0]?.focus();
      setBusy(false);
    }
  }

  function put(i: number, value: string) {
    const clean = value.replace(/\D/g, "");
    if (!clean) {
      setDigits((d) => d.map((x, j) => (j === i ? "" : x)));
      return;
    }
    const next = [...digits];
    for (let k = 0; k < clean.length && i + k < 6; k++) next[i + k] = clean[k];
    setDigits(next);
    const filled = next.join("");
    if (filled.length === 6) submit(filled);
    else boxes.current[Math.min(5, i + clean.length)]?.focus();
  }

  return (
    <div className="mx-auto max-w-md rounded-[26px] border border-gold/50 bg-white p-7 text-center shadow-[0_30px_60px_-44px_rgba(74,13,26,0.6)] sm:p-9">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-silk" style={{ color: accent }}>
        <Lock size={22} />
      </span>
      <h1 className="mt-4 text-[1.9rem]">A private album</h1>
      <p className="mt-1 text-ink-soft">Enter the 6-digit code you were sent with this link.</p>
      <form
        className="mt-6 flex justify-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (digits.join("").length === 6) submit(digits.join(""));
        }}
      >
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              boxes.current[i] = el;
            }}
            value={d}
            onChange={(e) => put(i, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Backspace" && !digits[i] && i > 0) boxes.current[i - 1]?.focus();
            }}
            onPaste={(e) => {
              e.preventDefault();
              put(i, e.clipboardData.getData("text"));
            }}
            inputMode="numeric"
            autoComplete={i === 0 ? "one-time-code" : "off"}
            maxLength={6}
            aria-label={`Digit ${i + 1}`}
            autoFocus={i === 0}
            disabled={busy}
            className="h-14 w-11 rounded-xl border-2 border-line bg-silk text-center text-2xl font-semibold tabular-nums text-ink focus:border-kumkum focus:outline-none sm:w-12"
          />
        ))}
      </form>
      <div className="mt-4 min-h-6 text-sm" aria-live="polite">
        {busy ? (
          <span className="inline-flex items-center gap-2 text-ink-soft">
            <Loader2 size={16} className="animate-spin" /> Opening…
          </span>
        ) : error ? (
          <span className="font-semibold text-kumkum-deep">{error}</span>
        ) : null}
      </div>
      <p className="mt-2 text-xs text-ink-soft">Don&apos;t have it? Ask the person who sent you the link.</p>
    </div>
  );
}
