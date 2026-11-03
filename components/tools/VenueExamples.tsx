"use client";

import { useEffect, useState } from "react";
import { BeforeAfter } from "../BeforeAfter";

/** Before → after examples for the venue tool. Files live in public/samples; pairs with a missing photo are skipped. */
const EXAMPLES = [
  {
    id: "hall",
    before: "/samples/venue-before.jpg",
    after: "/samples/venue-after.jpg",
    caption: "Banquet hall → Royal mandap",
    afterAlt: "The same hall decorated with a gold mandap, roses and chairs",
  },
  {
    id: "backyard",
    before: "/samples/venue-backyard-before.jpg",
    after: "/samples/venue-backyard-after.jpg",
    caption: "Backyard → Sangeet night",
    afterAlt: "The same backyard set up for a Sangeet with a stage, lounge seating and string lights",
  },
];

function loads(src: string) {
  return new Promise<boolean>((ok) => {
    const i = new Image();
    i.onload = () => ok(true);
    i.onerror = () => ok(false);
    i.src = src;
  });
}

export function VenueExamples() {
  const [ready, setReady] = useState<string[]>([]);
  useEffect(() => {
    let alive = true;
    Promise.all(EXAMPLES.map(async (e) => ((await loads(e.before)) && (await loads(e.after)) ? e.id : null))).then((r) => {
      if (alive) setReady(r.filter((x): x is string => !!x));
    });
    return () => {
      alive = false;
    };
  }, []);
  const shown = EXAMPLES.filter((e) => ready.includes(e.id));
  if (!shown.length) return null;
  return (
    <section className="mt-16" aria-labelledby="examples-h">
      <h2 id="examples-h" className="text-[2rem]">
        Before and after
      </h2>
      <p className="mt-1 text-ink-soft">Drag the slider. Same space, same walls, decorated.</p>
      <div className={`mt-6 grid gap-6 ${shown.length > 1 ? "md:grid-cols-2" : "max-w-2xl"}`}>
        {shown.map((e) => (
          <figure key={e.id} className="min-w-0">
            <BeforeAfter before={e.before} after={e.after} beforeAlt="The space before decorating" afterAlt={e.afterAlt} beforeLabel="Before" afterLabel="After" />
            <figcaption className="mt-2 text-sm font-semibold text-ink">{e.caption}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
