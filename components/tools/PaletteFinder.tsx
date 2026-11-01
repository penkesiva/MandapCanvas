"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { engage as track } from "@/lib/engage";
import { FINDER_EVENTS, SEASONS, SEASON_FLOWERS, findPalettes, type FinderEvent, type Season, type TimeOfDay } from "@/lib/paletteFinder";
import { OUTFIT_COLORS } from "@/lib/outfitColors";
import { CoupleScene } from "./Figures";

export function PaletteFinder() {
  const [event, setEvent] = useState<FinderEvent>("ceremony");
  const [season, setSeason] = useState<Season>("fall");
  const [time, setTime] = useState<TimeOfDay>("day");
  const [outfit, setOutfit] = useState("");
  const results = useMemo(() => findPalettes({ event, season, time, outfit }), [event, season, time, outfit]);

  const pick = <T,>(set: (v: T) => void, v: T, what: string) => {
    set(v);
    track("tool_palette_pick", { what });
  };

  return (
    <div className="rounded-[26px] border border-gold/40 bg-white p-4 shadow-[0_30px_60px_-44px_rgba(74,13,26,0.6)] sm:p-7">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="min-w-0">
          <p className="font-semibold">Event</p>
          <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label="Event">
            {FINDER_EVENTS.map((e) => (
              <button key={e.id} type="button" role="radio" aria-checked={event === e.id} className="chip" onClick={() => pick(setEvent, e.id, "event")}>
                {e.name}
              </button>
            ))}
          </div>
        </div>
        <div className="min-w-0">
          <p className="font-semibold">Season</p>
          <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label="Season">
            {SEASONS.map((s) => (
              <button key={s.id} type="button" role="radio" aria-checked={season === s.id} className="chip" onClick={() => pick(setSeason, s.id, "season")}>
                {s.name} <span className="text-xs text-ink-soft">{s.months}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="min-w-0">
          <p className="font-semibold">Time of day</p>
          <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label="Time of day">
            {(
              [
                ["day", "Daytime"],
                ["evening", "Evening"],
              ] as [TimeOfDay, string][]
            ).map(([v, l]) => (
              <button key={v} type="button" role="radio" aria-checked={time === v} className="chip" onClick={() => pick(setTime, v, "time")}>
                {l}
              </button>
            ))}
          </div>
        </div>
        <div className="min-w-0">
          <label className="font-semibold" htmlFor="outfit">
            Bride&apos;s outfit color <span className="font-normal text-ink-soft">(optional)</span>
          </label>
          <div className="mt-2 flex items-center gap-3">
            <span
              className="h-11 w-11 flex-none rounded-xl ring-1 ring-ink/10"
              style={{ background: OUTFIT_COLORS.find((o) => o.id === outfit)?.hex ?? "repeating-linear-gradient(45deg,#fff,#fff 6px,#f3e6e0 6px,#f3e6e0 12px)" }}
              aria-hidden="true"
            />
            <select id="outfit" className="field" value={outfit} onChange={(e) => pick(setOutfit, e.target.value, "outfit")}>
              <option value="">Not decided yet</option>
              {OUTFIT_COLORS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="mt-8" aria-live="polite">
        <p className="font-display text-2xl text-maroon">Your top 3 palettes</p>
        <ol className="mt-4 grid gap-4 lg:grid-cols-3">
          {results.map((r, i) => (
            <li key={r.palette.id} className={`flex flex-col overflow-hidden rounded-2xl border ${i === 0 ? "border-kumkum shadow-[0_20px_40px_-30px_rgba(110,16,34,0.6)]" : "border-line"}`}>
              <CoupleScene
                className="h-auto w-full"
                bride={OUTFIT_COLORS.find((o) => o.id === outfit)?.hex ?? r.palette.swatches[0]}
                groom={r.palette.swatches[2]}
                safa={r.palette.swatches[0]}
                dupatta={r.palette.swatches[1]}
                decor={r.palette.swatches}
              />
              <div className="flex flex-1 flex-col p-4">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="font-display text-xl">
                    <span className="text-gold">{i + 1}.</span> {r.palette.name}
                  </p>
                  <span className="flex-none text-sm font-semibold text-mehndi">{r.match}% match</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line" aria-hidden="true">
                  <div className="h-full rounded-full bg-mehndi" style={{ width: `${r.match}%` }} />
                </div>
                <ul className="mt-3 space-y-1 text-sm">
                  {r.reasons.map((x) => (
                    <li key={x} className={x.startsWith("Can clash") ? "text-kumkum-deep" : ""}>
                      {x.startsWith("Can clash") ? "✕ " : "✓ "}
                      {x}
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-sm text-ink-soft">
                  <span className="font-medium text-ink">Flowers:</span> {r.palette.flowers}.
                </p>
                <p className="mt-1 text-sm text-ink-soft">
                  <span className="font-medium text-ink">Outfits:</span> {r.palette.outfits}.
                </p>
                <Link
                  href={`/create?palette=${r.palette.id}`}
                  className={`btn mt-4 w-full ${i === 0 ? "btn-primary" : "btn-ghost"}`}
                  onClick={() => track("tool_palette_cta", { palette: r.palette.id, rank: i + 1 })}
                >
                  See it on your mandap
                </Link>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-5 rounded-2xl bg-silk p-4 text-sm">
          <span className="font-semibold">In season in {SEASONS.find((s) => s.id === season)!.name.toLowerCase()}:</span> {SEASON_FLOWERS[season]}. Flowers in season
          look fresher and usually cost less, so ask your florist to lean on them.
        </p>
      </div>
    </div>
  );
}
