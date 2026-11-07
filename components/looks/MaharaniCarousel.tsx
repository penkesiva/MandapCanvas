"use client";

import { useEffect, useRef, useState } from "react";
import { LOOK_COLLECTIONS } from "@/lib/lookCollections";

const EVERY_MS = 2500;

/**
 * The twelve Maharani example portraits, crossfading every 2.5 seconds.
 * Pauses while the mouse is over it, while a finger is held on it (touch and hold),
 * while it has keyboard focus, when it's off screen, and for people who prefer reduced motion.
 */
export function MaharaniCarousel({ className = "" }: { className?: string }) {
  const scenes = LOOK_COLLECTIONS.maharani.scenes;
  const [on, setOn] = useState(0);
  const [hover, setHover] = useState(false);
  const [held, setHeld] = useState(false);
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(true);
  const root = useRef<HTMLDivElement>(null);
  const paused = hover || held || focused || !visible;

  useEffect(() => {
    const el = root.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (paused) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setTimeout(() => setOn((i) => (i + 1) % scenes.length), EVERY_MS);
    return () => window.clearTimeout(t);
  }, [on, paused, scenes.length]);

  const scene = scenes[on];
  return (
    <div
      ref={root}
      className={`min-w-0 ${className}`}
      aria-roledescription="carousel"
      aria-label="Maharani example portraits"
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      <div
        className="frame-gold relative aspect-[3/4] select-none overflow-hidden rounded-[22px] shadow-xl [-webkit-touch-callout:none]"
        onPointerEnter={(e) => e.pointerType === "mouse" && setHover(true)}
        onPointerLeave={() => {
          setHover(false);
          setHeld(false);
        }}
        onPointerDown={(e) => e.pointerType !== "mouse" && setHeld(true)}
        onPointerUp={() => setHeld(false)}
        onPointerCancel={() => setHeld(false)}
        onContextMenu={(e) => e.preventDefault()}
      >
        {scenes.map((s, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={s.name}
            src={`/samples/maharani/scene-${i + 1}.jpg`}
            alt={i === on ? `Maharani portrait: ${s.name}` : ""}
            aria-hidden={i !== on}
            draggable={false}
            loading={i < 2 ? "eager" : "lazy"}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${i === on ? "opacity-100" : "opacity-0"}`}
          />
        ))}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent px-4 pb-3 pt-10" aria-live="polite">
          <p className="font-display text-lg text-gold-light">{scene.name}</p>
          <p className="text-xs text-white/85 first-letter:uppercase">{scene.saree.replace(/^an? /, "").split(" with ")[0]}</p>
        </div>
        {paused && (hover || held) ? (
          <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-black/45 px-2 py-0.5 text-[11px] font-semibold text-white">Paused</span>
        ) : null}
      </div>
      <div className="mt-3 flex flex-wrap justify-center gap-1.5">
        {scenes.map((s, i) => (
          <button
            key={s.name}
            type="button"
            aria-label={`Show ${s.name}`}
            aria-current={i === on}
            onClick={() => setOn(i)}
            className={`h-1.5 rounded-full transition-all ${i === on ? "w-6 bg-kumkum" : "w-1.5 bg-gold/50 hover:bg-gold"}`}
          />
        ))}
      </div>
    </div>
  );
}
