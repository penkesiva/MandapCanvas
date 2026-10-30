"use client";

import { readJson } from "@/lib/readJson";
import { useEffect, useState } from "react";
import { Heart } from "lucide-react";

type SharedShot = { id: string; url: string; caption: string; votes: number; portrait: boolean };

export function SharedGrid({ token, shots }: { token: string; shots: SharedShot[] }) {
  const [counts, setCounts] = useState<Record<string, number>>(() => Object.fromEntries(shots.map((s) => [s.id, s.votes])));
  const [mine, setMine] = useState<Record<string, boolean>>({});

  // Restore this device's hearts after hydration (per-browser convenience only).
  useEffect(() => {
    queueMicrotask(() => {
      try {
        setMine(JSON.parse(localStorage.getItem(`mc:votes:${token}`) || "{}"));
      } catch {
        /* storage unavailable */
      }
    });
  }, [token]);

  const voterId = (): string => {
    try {
      let v = localStorage.getItem("mc:voter");
      if (!v) {
        v = crypto.randomUUID();
        localStorage.setItem("mc:voter", v);
      }
      return v;
    } catch {
      return "";
    }
  };

  const vote = async (id: string) => {
    if (mine[id]) return;
    const next = { ...mine, [id]: true };
    setMine(next);
    setCounts((c) => ({ ...c, [id]: (c[id] ?? 0) + 1 }));
    try {
      localStorage.setItem(`mc:votes:${token}`, JSON.stringify(next));
    } catch {}
    const res = await fetch(`/api/share/${token}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shotId: id, voter: voterId() }),
    }).catch(() => null);
    const data = res ? await readJson(res).catch(() => null) : null;
    if (data?.ok) setCounts((c) => ({ ...c, [id]: data.count }));
  };

  if (!shots.length) return <p className="mt-10 text-ink-soft">The images are still being created. Check back in a few minutes.</p>;

  return (
    <ul className="mt-8 columns-1 gap-4 sm:columns-2 lg:columns-3">
      {shots.map((s) => (
        <li key={s.id} className="mb-4 break-inside-avoid">
          <figure className="overflow-hidden rounded-[18px] bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s.url} alt={s.caption} className={`w-full object-cover ${s.portrait ? "aspect-[3/4]" : "aspect-[4/3]"}`} loading="lazy" />
            <figcaption className="flex items-center justify-between gap-3 px-4 py-3">
              <span className="text-sm text-ink-soft">{s.caption}</span>
              <button
                type="button"
                onClick={() => vote(s.id)}
                aria-pressed={!!mine[s.id]}
                aria-label={mine[s.id] ? "You loved this" : "Love this look"}
                className={`flex flex-none items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold ${mine[s.id] ? "border-kumkum bg-[#fdecee] text-kumkum" : "border-line text-ink"}`}
              >
                <Heart size={16} className={mine[s.id] ? "fill-kumkum" : ""} /> {counts[s.id] || ""}
              </button>
            </figcaption>
          </figure>
        </li>
      ))}
    </ul>
  );
}
