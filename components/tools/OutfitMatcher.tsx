"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { track } from "@vercel/analytics";
import { MATCHER_EVENTS, OUTFIT_COLORS, nearestOutfit, type Swatch } from "@/lib/outfitColors";
import { getPalette } from "@/lib/catalog";

function Chip({ s }: { s: Swatch }) {
  return (
    <li className="flex items-center gap-3">
      <span className="h-10 w-10 flex-none rounded-xl ring-1 ring-ink/10" style={{ background: s.hex }} aria-hidden="true" />
      <span>
        <span className="block font-medium">{s.name}</span>
        <span className="block text-xs uppercase tracking-wide text-ink-soft">{s.hex}</span>
      </span>
    </li>
  );
}

export function OutfitMatcher() {
  const [id, setId] = useState(OUTFIT_COLORS[0].id);
  const [custom, setCustom] = useState<string | null>(null);
  const [event, setEvent] = useState("ceremony");
  const match = useMemo(() => (custom ? nearestOutfit(custom) : OUTFIT_COLORS.find((c) => c.id === id)!), [id, custom]);
  const palette = getPalette(match.decorPalette);
  const ev = MATCHER_EVENTS.find((e) => e.id === event)!;

  return (
    <div className="rounded-[26px] border border-gold/40 bg-white p-4 shadow-[0_30px_60px_-44px_rgba(74,13,26,0.6)] sm:p-7">
      <div className="grid gap-8 lg:grid-cols-[1fr_1.15fr]">
        <div className="min-w-0">
          <p className="font-semibold">1. The bride&apos;s outfit color</p>
          <div className="mt-3 grid grid-cols-4 gap-2.5 sm:grid-cols-7 lg:grid-cols-5" role="radiogroup" aria-label="Bride's outfit color">
            {OUTFIT_COLORS.map((c) => {
              const on = !custom && c.id === id;
              return (
                <button
                  key={c.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  title={c.name}
                  onClick={() => {
                    setCustom(null);
                    setId(c.id);
                    track("tool_outfit_pick", { color: c.id });
                  }}
                  className="group text-center"
                >
                  <span
                    className={`mx-auto block aspect-square w-full rounded-2xl ring-offset-2 transition ${on ? "ring-[3px] ring-kumkum" : "ring-1 ring-ink/10 group-hover:ring-2 group-hover:ring-gold"}`}
                    style={{ background: c.hex }}
                  />
                  <span className={`mt-1 block break-words text-[0.72rem] leading-tight ${on ? "font-semibold text-kumkum-deep" : "text-ink-soft"}`}>{c.name}</span>
                </button>
              );
            })}
          </div>
          <label className="mt-4 flex items-center gap-3 text-sm">
            <input
              type="color"
              value={custom ?? match.hex}
              onChange={(e) => setCustom(e.target.value)}
              className="h-10 w-12 cursor-pointer rounded-lg border border-line bg-white p-1"
              aria-label="Pick any color"
            />
            <span className="text-ink-soft">Or match an exact shade from a photo or swatch</span>
          </label>

          <p className="mt-7 font-semibold">2. The event</p>
          <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label="Event">
            {MATCHER_EVENTS.map((e) => (
              <button key={e.id} type="button" role="radio" aria-checked={event === e.id} className="chip" onClick={() => setEvent(e.id)}>
                {e.name}
              </button>
            ))}
          </div>
          <p className="mt-3 text-sm text-ink-soft">{ev.note}</p>
        </div>

        <div className="min-w-0" aria-live="polite">
          <div className="flex items-center gap-4 rounded-2xl bg-silk p-4">
            <span className="h-16 w-16 flex-none rounded-2xl ring-1 ring-ink/10" style={{ background: custom ?? match.hex }} aria-hidden="true" />
            <div>
              <p className="text-sm text-ink-soft">{custom ? `Closest match for ${custom.toUpperCase()}` : "Bride wears"}</p>
              <p className="font-display text-2xl text-maroon">{match.name}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-6 sm:grid-cols-2">
            <div>
              <p className="font-semibold">Groom</p>
              <ul className="mt-3 space-y-3">{match.groom.map((s) => <Chip key={s.name} s={s} />)}</ul>
            </div>
            <div>
              <p className="font-semibold">Family and bridal party</p>
              <ul className="mt-3 space-y-3">{match.family.map((s) => <Chip key={s.name} s={s} />)}</ul>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-line p-4">
            <p className="font-semibold">Decor palette: {palette.name}</p>
            <div className="mt-3 flex h-10 overflow-hidden rounded-xl ring-1 ring-ink/10" aria-hidden="true">
              {palette.swatches.map((c, i) => (
                <span key={c} className={i === 0 ? "flex-[2]" : "flex-1"} style={{ background: c }} />
              ))}
            </div>
            <p className="mt-3 text-sm text-ink-soft">
              Flowers: {palette.flowers}. Metal: {match.metal}.
            </p>
            <p className="mt-2 text-sm">
              <span className="font-semibold text-kumkum-deep">Avoid:</span> {match.avoid}
            </p>
            <p className="mt-2 text-sm">
              <span className="font-semibold text-mehndi">Tip:</span> {match.tip}
            </p>
          </div>

          <Link
            href={`/create?palette=${palette.id}`}
            className="btn btn-primary mt-6 w-full"
            onClick={() => track("tool_outfit_cta", { palette: palette.id })}
          >
            See your mandap in {palette.name}, free
          </Link>
          <p className="mt-2 text-center text-xs text-ink-soft">Two free photo-real previews. No account needed.</p>
        </div>
      </div>
    </div>
  );
}
