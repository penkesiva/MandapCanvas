"use client";

import { readJson } from "@/lib/readJson";
import { useState } from "react";
import Link from "next/link";
import { Loader2, Trash2, Upload } from "lucide-react";

type Item = { id: string; url: string; label: string };

export function InventoryManager({ items, enabled }: { items: Item[]; enabled: boolean }) {
  const [list, setList] = useState(items);
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const add = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    setMsg(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("kind", "inventory");
      const up = await readJson(await fetch("/api/upload", { method: "POST", body: form }));
      if (!up.ok) throw new Error(up.error);
      const res = await readJson(await fetch("/api/account/inventory", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: up.url, label }) }));
      if (!res.ok) throw new Error(res.error);
      setList(res.inventory);
      setLabel("");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    const res = await readJson(await fetch(`/api/account/inventory?id=${id}`, { method: "DELETE" }));
    if (res.ok) setList(res.inventory);
  };

  return (
    <div className="rounded-[22px] border border-line bg-white p-6">
      <h2 className="text-2xl">Your inventory</h2>
      <p className="mt-1 text-sm text-ink-soft">
        Photos of mandaps, floral pieces and fabrics you own. Proposals reuse their style so clients see what you can actually build.
      </p>
      {!enabled ? (
        <p className="mt-5 rounded-2xl bg-silk p-4 text-sm">
          Inventory references are part of the Studio plan. <Link className="font-medium text-kumkum underline" href="/pro">Compare plans</Link>
        </p>
      ) : (
        <>
          <div className="mt-5 flex flex-wrap gap-2">
            <input className="field max-w-xs flex-1" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Label, e.g. Gold round mandap" maxLength={60} />
            <label className="btn btn-ghost cursor-pointer">
              {busy ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />} Add photo
              <input type="file" accept="image/*" className="sr-only" onChange={(e) => add(e.target.files?.[0])} />
            </label>
          </div>
          {msg ? <p className="mt-2 text-sm text-kumkum-deep">{msg}</p> : null}
          <ul className="mt-5 grid grid-cols-3 gap-3">
            {list.map((i) => (
              <li key={i.id} className="group relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={i.url} alt={i.label} className="aspect-square w-full rounded-xl object-cover" />
                <p className="mt-1 truncate text-xs text-ink-soft">{i.label}</p>
                <button type="button" onClick={() => remove(i.id)} aria-label={`Remove ${i.label}`} className="absolute right-1.5 top-1.5 grid h-8 w-8 place-items-center rounded-full bg-white/90 opacity-0 group-hover:opacity-100 focus:opacity-100">
                  <Trash2 size={15} />
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
