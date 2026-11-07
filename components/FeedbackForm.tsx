"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { engage as track } from "@/lib/engage";

const RATINGS = [
  { v: "😍", label: "Love it" },
  { v: "😐", label: "It's OK" },
  { v: "😕", label: "Confusing" },
];

/** The shared form for the floating Feedback button and the /contact page. */
export function FeedbackForm({ kind, onDone, autoFocus = false }: { kind: "feedback" | "contact"; onDone?: () => void; autoFocus?: boolean }) {
  const page = usePathname() || "/";
  const [rating, setRating] = useState("");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind, rating, message, email, page, website }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't send. Try again.");
      setSent(true);
      track(kind === "contact" ? "contact_sent" : "feedback_sent", { rating, page });
      if (onDone) setTimeout(onDone, 1800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't send. Try again.");
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <p className="flex items-center gap-2 py-6 text-center font-semibold text-mehndi" role="status">
        <Check size={18} /> Thank you! {email ? "We'll reply by email." : "We read every note."}
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      {kind === "feedback" ? (
        <div className="flex gap-2" role="radiogroup" aria-label="How is it so far?">
          {RATINGS.map((r) => (
            <button
              key={r.v}
              type="button"
              role="radio"
              aria-checked={rating === r.v}
              onClick={() => setRating(rating === r.v ? "" : r.v)}
              className={`flex flex-1 flex-col items-center rounded-xl border-2 py-1.5 text-xs transition ${rating === r.v ? "border-kumkum bg-[#fbf1ee]" : "border-line hover:border-gold"}`}
            >
              <span className="text-xl" aria-hidden="true">
                {r.v}
              </span>
              {r.label}
            </button>
          ))}
        </div>
      ) : null}
      <label className="block">
        <span className="sr-only">{kind === "contact" ? "Your message" : "Your feedback"}</span>
        <textarea
          className="field min-h-24"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={kind === "contact" ? "How can we help? Include your album link for order questions." : "What did you like? What was confusing or broken?"}
          maxLength={2000}
          required
          autoFocus={autoFocus}
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm text-ink-soft">{kind === "contact" ? "Your email, so we can reply" : "Email, if you'd like a reply (optional)"}</span>
        <input className="field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required={kind === "contact"} />
      </label>
      {/* Spam trap: hidden from people, filled in by bots. */}
      <input type="text" name="website" value={website} onChange={(e) => setWebsite(e.target.value)} tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      {error ? (
        <p role="alert" className="text-sm text-kumkum-deep">
          {error}
        </p>
      ) : null}
      <button type="submit" className="btn btn-primary btn-sm w-full" disabled={busy}>
        {busy ? <Loader2 size={16} className="animate-spin" /> : null} {kind === "contact" ? "Send message" : "Send feedback"}
      </button>
    </form>
  );
}
