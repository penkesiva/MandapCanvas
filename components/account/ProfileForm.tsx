"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

/** Name and wedding date. The date powers the countdown on My albums. */
export function ProfileForm({ name: initialName, weddingDate: initialDate }: { name: string; weddingDate: string }) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [weddingDate, setWeddingDate] = useState(initialDate);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/account/profile", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, weddingDate }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Couldn't save. Try again.");
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
      <label className="block">
        <span className="text-sm font-semibold">Your name</span>
        <input className="field mt-1.5" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Priya" maxLength={60} autoComplete="given-name" />
      </label>
      <label className="block">
        <span className="text-sm font-semibold">Wedding date</span>
        <input className="field mt-1.5" type="date" value={weddingDate} onChange={(e) => setWeddingDate(e.target.value)} />
      </label>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <button className="btn btn-primary btn-sm" disabled={busy}>
          {busy ? <Loader2 size={16} className="animate-spin" /> : null} Save
        </button>
        {saved ? (
          <span className="flex items-center gap-1 text-sm font-medium text-mehndi" role="status">
            <Check size={16} /> Saved
          </span>
        ) : null}
        {error ? (
          <span className="text-sm font-semibold text-kumkum-deep" role="alert">
            {error}
          </span>
        ) : null}
      </div>
    </form>
  );
}
