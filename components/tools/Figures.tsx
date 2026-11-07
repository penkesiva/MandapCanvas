/**
 * Cute, flat, recolorable illustrations of a Desi bride, groom and family, so the tools can show
 * colors on people instead of in words. Pure SVG: every outfit color is a prop.
 * Chibi proportions: big heads, big shiny eyes, rosy cheeks.
 */

import { useId } from "react";

const SKIN = "#E0A47E";
const SKIN_SHADE = "#C98962";
const HAIR = "#2B1B17";
const HAIR_SHINE = "#4A3029";
const BLUSH = "#F0857D";
const LIP = "#C2454B";
const KUMKUM = "#C8102E";

export function shade(hex: string, amt: number): string {
  const n = parseInt(hex.replace("#", ""), 16);
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(c + amt * 255)));
  return `#${[(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => f(c).toString(16).padStart(2, "0")).join("")}`;
}

export function luminance(hex: string): number {
  const n = parseInt(hex.replace("#", ""), 16);
  return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
}

/** Very dark fabric reads as a hole at this size, so lift it a little. */
function lift(hex: string): string {
  return luminance(hex) < 0.14 ? shade(hex, 0.16) : hex;
}

/** Big shiny eyes, rosy cheeks and a small smile, centered on (cx, cy). */
function Face({ cx, cy, lashes = false, brows = false }: { cx: number; cy: number; lashes?: boolean; brows?: boolean }) {
  const ex = 9.5;
  return (
    <g>
      {brows ? (
        <>
          <path d={`M${cx - ex - 4} ${cy - 8} Q${cx - ex} ${cy - 11} ${cx - ex + 4} ${cy - 8.5}`} stroke={HAIR} strokeWidth="2" strokeLinecap="round" fill="none" />
          <path d={`M${cx + ex - 4} ${cy - 8.5} Q${cx + ex} ${cy - 11} ${cx + ex + 4} ${cy - 8}`} stroke={HAIR} strokeWidth="2" strokeLinecap="round" fill="none" />
        </>
      ) : null}
      {[-1, 1].map((s) => (
        <g key={s}>
          <ellipse cx={cx + s * ex} cy={cy} rx="3.6" ry="4.4" fill={HAIR} />
          <circle cx={cx + s * ex + 1.2} cy={cy - 1.6} r="1.4" fill="#fff" />
          <circle cx={cx + s * ex - 1.1} cy={cy + 1.6} r="0.6" fill="#fff" />
          {lashes ? <path d={`M${cx + s * (ex + 3)} ${cy - 2.5} l${s * 2.6} -2`} stroke={HAIR} strokeWidth="1.4" strokeLinecap="round" /> : null}
          <ellipse cx={cx + s * (ex + 5)} cy={cy + 7} rx="4" ry="2.4" fill={BLUSH} opacity="0.55" />
        </g>
      ))}
      <path d={`M${cx - 3.5} ${cy + 8} Q${cx} ${cy + 11.5} ${cx + 3.5} ${cy + 8}`} stroke={LIP} strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </g>
  );
}

/** Bride in a lehenga: `outfit` is the lehenga and blouse, `dupatta` the veil, `trim` the zari and jewelry. */
export type BrideLook = "ceremony" | "festive" | "party";

/**
 * Bride: `ceremony` has the dupatta over her head; `festive` (Haldi, Mehndi) drops it to one shoulder
 * with flowers in her hair; `party` (Sangeet, reception) wears it as a saree-style pallu with sequins.
 */
export function Bride({ outfit, dupatta, trim = "#C9A24B", look = "ceremony", className = "" }: { outfit: string; dupatta?: string; trim?: string; look?: BrideLook; className?: string }) {
  const lehenga = lift(outfit);
  const veil = lift(dupatta ?? outfit);
  return (
    <svg viewBox="0 0 120 240" width="120" height="240" className={className} role="img" aria-label="Bride">
      {/* dupatta, back layer: frames the head and falls behind the shoulders */}
      {look === "ceremony" ? (
        <>
          <path d="M31 66 Q28 26 60 24 Q92 26 89 66 L98 150 Q102 190 96 214 L24 214 Q18 190 22 150 Z" fill={shade(veil, -0.08)} />
          <path d="M22 150 Q18 190 24 214 M98 150 Q102 190 96 214" stroke={trim} strokeWidth="2.4" fill="none" />
        </>
      ) : null}
      {look === "party" ? (
        // pallu falling down her back from the left shoulder
        <path d="M76 100 Q96 110 100 160 Q104 196 98 214 L84 214 Q88 170 74 112 Z" fill={shade(veil, -0.06)} />
      ) : null}

      {/* lehenga: flared skirt with pleats, butis and a broad zari border */}
      <path d="M41 132 L79 132 Q100 180 110 222 Q60 234 10 222 Q20 180 41 132 Z" fill={lehenga} />
      {[-26, -13, 0, 13, 26].map((d) => (
        <path key={d} d={`M${60 + d * 0.35} 134 Q${60 + d * 0.8} 180 ${60 + d * 1.5} 222`} stroke={shade(lehenga, -0.07)} strokeWidth="1.2" fill="none" />
      ))}
      {[
        [40, 168],
        [60, 160],
        [80, 168],
        [32, 196],
        [50, 190],
        [70, 190],
        [88, 196],
      ].map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <circle cx={x} cy={y} r="2.4" fill={trim} />
          <circle cx={x} cy={y} r="0.9" fill={shade(lehenga, 0.1)} />
        </g>
      ))}
      <path d="M13 210 Q60 220 107 210 L110 222 Q60 234 10 222 Z" fill={trim} />
      <path d="M12 216 Q60 226 108 216" stroke={shade(trim, -0.15)} strokeWidth="1" strokeDasharray="2 3" fill="none" />

      {/* blouse, arms with bangles, hands meeting in front */}
      <rect x="42" y="100" width="36" height="36" rx="13" fill={shade(lehenga, -0.06)} />
      {look === "festive" ? (
        // dupatta across the body, from the right shoulder to the left hip
        <path d="M44 100 Q50 98 54 101 Q66 118 82 140 L76 146 Q60 126 44 108 Z" fill={veil} />
      ) : null}
      {look === "party" ? (
        <>
          {/* pallu over the left shoulder, with sequins */}
          <path d="M66 100 Q76 97 80 103 Q74 120 70 134 L62 132 Q66 116 66 100 Z" fill={veil} />
          {[
            [24, 200],
            [44, 178],
            [60, 200],
            [76, 178],
            [96, 200],
            [52, 150],
            [68, 150],
          ].map(([x, y]) => (
            <circle key={`s${x}-${y}`} cx={x} cy={y} r="1.3" fill="#FFF6E5" opacity="0.9" />
          ))}
        </>
      ) : null}
      <path d="M44 106 Q36 122 50 136" stroke={SKIN} strokeWidth="8" strokeLinecap="round" fill="none" />
      <path d="M76 106 Q84 122 70 136" stroke={SKIN} strokeWidth="8" strokeLinecap="round" fill="none" />
      <path d="M41 124 l6 3 M79 124 l-6 3" stroke={KUMKUM} strokeWidth="2.6" strokeLinecap="round" />
      <path d="M40 120 l6 3 M80 120 l-6 3" stroke={trim} strokeWidth="2" strokeLinecap="round" />
      <circle cx="56" cy="137" r="5" fill={SKIN} />
      <circle cx="64" cy="137" r="5" fill={SKIN} />
      <circle cx="60" cy="137" r="1.6" fill="#9C4A2E" opacity="0.6" />

      {/* neck and necklace */}
      <rect x="54" y="88" width="12" height="14" rx="4" fill={SKIN_SHADE} />
      <path d="M49 101 Q60 112 71 101" stroke={trim} strokeWidth="3.2" fill="none" strokeLinecap="round" />
      <path d="M60 108 l-2.6 4 l2.6 3.4 l2.6 -3.4 Z" fill={KUMKUM} />

      {/* head: hair back, face, center-parted hair */}
      <circle cx="60" cy="62" r="28" fill={HAIR} />
      <ellipse cx="60" cy="67" rx="23.5" ry="23" fill={SKIN} />
      <path d="M60 41 Q38 40 35 66 Q42 50 60 48 Z" fill={HAIR} />
      <path d="M60 41 Q82 40 85 66 Q78 50 60 48 Z" fill={HAIR} />
      <path d="M44 46 Q50 42 56 43" stroke={HAIR_SHINE} strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* jhumkas */}
      {[35, 85].map((x) => (
        <g key={x}>
          <path d={`M${x - 3.6} 82 Q${x} 75 ${x + 3.6} 82 Z`} fill={trim} />
          <circle cx={x} cy="84" r="1.2" fill={trim} />
        </g>
      ))}
      <Face cx={60} cy={69} lashes />
      {/* bindi, maang tikka, nath */}
      <circle cx="60" cy="58" r="1.7" fill={KUMKUM} />
      <path d="M60 39 L60 47" stroke={trim} strokeWidth="1.4" />
      <path d="M60 46 Q56.5 50 60 53.5 Q63.5 50 60 46 Z" fill={trim} />
      <circle cx="60" cy="50" r="1.2" fill={KUMKUM} />
      <circle cx="65" cy="76" r="3" stroke={trim} strokeWidth="1.2" fill="none" />

      {look === "festive" ? (
        // flowers in her hair
        <g>
          {[
            [37, 52],
            [41, 44],
            [79, 44],
            [83, 52],
          ].map(([x, y]) => (
            <g key={`f${x}`}>
              <circle cx={x} cy={y} r="3.4" fill="#F2A900" />
              <circle cx={x} cy={y} r="1.3" fill="#FFF6E5" />
            </g>
          ))}
        </g>
      ) : null}
      {look === "ceremony" ? (
      <>
      {/* dupatta, front edge resting over the hair */}
      <path d="M32 64 Q29 28 60 27 Q91 28 88 64 Q85 40 60 39 Q35 40 32 64 Z" fill={veil} opacity="0.94" />
      <path d="M32 64 Q29 28 60 27 Q91 28 88 64" stroke={trim} strokeWidth="2.6" fill="none" strokeLinecap="round" />
      {[40, 50, 60, 70, 80].map((x) => (
        <circle key={x} cx={x} cy={x === 60 ? 29.5 : x === 50 || x === 70 ? 31 : 35} r="1.1" fill={shade(trim, 0.15)} />
      ))}
      </>
      ) : null}
    </svg>
  );
}

/** Groom in a sherwani: `outfit` is the sherwani, `safa` the turban, `stole` the dupatta, `trim` buttons and brooch. */
export type GroomLook = "sherwani" | "kurta" | "bandhgala";

/**
 * Groom: `sherwani` with a safa (the ceremony); `kurta` with pajama and no safa (Haldi, Mehndi);
 * `bandhgala`, a short jacket with trousers and a pocket square in `safa` (Sangeet, reception).
 */
export function Groom({ outfit, safa, stole, trim = "#C9A24B", look = "sherwani", className = "" }: { outfit: string; safa: string; stole?: string; trim?: string; look?: GroomLook; className?: string }) {
  const coat = lift(outfit);
  const turban = lift(safa);
  const pajama = luminance(coat) > 0.82 ? "#E9DCC2" : "#F6EFE2";
  const trousers = luminance(coat) > 0.5 ? shade(coat, -0.3) : shade(coat, -0.06);
  return (
    <svg viewBox="0 0 120 240" width="120" height="240" className={className} role="img" aria-label="Groom">
      {/* legs and mojaris (or shoes) */}
      {look === "sherwani" ? (
        <>
          <rect x="47" y="200" width="11" height="24" rx="4" fill={shade(coat, 0.08)} />
          <rect x="62" y="200" width="11" height="24" rx="4" fill={shade(coat, 0.08)} />
        </>
      ) : look === "kurta" ? (
        <>
          <rect x="46" y="170" width="13" height="54" rx="4" fill={pajama} />
          <rect x="61" y="170" width="13" height="54" rx="4" fill={pajama} />
        </>
      ) : (
        <>
          <rect x="47" y="164" width="12" height="60" rx="3" fill={trousers} />
          <rect x="61" y="164" width="12" height="60" rx="3" fill={trousers} />
        </>
      )}
      <path d="M41 224 Q50 216 59 222 L59 229 L43 229 Q38 229 41 224 Z" fill={look === "bandhgala" ? "#3A2A22" : trim} />
      <path d="M61 222 Q70 216 79 224 Q82 229 77 229 L61 229 Z" fill={look === "bandhgala" ? "#3A2A22" : trim} />

      {look === "sherwani" ? (
        <>
          {/* sherwani: long coat with a placket, buttons and zari hem */}
          <path d="M40 100 Q60 94 80 100 Q88 150 90 206 Q60 212 30 206 Q32 150 40 100 Z" fill={coat} />
          <path d="M31 198 Q60 204 89 198 L90 206 Q60 212 30 206 Z" fill={trim} opacity="0.85" />
          <path d="M60 100 L60 208" stroke={shade(coat, -0.12)} strokeWidth="1.4" />
          {[112, 124, 136, 148, 160].map((y) => (
            <circle key={y} cx="60" cy={y} r="2" fill={trim} />
          ))}
        </>
      ) : look === "kurta" ? (
        <>
          {/* knee-length kurta with a short placket */}
          <path d="M40 100 Q60 94 80 100 Q86 140 88 180 Q60 186 32 180 Q34 140 40 100 Z" fill={coat} />
          <path d="M60 100 L60 132" stroke={shade(coat, -0.14)} strokeWidth="1.4" />
          {[108, 118, 128].map((y) => (
            <circle key={y} cx="60" cy={y} r="1.6" fill={trim} />
          ))}
          <path d="M34 166 L36 180 M86 166 L84 180" stroke={shade(coat, -0.14)} strokeWidth="1.2" />
        </>
      ) : (
        <>
          {/* bandhgala: fitted short jacket, buttons, pocket square */}
          <path d="M40 100 Q60 94 80 100 Q84 134 85 170 Q60 175 35 170 Q36 134 40 100 Z" fill={coat} />
          <path d="M60 100 L60 172" stroke={shade(coat, -0.14)} strokeWidth="1.4" />
          {[110, 122, 134, 146, 158].map((y) => (
            <circle key={y} cx="60" cy={y} r="1.8" fill={trim} />
          ))}
          <path d="M68 116 L78 116 L76 120 L70 120 Z" fill={shade(coat, -0.1)} />
          <path d="M69 116 L72 110 L74 115 L76 111 L77 116 Z" fill={turban} />
        </>
      )}
      {/* stole over one shoulder */}
      {stole ? <path d="M43 100 Q60 108 78 99 L83 106 Q66 144 52 204 L44 202 Q55 146 71 110 Q57 112 43 106 Z" fill={lift(stole)} /> : null}
      {/* arms and hands */}
      <path d="M41 104 Q32 128 38 150" stroke={coat} strokeWidth="10" strokeLinecap="round" fill="none" />
      <path d="M79 104 Q88 128 82 150" stroke={coat} strokeWidth="10" strokeLinecap="round" fill="none" />
      <path d="M33 146 l10 0 M77 146 l10 0" stroke={trim} strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="38" cy="154" r="5" fill={SKIN} />
      <circle cx="82" cy="154" r="5" fill={SKIN} />

      {/* neck and mandarin collar */}
      <rect x="54" y="88" width="12" height="12" rx="4" fill={SKIN_SHADE} />
      <rect x="51" y="97" width="18" height="6" rx="3" fill={shade(coat, -0.1)} />
      <path d="M52 100 L68 100" stroke={trim} strokeWidth="1.2" />

      {/* head */}
      <circle cx="36" cy="68" r="4.6" fill={SKIN_SHADE} />
      <circle cx="84" cy="68" r="4.6" fill={SKIN_SHADE} />
      <ellipse cx="60" cy="67" rx="23.5" ry="23" fill={SKIN} />
      <path d="M37 54 Q37 66 40 72 L42 56 Z M83 54 Q83 66 80 72 L78 56 Z" fill={HAIR} />
      <Face cx={60} cy={70} brows />
      <path d="M54 76.5 Q57 74.5 60 76 Q63 74.5 66 76.5 Q63 78.5 60 77.4 Q57 78.5 54 76.5 Z" fill={HAIR} />
      <circle cx="60" cy="60" r="1.2" fill={KUMKUM} />

      {look !== "sherwani" ? (
        // his own hair, no safa
        <>
          <path d="M36 64 Q33 39 60 38 Q87 39 84 64 Q81 50 64 48 Q58 54 46 51 Q39 54 36 64 Z" fill={HAIR} />
          <path d="M48 44 Q56 40 66 42" stroke={HAIR_SHINE} strokeWidth="2" strokeLinecap="round" fill="none" />
        </>
      ) : (
      <>
      {/* safa: a rounded, wrapped turban with layered folds, a kalgi brooch and a small fan */}
      <path d="M84 50 Q98 52 96 70 Q92 60 84 58 Z" fill={shade(turban, -0.1)} />
      <path d="M33 58 Q30 24 60 22 Q90 24 87 58 Q76 50 60 50 Q44 50 33 58 Z" fill={turban} />
      <path d="M35 47 Q60 34 86 46" stroke={shade(turban, -0.14)} strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <path d="M38 37 Q60 26 82 36" stroke={shade(turban, -0.14)} strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <path d="M33 58 Q46 49 60 50 Q76 50 87 58" stroke={trim} strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <path d="M44 30 Q52 26 58 26" stroke={shade(turban, 0.14)} strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="60" cy="38" r="4.4" fill={trim} />
      <circle cx="60" cy="38" r="2" fill={KUMKUM} />
      <path d="M60 34 Q63 22 70 14 Q66 26 62 35" fill={trim} />
      <path d="M56 42 Q60 48 64 42" stroke={trim} strokeWidth="1.2" fill="none" />
      {[54, 60, 66].map((x) => (
        <circle key={x} cx={x} cy={x === 60 ? 47 : 44.5} r="1" fill={shade(trim, 0.2)} />
      ))}
      </>
      )}
    </svg>
  );
}

/** A woman in a saree and a man in a kurta, for "family colors". */
export function Family({ a, b, className = "" }: { a: string; b: string; className?: string }) {
  const saree = lift(a);
  const kurta = lift(b);
  return (
    <svg viewBox="0 0 160 200" width="160" height="200" className={className} role="img" aria-label="Family">
      {/* woman in saree */}
      <path d="M34 112 L66 112 Q78 150 80 188 Q50 196 20 188 Q22 150 34 112 Z" fill={saree} />
      <path d="M22 180 Q50 188 79 180 L80 188 Q50 196 20 188 Z" fill="#C9A24B" />
      <path d="M36 92 Q28 112 38 128" stroke={SKIN} strokeWidth="7" strokeLinecap="round" fill="none" />
      <path d="M64 92 Q72 112 62 128" stroke={SKIN} strokeWidth="7" strokeLinecap="round" fill="none" />
      <path d="M31 112 l6 2 M69 112 l-6 2" stroke="#C9A24B" strokeWidth="2.2" strokeLinecap="round" />
      <rect x="34" y="86" width="32" height="30" rx="11" fill={shade(saree, -0.08)} />
      <path d="M64 86 Q74 116 34 150 L28 142 Q60 116 58 88 Z" fill={shade(saree, 0.08)} />
      <path d="M64 86 Q74 116 34 150" stroke="#C9A24B" strokeWidth="2" fill="none" />
      <rect x="45" y="74" width="10" height="12" rx="4" fill={SKIN_SHADE} />
      <circle cx="50" cy="52" r="23" fill={HAIR} />
      <circle cx="70" cy="46" r="8" fill={HAIR} />
      <ellipse cx="50" cy="56" rx="19" ry="18.5" fill={SKIN} />
      <path d="M50 36 Q32 36 31 56 Q37 44 50 42 Z M50 36 Q68 36 69 56 Q63 44 50 42 Z" fill={HAIR} />
      <Face cx={50} cy={58} lashes />
      <circle cx="50" cy="48" r="1.5" fill={KUMKUM} />

      {/* man in kurta */}
      <rect x="99" y="160" width="10" height="28" rx="3" fill="#F6EFE2" />
      <rect x="113" y="160" width="10" height="28" rx="3" fill="#F6EFE2" />
      <path d="M94 92 Q111 86 128 92 Q132 130 132 166 Q111 172 90 166 Q90 130 94 92 Z" fill={kurta} />
      <path d="M95 96 Q86 118 90 138" stroke={kurta} strokeWidth="9" strokeLinecap="round" fill="none" />
      <path d="M127 96 Q136 118 132 138" stroke={kurta} strokeWidth="9" strokeLinecap="round" fill="none" />
      <circle cx="90" cy="142" r="4.4" fill={SKIN} />
      <circle cx="132" cy="142" r="4.4" fill={SKIN} />
      <path d="M111 92 L111 128" stroke={shade(kurta, -0.15)} strokeWidth="1.4" />
      {[100, 110, 120].map((y) => (
        <circle key={y} cx="111" cy={y} r="1.4" fill="#C9A24B" />
      ))}
      <rect x="106" y="78" width="10" height="14" rx="4" fill={SKIN_SHADE} />
      <ellipse cx="111" cy="58" rx="19" ry="18.5" fill={SKIN} />
      <path d="M92 56 Q90 36 111 36 Q132 36 130 56 Q126 44 111 44 Q98 44 92 56 Z" fill={HAIR} />
      <path d="M100 41 Q106 38 112 39" stroke={HAIR_SHINE} strokeWidth="2" strokeLinecap="round" fill="none" />
      <Face cx={111} cy={60} brows />
    </svg>
  );
}

/** Small deterministic pseudo-random numbers, so server and browser render the same confetti. */
function rand(i: number, salt: number): number {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Slow, endless falling confetti and flower petals. Pure SVG + CSS (see .mc-fall / .mc-sway in globals.css):
 * negative delays mean the sky is already full on first paint. Hidden for people who prefer reduced motion.
 */
function Confetti({ colors, count = 22, seed = 0, width = 320, height = 260 }: { colors: string[]; count?: number; seed?: number; width?: number; height?: number }) {
  return (
    <g aria-hidden="true">
      {Array.from({ length: count }, (_, n) => {
        const i = n + seed;
        const x = 8 + rand(i, 1) * (width - 16);
        const dur = 9 + rand(i, 2) * 7; // 9–16 s per fall: slow and calm
        const delay = -rand(i, 3) * dur;
        const sway = 2.6 + rand(i, 4) * 2.4;
        const color = colors[i % colors.length];
        const kind = i % 3; // 0 petal, 1 paper strip, 2 round sequin
        const size = 0.8 + rand(i, 5) * 0.6;
        return (
          <g key={i} transform={`translate(${x.toFixed(1)} 0)`}>
            <g className="mc-fall" style={{ animationDuration: `${dur.toFixed(1)}s`, animationDelay: `${delay.toFixed(1)}s`, ["--fall" as string]: `${height + 24}px` }}>
              <g className="mc-sway" style={{ animationDuration: `${sway.toFixed(1)}s`, animationDelay: `${(-rand(i, 6) * sway).toFixed(1)}s` }}>
                <g transform={`scale(${size.toFixed(2)})`}>
                  {kind === 0 ? (
                    <path d="M0 -4.5 Q3.6 -1 0 4.5 Q-3.6 -1 0 -4.5 Z" fill={color} opacity="0.92" />
                  ) : kind === 1 ? (
                    <rect x="-1.6" y="-3.6" width="3.2" height="7.2" rx="0.8" fill={color} opacity="0.9" />
                  ) : (
                    <circle r="2.1" fill={color} opacity="0.9" />
                  )}
                </g>
              </g>
            </g>
          </g>
        );
      })}
    </g>
  );
}

/** Bride and groom under a simple arch in the decor colors, with confetti drifting down. */
export function CoupleScene({
  bride,
  dupatta,
  groom,
  safa,
  decor,
  trim = "#C9A24B",
  confetti = true,
  show = "both",
  brideLook,
  groomLook,
  stole,
  className = "",
}: {
  bride: string;
  dupatta?: string;
  groom: string;
  safa: string;
  brideLook?: BrideLook;
  groomLook?: GroomLook;
  stole?: string;
  decor: string[];
  trim?: string;
  confetti?: boolean;
  /** Draw both of them, or one person centered under the arch. */
  show?: "both" | "bride" | "groom";
  className?: string;
}) {
  const [d1, d2, d3] = [decor[0], decor[1] ?? decor[0], decor[2] ?? decor[1] ?? decor[0]];
  const clip = `mc-scene-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <svg viewBox="0 0 320 260" width="320" height="260" className={className} role="img" aria-label={show === "both" ? "Bride and groom in these colors" : `${show === "bride" ? "Bride" : "Groom"} in these colors`}>
      <defs>
        <clipPath id={clip}>
          <rect width="320" height="260" rx="18" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clip})`}>
      <rect width="320" height="260" rx="18" fill={shade(d3, 0.04)} />
      <path d="M40 250 L40 110 Q40 30 160 30 Q280 30 280 110 L280 250" fill="none" stroke={d1} strokeWidth="16" />
      <path d="M58 250 L58 112 Q58 50 160 50 Q262 50 262 112 L262 250" fill="none" stroke={d2} strokeWidth="5" />
      {[60, 90, 120, 150, 180, 210].map((y) => (
        <g key={y}>
          <circle cx="40" cy={y} r="8" fill={d1} />
          <circle cx="280" cy={y} r="8" fill={d1} />
          <circle cx="40" cy={y} r="3" fill={d2} />
          <circle cx="280" cy={y} r="3" fill={d2} />
        </g>
      ))}
      <rect x="0" y="236" width="320" height="24" fill={shade(d3, -0.08)} />
      <ellipse cx="160" cy="240" rx="92" ry="6" fill="#000" opacity="0.08" />
      {confetti ? <Confetti colors={[trim, "#F2A33A", "#E7849B", d1, "#FFF6E5", d2]} count={16} /> : null}
      {show !== "bride" ? (
        <g transform={`translate(${show === "groom" ? 103 : 70} 22) scale(0.95)`}>
          <Groom outfit={groom} safa={safa} stole={stole} trim={trim} look={groomLook} />
        </g>
      ) : null}
      {show !== "groom" ? (
        <g transform={`translate(${show === "bride" ? 103 : 136} 22) scale(0.95)`}>
          <Bride outfit={bride} dupatta={dupatta} trim={trim} look={brideLook} />
        </g>
      ) : null}
      {confetti ? <Confetti colors={[trim, "#F2A33A", "#E7849B", "#FFF6E5"]} count={6} seed={100} /> : null}
      </g>
    </svg>
  );
}
