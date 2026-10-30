"use client";

import { readJson } from "@/lib/readJson";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import type { Brand } from "@/lib/types";

export function BrandSettings({ brand }: { brand: Brand | null }) {
  const [b, setB] = useState<Brand>(brand ?? { businessName: "", accent: "#9E1B32" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const uploadLogo = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    const form = new FormData();
    form.append("file", file);
    form.append("kind", "logo");
    const res = await fetch("/api/upload", { method: "POST", body: form });
    const data = await readJson(res);
    setBusy(false);
    if (data.ok) setB((x) => ({ ...x, logoUrl: data.url }));
    else setMsg(data.error ?? "Upload failed.");
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/account/brand", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) });
    const data = await readJson(res);
    setBusy(false);
    setMsg(data.ok ? "Saved. New proposals will use this branding." : data.error ?? "Couldn't save.");
  };

  return (
    <form onSubmit={save} className="rounded-[22px] border border-line bg-white p-6">
      <h2 className="text-2xl">Your branding</h2>
      <p className="mt-1 text-sm text-ink-soft">Shown on client share links and PDF proposals.</p>
      <div className="mt-5 flex items-center gap-4">
        <label className="relative grid h-16 w-16 flex-none cursor-pointer place-items-center overflow-hidden rounded-full border border-line bg-silk text-xs text-ink-soft">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {b.logoUrl ? <img src={b.logoUrl} alt="Your logo" className="h-full w-full object-cover" /> : "Logo"}
          <input type="file" accept="image/*" className="sr-only" onChange={(e) => uploadLogo(e.target.files?.[0])} />
        </label>
        <label className="flex-1">
          <span className="mb-1 block text-sm font-semibold">Business name</span>
          <input className="field" required value={b.businessName} onChange={(e) => setB({ ...b, businessName: e.target.value })} placeholder="Marigold & Co. Decor" />
        </label>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-[auto_1fr_1fr]">
        <label>
          <span className="mb-1 block text-sm font-semibold">Accent</span>
          <input type="color" className="h-[2.875rem] w-16 cursor-pointer rounded-xl border border-line bg-white" value={b.accent} onChange={(e) => setB({ ...b, accent: e.target.value })} />
        </label>
        <label>
          <span className="mb-1 block text-sm font-semibold">Website</span>
          <input className="field" value={b.website ?? ""} onChange={(e) => setB({ ...b, website: e.target.value })} placeholder="marigoldco.com" />
        </label>
        <label>
          <span className="mb-1 block text-sm font-semibold">Phone</span>
          <input className="field" value={b.phone ?? ""} onChange={(e) => setB({ ...b, phone: e.target.value })} placeholder="(925) 555-0100" />
        </label>
      </div>
      <div className="mt-5 flex items-center gap-3">
        <button className="btn btn-primary" disabled={busy}>
          {busy ? <Loader2 size={18} className="animate-spin" /> : null} Save branding
        </button>
        {msg ? <p className="text-sm text-ink-soft" aria-live="polite">{msg}</p> : null}
      </div>
    </form>
  );
}
