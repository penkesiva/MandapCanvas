"use client";

import { readJson } from "@/lib/readJson";
import { useState } from "react";
import { Loader2, MailCheck } from "lucide-react";

export function SignInForm({ next }: { next?: string }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [devLink, setDevLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, next }),
      });
      const data = await readJson(res);
      if (!res.ok || !data.ok) throw new Error(data.error || "Couldn't send the email.");
      setSent(true);
      setDevLink(data.devLink ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't send the email.");
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <div className="mt-8 rounded-2xl border border-line bg-white p-6">
        <MailCheck className="text-mehndi" />
        <p className="mt-3 text-lg font-semibold">Check your email</p>
        <p className="mt-1 text-ink-soft">We sent a sign-in link to {email}. It works for 30 minutes.</p>
        {devLink ? (
          <p className="mt-4 text-sm">
            Development mode, no email provider set up:{" "}
            <a className="font-semibold text-kumkum underline" href={devLink}>
              open the sign-in link
            </a>
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-8 space-y-4">
      <label className="block">
        <span className="mb-1.5 block font-semibold">Email</span>
        <input className="field" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
      </label>
      {error ? <p role="alert" className="text-kumkum-deep">{error}</p> : null}
      <button type="submit" className="btn btn-primary w-full" disabled={busy}>
        {busy ? <Loader2 size={18} className="animate-spin" /> : null}
        Email me a sign-in link
      </button>
    </form>
  );
}
