"use client";

import { readJson } from "@/lib/readJson";
import { useState } from "react";
import { Loader2 } from "lucide-react";

export function DevCheckoutForm({ params, defaultEmail }: { params: Record<string, string>; defaultEmail: string }) {
  const [email, setEmail] = useState(defaultEmail);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/checkout/dev", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...params, email }),
    });
    const data = await readJson(res);
    if (!res.ok || !data.ok) {
      setBusy(false);
      return setError(data.error || "Test checkout failed.");
    }
    window.location.href = data.redirect;
  };
  return (
    <form onSubmit={submit} className="mt-8 space-y-4">
      <label className="block">
        <span className="mb-1.5 block font-semibold">Email for receipts and sign-in</span>
        <input className="field" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
      </label>
      {error ? <p role="alert" className="text-kumkum-deep">{error}</p> : null}
      <button className="btn btn-primary w-full" disabled={busy}>
        {busy ? <Loader2 size={18} className="animate-spin" /> : null}
        Complete test purchase
      </button>
    </form>
  );
}
