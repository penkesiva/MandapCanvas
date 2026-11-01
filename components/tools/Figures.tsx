/**
 * Flat, recolorable illustrations of a Desi bride, groom and family, so the tools can show
 * colors on people instead of in words. Pure SVG: every color is a prop.
 */

const SKIN = "#C58B66";
const SKIN_SHADE = "#A8704F";
const HAIR = "#2A1A14";

function shade(hex: string, amt: number): string {
  const n = parseInt(hex.replace("#", ""), 16);
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(c + amt * 255)));
  return `#${[(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => f(c).toString(16).padStart(2, "0")).join("")}`;
}

/** Bride in a lehenga: `outfit` is the lehenga and blouse, `dupatta` the veil, `trim` the zari border. */
export function Bride({ outfit, dupatta, trim = "#C9A24B", className = "" }: { outfit: string; dupatta?: string; trim?: string; className?: string }) {
  const veil = dupatta ?? outfit;
  return (
    <svg viewBox="0 0 120 240" width="120" height="240" className={className} role="img" aria-label="Bride">
      {/* lehenga */}
      <path d="M44 100 L76 100 L108 226 Q60 236 12 226 Z" fill={outfit} />
      <path d="M44 100 L76 100 L92 160 Q60 168 28 160 Z" fill={shade(outfit, 0.06)} />
      <path d="M15 214 Q60 224 105 214 L108 226 Q60 236 12 226 Z" fill={trim} />
      {[34, 50, 66, 82].map((x) => (
        <circle key={x} cx={x + (x > 60 ? 4 : -4)} cy={190} r={2.2} fill={trim} />
      ))}
      {/* blouse + arms */}
      <rect x="44" y="62" width="32" height="40" rx="10" fill={shade(outfit, -0.06)} />
      <path d="M44 66 Q34 82 38 108" stroke={SKIN} strokeWidth="7" strokeLinecap="round" fill="none" />
      <path d="M76 66 Q86 82 82 108" stroke={SKIN} strokeWidth="7" strokeLinecap="round" fill="none" />
      <rect x="34" y="98" width="8" height="5" rx="2" fill={trim} />
      <rect x="78" y="98" width="8" height="5" rx="2" fill={trim} />
      {/* neck + head */}
      <rect x="55" y="50" width="10" height="14" fill={SKIN_SHADE} />
      <path d="M50 64 Q60 76 70 64" stroke={trim} strokeWidth="3" fill="none" />
      <circle cx="60" cy="38" r="15" fill={SKIN} />
      <path d="M45 37 Q47 20 60 21 Q73 20 75 37 Q71 28 60 28 Q49 28 45 37 Z" fill={HAIR} />
      <circle cx="60" cy="25" r="2.4" fill={trim} />
      <circle cx="54" cy="39" r="1.3" fill={HAIR} />
      <circle cx="66" cy="39" r="1.3" fill={HAIR} />
      <path d="M56 45 Q60 48 64 45" stroke="#8E3B3B" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      {/* dupatta over the head, falling to one side */}
      <path d="M42 34 Q44 14 60 12 Q78 13 80 34 L86 120 Q80 150 92 200 L84 202 Q70 150 74 110 L72 46 Q60 30 48 46 L46 110 Q40 140 30 170 L24 166 Q36 130 38 100 Z" fill={veil} opacity="0.82" />
      <path d="M42 34 Q44 14 60 12 Q78 13 80 34" stroke={trim} strokeWidth="2.4" fill="none" />
    </svg>
  );
}

/** Groom in a sherwani: `outfit` is the sherwani, `safa` the turban, `stole` the dupatta, `trim` buttons and brooch. */
export function Groom({ outfit, safa, stole, trim = "#C9A24B", className = "" }: { outfit: string; safa: string; stole?: string; trim?: string; className?: string }) {
  return (
    <svg viewBox="0 0 120 240" width="120" height="240" className={className} role="img" aria-label="Groom">
      {/* churidar + mojari */}
      <rect x="47" y="168" width="11" height="54" rx="4" fill={shade(outfit, 0.1)} />
      <rect x="62" y="168" width="11" height="54" rx="4" fill={shade(outfit, 0.1)} />
      <path d="M43 222 Q52 216 59 222 L59 228 L43 228 Z" fill={trim} />
      <path d="M61 222 Q68 216 77 222 L77 228 L61 228 Z" fill={trim} />
      {/* sherwani */}
      <path d="M40 66 Q60 58 80 66 L86 176 Q60 182 34 176 Z" fill={outfit} />
      <path d="M60 64 L60 178" stroke={shade(outfit, -0.12)} strokeWidth="1.5" />
      {[78, 92, 106, 120, 134].map((y) => (
        <circle key={y} cx="60" cy={y} r="1.9" fill={trim} />
      ))}
      <path d="M40 66 Q30 92 34 136" stroke={outfit} strokeWidth="9" strokeLinecap="round" fill="none" />
      <path d="M80 66 Q90 92 86 136" stroke={outfit} strokeWidth="9" strokeLinecap="round" fill="none" />
      <circle cx="34" cy="140" r="4" fill={SKIN} />
      <circle cx="86" cy="140" r="4" fill={SKIN} />
      {/* stole over one shoulder */}
      {stole ? <path d="M44 64 Q60 70 78 64 L84 72 Q66 110 50 168 L42 166 Q56 108 72 74 Q58 76 44 72 Z" fill={stole} opacity="0.9" /> : null}
      {/* collar + head */}
      <rect x="54" y="50" width="12" height="14" fill={SKIN_SHADE} />
      <rect x="52" y="60" width="16" height="6" rx="2" fill={shade(outfit, -0.08)} />
      <circle cx="60" cy="40" r="14" fill={SKIN} />
      <circle cx="54" cy="41" r="1.3" fill={HAIR} />
      <circle cx="66" cy="41" r="1.3" fill={HAIR} />
      <path d="M53 46 Q60 50 67 46 Q60 54 53 46 Z" fill={HAIR} opacity="0.85" />
      {/* safa */}
      <path d="M43 36 Q42 16 60 15 Q78 16 77 36 Q70 30 60 30 Q50 30 43 36 Z" fill={safa} />
      <path d="M44 28 Q60 20 76 28" stroke={shade(safa, -0.15)} strokeWidth="2" fill="none" />
      <path d="M46 22 Q60 15 74 22" stroke={shade(safa, -0.15)} strokeWidth="2" fill="none" />
      <circle cx="60" cy="21" r="3" fill={trim} />
      <path d="M60 18 Q66 8 62 4" stroke={trim} strokeWidth="1.6" fill="none" />
      <path d="M77 34 Q86 50 82 70" stroke={safa} strokeWidth="4" strokeLinecap="round" fill="none" />
    </svg>
  );
}

/** A family member in a saree and one in a kurta, smaller, for "family colors". */
export function Family({ a, b, className = "" }: { a: string; b: string; className?: string }) {
  return (
    <svg viewBox="0 0 160 200" width="160" height="200" className={className} role="img" aria-label="Family">
      {/* woman in saree */}
      <path d="M36 82 L64 82 L80 188 Q50 194 20 188 Z" fill={a} />
      <path d="M38 62 L62 62 L66 90 L34 90 Z" fill={shade(a, -0.08)} />
      <path d="M62 60 Q74 90 40 120 L30 114 Q58 92 56 62 Z" fill={shade(a, 0.08)} />
      <circle cx="50" cy="44" r="12" fill={SKIN} />
      <path d="M38 44 Q38 30 50 30 Q62 30 62 44 Q58 36 50 36 Q42 36 38 44 Z" fill={HAIR} />
      <circle cx="61" cy="46" r="5" fill={HAIR} />
      {/* man in kurta */}
      <rect x="100" y="150" width="9" height="40" rx="3" fill="#F6EFE2" />
      <rect x="112" y="150" width="9" height="40" rx="3" fill="#F6EFE2" />
      <path d="M94 66 Q110 60 126 66 L130 156 Q110 160 90 156 Z" fill={b} />
      <path d="M110 64 L110 104" stroke={shade(b, -0.15)} strokeWidth="1.4" />
      <circle cx="110" cy="46" r="12" fill={SKIN} />
      <path d="M98 44 Q98 32 110 32 Q122 32 122 44 Q118 38 110 38 Q102 38 98 44 Z" fill={HAIR} />
    </svg>
  );
}

/** Bride and groom under a simple arch in the decor colors. */
export function CoupleScene({
  bride,
  dupatta,
  groom,
  safa,
  decor,
  trim = "#C9A24B",
  className = "",
}: {
  bride: string;
  dupatta?: string;
  groom: string;
  safa: string;
  decor: string[];
  trim?: string;
  className?: string;
}) {
  const [d1, d2, d3] = [decor[0], decor[1] ?? decor[0], decor[2] ?? decor[1] ?? decor[0]];
  return (
    <svg viewBox="0 0 320 260" width="320" height="260" className={className} role="img" aria-label="Bride and groom in these colors">
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
      <g transform="translate(78 24) scale(0.95)">
        <Groom outfit={groom} safa={safa} trim={trim} />
      </g>
      <g transform="translate(130 24) scale(0.95)">
        <Bride outfit={bride} dupatta={dupatta} trim={trim} />
      </g>
    </svg>
  );
}
