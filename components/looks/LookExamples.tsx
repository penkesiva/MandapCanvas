"use client";

import { useEffect, useRef, useState } from "react";
import { LOOK_EXAMPLES, type LookExampleId } from "@/lib/lookExamples";

function loads(src: string) {
  return new Promise<boolean>((ok) => {
    const i = new Image();
    i.onload = () => ok(true);
    i.onerror = () => ok(false);
    i.src = src;
  });
}

const EVERY_MS = 4500;

/**
 * Before → after examples that rotate on their own: bride, then groom, then couple.
 * Only examples whose photos exist are shown. Pauses on hover, on focus, when off screen,
 * and for people who prefer reduced motion; the tabs and dots switch by hand.
 */
export function LookExamples({ initial = "bride", compact = false }: { initial?: LookExampleId; compact?: boolean }) {
  const ids = Object.keys(LOOK_EXAMPLES) as LookExampleId[];
  const [ready, setReady] = useState<LookExampleId[]>([initial]);
  const [on, setOn] = useState<LookExampleId>(initial);
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(true);
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    let alive = true;
    Promise.all(ids.map(async (id) => ((await loads(LOOK_EXAMPLES[id].after)) && (await loads(LOOK_EXAMPLES[id].before)) ? id : null))).then((r) => {
      if (!alive) return;
      const ok = r.filter((x): x is LookExampleId => !!x);
      if (ok.length) {
        setReady(ok);
        setOn((cur) => (ok.includes(cur) ? cur : ok[0]));
      }
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const el = root.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (ready.length < 2 || paused || !visible) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setTimeout(() => setOn((cur) => ready[(ready.indexOf(cur) + 1) % ready.length]), EVERY_MS);
    return () => window.clearTimeout(t);
  }, [on, ready, paused, visible]);

  const ex = LOOK_EXAMPLES[on];
  return (
    <figure
      ref={root}
      className="min-w-0"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Before and after examples"
    >
      {ready.length > 1 && !compact ? (
        <div className="mb-3 flex justify-center gap-2" role="tablist" aria-label="Examples">
          {ready.map((id) => (
            <button key={id} type="button" role="tab" aria-selected={on === id} className="chip" onClick={() => setOn(id)}>
              {LOOK_EXAMPLES[id].label}
            </button>
          ))}
        </div>
      ) : null}
      <div className="relative grid grid-cols-[0.78fr_1fr] items-center gap-3">
        <div className="relative aspect-[3/4] -rotate-2 overflow-hidden rounded-xl border-4 border-white shadow-lg">
          {ready.map((id) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={id}
              src={LOOK_EXAMPLES[id].before}
              alt={id === on ? LOOK_EXAMPLES[id].beforeAlt : ""}
              aria-hidden={id !== on}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${id === on ? "opacity-100" : "opacity-0"}`}
            />
          ))}
          <span className="absolute bottom-2 left-2 rounded-full bg-white/90 px-2 py-0.5 text-xs font-semibold text-ink">Their photo</span>
        </div>
        <div className="frame-gold relative aspect-[3/4] rotate-1 overflow-hidden rounded-2xl shadow-xl">
          {ready.map((id) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={id}
              src={LOOK_EXAMPLES[id].after}
              alt={id === on ? LOOK_EXAMPLES[id].afterAlt : ""}
              aria-hidden={id !== on}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${id === on ? "opacity-100" : "opacity-0"}`}
            />
          ))}
          <span className="absolute bottom-3 left-3 rounded-full bg-maroon/90 px-2.5 py-0.5 text-xs font-semibold text-gold-light">
            {ready.length > 1 ? `As a ${ex.label.toLowerCase()}` : "Their look"}
          </span>
        </div>
        <span className="absolute left-[43%] top-1/2 grid h-10 w-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-gold text-lg font-bold text-maroon-deep shadow-lg" aria-hidden="true">
          →
        </span>
      </div>
      {ready.length > 1 ? (
        <div className="mt-3 flex justify-center gap-1.5" aria-hidden={!compact}>
          {ready.map((id) => (
            <button
              key={id}
              type="button"
              tabIndex={compact ? 0 : -1}
              aria-label={`Show ${LOOK_EXAMPLES[id].label.toLowerCase()} example`}
              onClick={() => setOn(id)}
              className={`h-1.5 rounded-full transition-all ${id === on ? "w-6 bg-kumkum" : "w-1.5 bg-gold/50"}`}
            />
          ))}
        </div>
      ) : null}
      {!compact ? (
        <figcaption className="mt-2 text-center text-sm text-ink-soft" aria-live="polite">
          {ex.caption} <span className="text-xs">AI models, not customers.</span>
        </figcaption>
      ) : null}
    </figure>
  );
}
