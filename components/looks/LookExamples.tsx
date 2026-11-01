"use client";

import { useEffect, useState } from "react";
import { LOOK_EXAMPLES, type LookExampleId } from "@/lib/lookExamples";

function loads(src: string) {
  return new Promise<boolean>((ok) => {
    const i = new Image();
    i.onload = () => ok(true);
    i.onerror = () => ok(false);
    i.src = src;
  });
}

/** Before → after examples with Bride / Groom / Couple tabs. Only examples whose photos exist are shown. */
export function LookExamples({ initial = "bride", compact = false }: { initial?: LookExampleId; compact?: boolean }) {
  const ids = Object.keys(LOOK_EXAMPLES) as LookExampleId[];
  const [ready, setReady] = useState<LookExampleId[]>(["bride"]);
  const [on, setOn] = useState<LookExampleId>(initial);

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

  const ex = LOOK_EXAMPLES[on];
  return (
    <figure className="min-w-0">
      {ready.length > 1 ? (
        <div className="mb-3 flex justify-center gap-2" role="tablist" aria-label="Examples">
          {ready.map((id) => (
            <button key={id} type="button" role="tab" aria-selected={on === id} className="chip" onClick={() => setOn(id)}>
              {LOOK_EXAMPLES[id].label}
            </button>
          ))}
        </div>
      ) : null}
      <div className="relative grid grid-cols-[0.78fr_1fr] items-center gap-3">
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ex.before} alt={ex.beforeAlt} className="aspect-[3/4] w-full -rotate-2 rounded-xl border-4 border-white object-cover shadow-lg" />
          <span className="absolute bottom-2 left-2 rounded-full bg-white/90 px-2 py-0.5 text-xs font-semibold text-ink">Their photo</span>
        </div>
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ex.after} alt={ex.afterAlt} className="frame-gold aspect-[3/4] w-full rotate-1 rounded-2xl object-cover shadow-xl" />
          <span className="absolute bottom-3 left-3 rounded-full bg-maroon/90 px-2.5 py-0.5 text-xs font-semibold text-gold-light">Their look</span>
        </div>
        <span className="absolute left-[43%] top-1/2 grid h-10 w-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-gold text-lg font-bold text-maroon-deep shadow-lg" aria-hidden="true">
          →
        </span>
      </div>
      {!compact ? (
        <figcaption className="mt-3 text-center text-sm text-ink-soft">
          {ex.caption} <span className="text-xs">AI-generated models, not customers.</span>
        </figcaption>
      ) : null}
    </figure>
  );
}
