/**
 * Decorative pieces drawn from Indian wedding craft: a lotus divider, a rangoli-style mandala
 * and paisley corners. All are aria-hidden and purely ornamental.
 */

export function Divider({ className = "", tone = "gold" }: { className?: string; tone?: "gold" | "light" }) {
  const c = tone === "light" ? "#ecd08a" : "#b8923a";
  return (
    <div className={`flex items-center justify-center gap-3 ${className}`} aria-hidden="true">
      <span className="h-px w-16 sm:w-28" style={{ background: `linear-gradient(90deg, transparent, ${c})` }} />
      <svg width="64" height="22" viewBox="0 0 64 22" fill="none">
        <path d="M2 11h12M50 11h12" stroke={c} strokeWidth="1.2" />
        <path d="M17 11l3-3 3 3-3 3z" fill={c} />
        <path d="M41 11l3-3 3 3-3 3z" fill={c} />
        {/* lotus */}
        <path d="M32 3c3 3 3.6 7.5 0 13-3.6-5.5-3-10 0-13z" fill={c} />
        <path d="M32 16c-1.5-4.5-4.5-7-8.5-7.5 0.8 4.5 3.8 7 8.5 7.5z" fill={c} opacity="0.75" />
        <path d="M32 16c1.5-4.5 4.5-7 8.5-7.5-0.8 4.5-3.8 7-8.5 7.5z" fill={c} opacity="0.75" />
        <path d="M25 18.5h14" stroke={c} strokeWidth="1.2" strokeLinecap="round" />
      </svg>
      <span className="h-px w-16 sm:w-28" style={{ background: `linear-gradient(90deg, ${c}, transparent)` }} />
    </div>
  );
}

/** A large, faint rangoli mandala for section backgrounds. */
export function Mandala({ className = "", color = "#b8923a", opacity = 0.18 }: { className?: string; color?: string; opacity?: number }) {
  const ring = (n: number, r: number, rx: number, ry: number) =>
    Array.from({ length: n }, (_, i) => (
      <ellipse key={`${r}-${i}`} cx="0" cy={-r} rx={rx} ry={ry} transform={`rotate(${(360 / n) * i})`} />
    ));
  return (
    <svg className={`pointer-events-none ${className}`} viewBox="-200 -200 400 400" aria-hidden="true">
      <g fill="none" stroke={color} strokeOpacity={opacity} strokeWidth="1.2">
        <circle r="196" />
        <circle r="186" strokeDasharray="2 6" />
        {ring(32, 165, 9, 20)}
        <circle r="142" />
        {ring(24, 120, 11, 24)}
        <circle r="94" />
        {ring(16, 74, 10, 22)}
        <circle r="50" strokeDasharray="3 5" />
        {ring(8, 30, 9, 18)}
        <circle r="10" />
      </g>
    </svg>
  );
}

/** Paisley-and-dot flourish for the corners of a framed image. Rotate per corner. */
export function Corner({ className = "" }: { className?: string }) {
  return (
    <svg className={`pointer-events-none ${className}`} width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path d="M4 60V20C4 11 11 4 20 4h40" stroke="#b8923a" strokeWidth="1.6" />
      <path d="M10 60V24c0-8 6-14 14-14h36" stroke="#b8923a" strokeWidth="0.9" opacity="0.7" />
      <path d="M17 17c7-3 14 1 13 8-1 5-7 6-9 2-1-2 1-4 3-3" stroke="#b8923a" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="40" cy="10" r="1.8" fill="#b8923a" />
      <circle cx="48" cy="10" r="1.4" fill="#b8923a" />
      <circle cx="10" cy="40" r="1.8" fill="#b8923a" />
      <circle cx="10" cy="48" r="1.4" fill="#b8923a" />
    </svg>
  );
}

/** Centered section heading with a lotus divider above it. */
export function SectionTitle({
  title,
  intro,
  tone = "dark",
  className = "",
}: {
  title: string;
  intro?: string;
  tone?: "dark" | "light";
  className?: string;
}) {
  return (
    <div className={`mx-auto max-w-2xl text-center ${className}`}>
      <Divider tone={tone === "light" ? "light" : "gold"} className="mb-4" />
      <h2 className={`text-[2.2rem] sm:text-[2.8rem] ${tone === "light" ? "text-[#fff8ef]" : ""}`}>{title}</h2>
      {intro ? <p className={`mt-3 text-lg ${tone === "light" ? "text-[#f3e3d3]" : "text-ink-soft"}`}>{intro}</p> : null}
    </div>
  );
}
