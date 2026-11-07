"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** The reveal sweep played once when the slider scrolls into view: [position %, ms to get there]. */
const SWEEP: [number, number][] = [
  [88, 800],
  [12, 1300],
  [50, 800],
];
const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

/**
 * Drag (or use arrow keys) to reveal the photo-real preview over the hand sketch.
 * The divider is a strand of marigolds. The first time it comes into view it sweeps
 * right and left once to show the reveal; touching it stops the sweep. Skipped for reduced motion.
 */
export function BeforeAfter({
  before,
  after,
  beforeAlt,
  afterAlt,
  priority = false,
  beforeLabel = "Your sketch",
  afterLabel = "Your preview",
  aspect = "4 / 3",
}: {
  before: string;
  after: string;
  beforeAlt: string;
  afterAlt: string;
  priority?: boolean;
  beforeLabel?: string;
  afterLabel?: string;
  /** CSS aspect-ratio, e.g. "16 / 9". */
  aspect?: string;
}) {
  const [pos, setPos] = useState(50);
  const box = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const touched = useRef(false);

  useEffect(() => {
    const el = box.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let delay = 0;
    const play = () => {
      let seg = 0;
      let from = 50;
      let start = performance.now();
      const step = (now: number) => {
        if (touched.current) return;
        const [to, ms] = SWEEP[seg];
        const t = Math.min(1, (now - start) / ms);
        setPos(from + (to - from) * ease(t));
        if (t < 1) return void (raf = requestAnimationFrame(step));
        seg += 1;
        if (seg >= SWEEP.length) return;
        from = to;
        start = now;
        raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        delay = window.setTimeout(play, 350);
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      clearTimeout(delay);
      cancelAnimationFrame(raf);
    };
  }, []);

  const moveTo = useCallback((clientX: number) => {
    const r = box.current?.getBoundingClientRect();
    if (!r) return;
    setPos(Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100)));
  }, []);

  return (
    <div
      ref={box}
      style={{ aspectRatio: aspect }}
      className="relative w-full touch-pan-y select-none overflow-hidden rounded-[24px] bg-silk"
      onPointerDown={(e) => {
        touched.current = true;
        dragging.current = true;
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        moveTo(e.clientX);
      }}
      onPointerMove={(e) => dragging.current && moveTo(e.clientX)}
      onPointerUp={() => (dragging.current = false)}
      onPointerCancel={() => (dragging.current = false)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={after} alt={afterAlt} className="absolute inset-0 h-full w-full object-cover" fetchPriority={priority ? "high" : "auto"} draggable={false} />
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={before} alt={beforeAlt} className="absolute inset-0 h-full w-full object-cover" draggable={false} />
      </div>

      <span className="pointer-events-none absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-ink">
        {beforeLabel}
      </span>
      <span className="pointer-events-none absolute right-4 top-4 rounded-full bg-ink/80 px-3 py-1 text-xs font-semibold text-white">
        {afterLabel}
      </span>

      <div className="pointer-events-none absolute inset-y-0" style={{ left: `calc(${pos}% - 9px)` }}>
        <div className="garland h-full w-[18px] drop-shadow-[0_0_6px_rgba(0,0,0,0.25)]" />
      </div>
      <button
        type="button"
        role="slider"
        aria-label={`Compare ${beforeLabel.toLowerCase()} and ${afterLabel.toLowerCase()}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pos)}
        onKeyDown={(e) => {
          touched.current = true;
          if (e.key === "ArrowLeft") setPos((p) => Math.max(0, p - 5));
          if (e.key === "ArrowRight") setPos((p) => Math.min(100, p + 5));
        }}
        className="absolute top-1/2 grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize place-items-center rounded-full border-[3px] border-marigold bg-kumkum text-white shadow-lg"
        style={{ left: `${pos}%` }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M9 6l-6 6 6 6M15 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
