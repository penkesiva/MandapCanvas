"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { engage as track } from "@/lib/engage";
import { MATCHER_EVENTS, OUTFIT_COLORS, nearestOutfit, type OutfitMatch, type Swatch } from "@/lib/outfitColors";
import { getPalette } from "@/lib/catalog";
import { CoupleScene, Family, luminance, shade, type BrideLook, type GroomLook } from "./Figures";

const HALDI_YELLOW: Swatch = { name: "Haldi yellow", hex: "#F2CF5B" };

/** What each of them wears for the chosen event, and in which of the groom's colors. */
function dressFor(event: string, m: OutfitMatch, brideHex: string) {
  const [g0, g1, g2] = [m.groom[0], m.groom[1] ?? m.groom[0], m.groom[2] ?? m.groom[1] ?? m.groom[0]];
  const darkest = [...m.groom].sort((a, b) => luminance(a.hex) - luminance(b.hex))[0];
  const lightBride = luminance(brideHex) > 0.75;
  switch (event) {
    case "haldi":
      return {
        bride: shade(brideHex, lightBride ? 0 : 0.08),
        brideLook: "festive" as BrideLook,
        groomLook: "kurta" as GroomLook,
        groom: m.id === "yellow" || m.id === "mustard" ? g0 : HALDI_YELLOW,
        stole: undefined,
        line: "Haldi: she wears a lighter, brighter shade with flowers in her hair; he's in a simple kurta.",
      };
    case "mehndi":
      return {
        bride: brideHex,
        brideLook: "festive" as BrideLook,
        groomLook: "kurta" as GroomLook,
        groom: g1,
        stole: brideHex,
        line: `Mehndi: dupatta off the head; he wears a ${g1.name.toLowerCase()} kurta with a stole in her color.`,
      };
    case "sangeet":
      return {
        bride: brideHex,
        brideLook: "party" as BrideLook,
        groomLook: "bandhgala" as GroomLook,
        groom: g2,
        stole: undefined,
        line: `Sangeet: sequins and a saree-style drape; he's in a ${g2.name.toLowerCase()} bandhgala with a pocket square in her color.`,
      };
    case "reception": {
      // a classic evening bandhgala when none of his colors is dark enough
      const evening = /blue|navy/i.test(m.name) ? { name: "Charcoal", hex: "#2E2C33" } : { name: "Midnight navy", hex: "#1F2A44" };
      const deep = luminance(darkest.hex) > 0.45 ? evening : darkest;
      return {
        bride: shade(brideHex, lightBride ? 0 : -0.05),
        brideLook: "party" as BrideLook,
        groomLook: "bandhgala" as GroomLook,
        groom: deep,
        stole: undefined,
        line: `Reception: a deeper, glamorous shade for her; a ${deep.name.toLowerCase()} bandhgala for him.`,
      };
    }
    default:
      return {
        bride: brideHex,
        brideLook: "ceremony" as BrideLook,
        groomLook: "sherwani" as GroomLook,
        groom: g0,
        stole: brideHex,
        line: `Ceremony: dupatta over her head; he wears a ${g0.name.toLowerCase()} sherwani with a safa and stole that pick up her color.`,
      };
  }
}

function Chip({ s, on = false }: { s: Swatch; on?: boolean }) {
  return (
    <li className="flex items-center gap-3">
      <span className={`h-10 w-10 flex-none rounded-xl ${on ? "ring-[3px] ring-kumkum ring-offset-2" : "ring-1 ring-ink/10"}`} style={{ background: s.hex }} aria-hidden="true" />
      <span>
        <span className="block font-medium">{s.name}</span>
        <span className="block text-xs uppercase tracking-wide text-ink-soft">{on ? `${s.hex.toUpperCase()} · in the picture` : s.hex}</span>
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
  const brideHex = custom ?? match.hex;
  const dress = dressFor(event, match, brideHex);

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

          <CoupleScene
            className="mt-5 h-auto w-full max-w-md"
            bride={dress.bride}
            dupatta={dress.brideLook === "ceremony" ? match.family[0].hex : shade(brideHex, 0.12)}
            groom={dress.groom.hex}
            safa={brideHex}
            stole={dress.stole}
            brideLook={dress.brideLook}
            groomLook={dress.groomLook}
            trim={match.metal === "silver" ? "#C0C6D0" : "#C9A24B"}
            decor={palette.swatches}
          />
          <p className="mt-2 text-xs text-ink-soft">
            {dress.line} Decor in {palette.name}.
          </p>
          <div className="mt-5 grid gap-6 sm:grid-cols-2">
            <div>
              <p className="font-semibold">Groom</p>
              <ul className="mt-3 space-y-3">
                {(match.groom.some((s) => s.hex === dress.groom.hex) ? match.groom : [dress.groom, ...match.groom]).map((s) => (
                  <Chip key={s.name} s={s} on={s.hex === dress.groom.hex} />
                ))}
              </ul>
            </div>
            <div>
              <p className="font-semibold">Family and bridal party</p>
              <Family a={match.family[0].hex} b={match.family[2]?.hex ?? match.family[1].hex} className="mt-2 h-auto w-28" />
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
