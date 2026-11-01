"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { engage as track } from "@/lib/engage";
import { Check, Copy, ExternalLink } from "lucide-react";
import { generateHashtags } from "@/lib/hashtags";
import { CoupleScene } from "./Figures";

export function HashtagGenerator() {
  const [f, setF] = useState({ name1: "", name2: "", last1: "", last2: "", year: "", place: "" });
  const [copied, setCopied] = useState<string | null>(null);
  const groups = useMemo(() => generateHashtags(f), [f]);
  const all = groups.flatMap((g) => g.tags);

  const copy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied((c) => (c === key ? null : c)), 1400);
      track("tool_hashtag_copy", { what: key === "all" ? "all" : "one" });
    } catch {
      /* clipboard blocked */
    }
  };
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF((x) => ({ ...x, [k]: e.target.value }));

  return (
    <div className="rounded-[26px] border border-gold/40 bg-white p-4 shadow-[0_30px_60px_-44px_rgba(74,13,26,0.6)] sm:p-7">
      <form className="grid gap-4 sm:grid-cols-2" onSubmit={(e) => e.preventDefault()}>
        <label className="block">
          <span className="mb-1.5 block font-semibold">First name</span>
          <input className="field" value={f.name1} onChange={set("name1")} placeholder="Priya" maxLength={30} autoComplete="off" />
        </label>
        <label className="block">
          <span className="mb-1.5 block font-semibold">Partner&apos;s first name</span>
          <input className="field" value={f.name2} onChange={set("name2")} placeholder="Arjun" maxLength={30} autoComplete="off" />
        </label>
        <details className="sm:col-span-2">
          <summary className="cursor-pointer text-sm font-semibold text-kumkum">Add last names, year or place (optional)</summary>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <input className="field" value={f.last1} onChange={set("last1")} placeholder="Last name (first person)" maxLength={30} aria-label="Last name, first person" />
            <input className="field" value={f.last2} onChange={set("last2")} placeholder="Last name (partner)" maxLength={30} aria-label="Last name, partner" />
            <input className="field" value={f.year} onChange={set("year")} placeholder="Year, e.g. 2027" inputMode="numeric" maxLength={4} aria-label="Wedding year" />
            <input className="field" value={f.place} onChange={set("place")} placeholder="City or venue, e.g. Napa" maxLength={30} aria-label="City or venue" />
          </div>
        </details>
      </form>

      <div className="mt-6" aria-live="polite">
        {groups.length === 0 ? (
          <p className="rounded-2xl bg-silk p-5 text-center text-ink-soft">Type both names to see your hashtags.</p>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-display text-2xl text-maroon">{all.length} hashtags</p>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => copy(all.join(" "), "all")}>
                {copied === "all" ? <Check size={16} /> : <Copy size={16} />} {copied === "all" ? "Copied" : "Copy all"}
              </button>
            </div>
            <figure className="mt-4 grid items-center gap-4 overflow-hidden rounded-2xl bg-silk p-4 sm:grid-cols-[220px_1fr]">
              <CoupleScene className="h-auto w-full" bride="#B3131B" dupatta="#C2185B" groom="#F6EFE2" safa="#B3131B" decor={["#C9A24B", "#F2C4C0", "#FFF8EE"]} />
              <figcaption className="text-center sm:text-left">
                <span className="block text-sm text-ink-soft">On your welcome sign</span>
                <span className="mt-1 block font-display text-2xl text-maroon">
                  {f.name1.trim() || "Priya"} &amp; {f.name2.trim() || "Arjun"}
                </span>
                <span className="mt-1 block text-lg font-semibold text-kumkum">{groups[1]?.tags[2] ?? all[0]}</span>
                <span className="mt-1 block text-xs text-ink-soft">Share your photos with this hashtag</span>
              </figcaption>
            </figure>
            <div className="mt-5 space-y-5">
              {groups.map((g) => (
                <div key={g.id}>
                  <p className="mb-2 text-sm font-semibold text-ink-soft">{g.title}</p>
                  <ul className="flex flex-wrap gap-2">
                    {g.tags.map((t) => (
                      <li key={t} className="flex items-center overflow-hidden rounded-full border border-line bg-silk">
                        <button type="button" onClick={() => copy(t, t)} className="flex items-center gap-1.5 py-1.5 pl-3.5 pr-2 text-[0.95rem] font-medium hover:text-kumkum" title="Copy">
                          {t}
                          {copied === t ? <Check size={14} className="text-mehndi" /> : <Copy size={13} className="text-ink-soft" />}
                        </button>
                        <a
                          href={`https://www.instagram.com/explore/tags/${encodeURIComponent(t.slice(1))}/`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="border-l border-line px-2 py-1.5 text-ink-soft hover:text-kumkum"
                          title="Check if it's taken on Instagram"
                          aria-label={`Check ${t} on Instagram`}
                        >
                          <ExternalLink size={13} />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <p className="mt-5 text-sm text-ink-soft">Tip: tap the arrow next to a hashtag to check that nobody else is already using it on Instagram.</p>
          </>
        )}
      </div>

      <div className="mt-7 flex flex-col items-start gap-3 rounded-2xl bg-maroon p-5 text-[#fff8ef] sm:flex-row sm:items-center sm:justify-between">
        <p>
          <span className="font-display text-xl text-gold-light">Got your hashtag? Now picture the mandap.</span>
          <span className="block text-sm text-[#f3e3d3]">See your decor and outfits photo-real before you book. Two previews free.</span>
        </p>
        <Link href="/create" className="btn btn-gold flex-none" onClick={() => track("tool_hashtag_cta")}>
          Make a free preview
        </Link>
      </div>
    </div>
  );
}
