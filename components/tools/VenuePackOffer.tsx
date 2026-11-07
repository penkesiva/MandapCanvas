"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { engage as track } from "@/lib/engage";
import { PACKS, formatUSD } from "@/lib/config";
import { VENUE_EVENTS, venuePackStyles } from "@/lib/venueDecor";
import type { EventId } from "@/lib/types";
import { flagField } from "@/lib/flagField";

const PACK = PACKS.venue9;

/** The paid Venue pack: their own space, decorated for one event in nine styles. */
export function VenuePackOffer({
  photo,
  event,
  palette,
  admin,
  onNeedPhoto,
}: {
  photo: string | null;
  event: EventId;
  palette: string;
  admin: boolean;
  onNeedPhoto: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const styles = venuePackStyles(event);
  const evName = VENUE_EVENTS.find((e) => e.id === event)?.name ?? "event";

  async function order(free = false) {
    if (!photo) {
      onNeedPhoto();
      return;
    }
    setError(null);
    setBusy(true);
    track(free ? "venue_pack_admin_free" : "venue_pack_checkout", { event, palette });
    try {
      const res = await fetch("/api/tools/venue-decor/pack", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ photoUrl: photo, event, palette, adminFree: free }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      if (data.redirect) {
        window.location.href = data.redirect;
        return;
      }
      const co = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind: "pack", packId: PACK.id, albumId: data.albumId }),
      });
      const cd = await co.json();
      if (!co.ok || !cd.url) throw new Error(cd.error || "We couldn't start checkout.");
      window.location.href = cd.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      flagField("#venue-pack-error");
      setBusy(false);
    }
  }

  return (
    <section id="venue-pack" className="mt-4 overflow-hidden rounded-[22px] border border-gold/60 bg-white" aria-labelledby="venue-pack-h">
      <div className="flex items-baseline justify-between gap-3 bg-[#2a0b14] px-5 py-4 text-[#fff8ef]">
        <h2 id="venue-pack-h" className="font-display text-xl text-gold-light">
          Your space, {styles.length} ways
        </h2>
        <span className="flex-none rounded-full bg-[linear-gradient(#f2d98c,#c9a24b)] px-2.5 py-0.5 text-sm font-semibold text-[#3b0a15]">{formatUSD(PACK.priceCents)}</span>
      </div>
      <div className="p-5">
        <p className="text-sm text-ink-soft">
          Your {evName.toLowerCase()} in your own venue, decorated in each of these styles. Same walls, same windows, so you can compare looks before you
          talk to a decorator.
        </p>
        <ul className="mt-3 grid grid-cols-3 gap-1.5" aria-label="The styles in your pack">
          {styles.map((s) => (
            <li key={s.id} className="relative overflow-hidden rounded-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.image} alt="" className="aspect-[4/3] w-full object-cover" loading="lazy" />
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-1.5 pb-1 pt-4 text-[11px] font-semibold leading-tight text-white">
                {s.name}
              </span>
            </li>
          ))}
        </ul>
        <button type="button" className="btn btn-primary mt-4 w-full" onClick={() => order()} disabled={busy}>
          {busy ? <Loader2 size={18} className="animate-spin" /> : null}
          {photo ? `Decorate my venue ${styles.length} ways, ${formatUSD(PACK.priceCents)}` : "Add your venue photo first"}
        </button>
        <p className="mt-2 text-xs text-ink-soft">
          Uses your colors from step 4. {PACK.freeRegens} free redos, no watermark, private album.
        </p>
        {admin && photo ? (
          <button type="button" className="btn btn-ghost btn-sm mt-2" onClick={() => order(true)} disabled={busy}>
            Admin: make this pack free
          </button>
        ) : null}
        {error ? (
          <p id="venue-pack-error" role="alert" className="mt-3 rounded-2xl bg-[#fbeaea] p-3 text-sm text-kumkum-deep">
            {error}
          </p>
        ) : null}
      </div>
    </section>
  );
}
