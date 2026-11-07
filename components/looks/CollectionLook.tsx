"use client";

import { useEffect, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { engage as track } from "@/lib/engage";
import { PACKS, formatUSD, type PackId } from "@/lib/config";
import { flagField } from "@/lib/flagField";
import { LOOK_COLLECTIONS, type CollectionId } from "@/lib/lookCollections";
import { PhotoRow } from "../tools/LookPack";

/** Example gallery for a collection: one portrait per scene, painted once by an admin. */
export function CollectionGallery({ id }: { id: CollectionId }) {
  const c = LOOK_COLLECTIONS[id];
  const [samples, setSamples] = useState<Record<number, string>>({});
  const [admin, setAdmin] = useState(false);
  const [seeding, setSeeding] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/looks/collection/samples?c=${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) {
          setSamples(d.samples ?? {});
          setAdmin(!!d.admin);
        }
      })
      .catch(() => {});
  }, [id]);

  async function seed() {
    for (let i = 0; i < c.scenes.length; i++) {
      if (samples[i]) continue;
      setSeeding(c.scenes[i].name);
      try {
        const res = await fetch("/api/looks/collection/samples", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ collection: id, scene: i }),
        });
        const d = await res.json();
        if (res.ok) setSamples((s) => ({ ...s, [i]: d.url }));
      } catch {
        /* keep going */
      }
    }
    setSeeding(null);
  }

  const missing = c.scenes.some((_, i) => !samples[i]);
  return (
    <div>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {c.scenes.map((s, i) => (
          <li key={s.name} className="overflow-hidden rounded-2xl border border-gold/40 bg-white">
            <div className="relative aspect-[3/4]" style={{ background: `linear-gradient(160deg, ${s.hex}, #2a0d14)` }}>
              {samples[i] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={samples[i]} alt={`${c.name} portrait: ${s.name}`} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
              ) : (
                <span className="absolute inset-x-3 bottom-3 text-sm text-white/85">{s.saree.replace(/^an? /, "")}</span>
              )}
            </div>
            <p className="flex items-center gap-2 px-3 py-2 text-sm font-semibold">
              <span className="h-3 w-3 flex-none rounded-full ring-1 ring-black/10" style={{ background: s.hex }} aria-hidden="true" />
              {s.name}
            </p>
          </li>
        ))}
      </ul>
      {admin && missing ? (
        <button type="button" className="btn btn-ghost btn-sm mt-4" onClick={seed} disabled={!!seeding}>
          {seeding ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}{" "}
          {seeding ? `Painting the ${seeding} example…` : "Admin: paint the missing examples"}
        </button>
      ) : null}
    </div>
  );
}

/** Photos, glasses, pack, consent, then checkout. */
export function CollectionOrder({ id }: { id: CollectionId }) {
  const c = LOOK_COLLECTIONS[id];
  const [photos, setPhotos] = useState<string[]>([]);
  const [glasses, setGlasses] = useState<"remove" | "keep">("remove");
  const [packId, setPackId] = useState<PackId>(c.packs.find((p) => PACKS[p].highlight) ?? c.packs[0]);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [admin, setAdmin] = useState(false);
  const pack = PACKS[packId];

  useEffect(() => {
    fetch(`/api/looks/collection/samples?c=${id}`)
      .then((r) => r.json())
      .then((d) => setAdmin(!!d.admin))
      .catch(() => {});
  }, [id]);

  async function buy(free = false) {
    const fail = (msg: string, field: string) => {
      setError(msg);
      flagField(`[data-field="${field}"]`);
    };
    if (!photos.length) return fail("Add at least one photo of yourself.", "col-photos");
    if (!consent) return fail("Tick the box to confirm these are your photos and you're 18 or older.", "col-consent");
    setError(null);
    setBusy(true);
    track(free ? "collection_admin_free" : "collection_checkout", { collection: id, packId, photos: photos.length });
    try {
      const res = await fetch("/api/looks/collection", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ collection: id, packId, photos, glasses, consent, adminFree: free }),
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
        body: JSON.stringify({ kind: "pack", packId, albumId: data.albumId }),
      });
      const cd = await co.json();
      if (!co.ok || !cd.url) throw new Error(cd.error || "We couldn't start checkout.");
      window.location.href = cd.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      flagField("#col-error");
      setBusy(false);
    }
  }

  return (
    <section id="order" className="scroll-mt-24 overflow-hidden rounded-[24px] border border-gold/50 bg-white shadow-[0_30px_60px_-44px_rgba(74,13,26,0.6)] sm:rounded-[28px]" aria-labelledby="order-h">
      <div className="bg-maroon px-4 py-5 text-[#fff8ef] sm:px-8 sm:py-6">
        <h2 id="order-h" className="text-[1.9rem] text-gold-light sm:text-[2.3rem]">
          Get your {c.name} portraits
        </h2>
        <p className="mt-1 max-w-2xl text-[#f3e3d3]">Upload a few clear photos of yourself. Every portrait keeps your face, so it looks like you.</p>
      </div>
      <div className="grid gap-8 p-4 sm:p-8 lg:grid-cols-[1.1fr_1fr]">
        <div className="min-w-0">
          <p className="font-semibold">1. Your photos</p>
          <p className="mt-1 text-sm text-ink-soft">More angles give a closer likeness: a front selfie, a smile, a side view. Good light, no filters.</p>
          <div className="mt-3 p-1" data-field="col-photos">
            <PhotoRow
              label="Photos of you"
              hint="1 to 5"
              urls={photos}
              onChange={(u) => {
                setPhotos(u);
                if (u.length) setError(null);
              }}
            />
          </div>
          <p className="mt-6 font-semibold">2. Glasses</p>
          <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label="Glasses">
            <button type="button" className="chip" role="radio" aria-checked={glasses === "remove"} onClick={() => setGlasses("remove")}>
              Remove glasses
            </button>
            <button type="button" className="chip" role="radio" aria-checked={glasses === "keep"} onClick={() => setGlasses("keep")}>
              Keep my glasses
            </button>
          </div>
        </div>
        <div className="min-w-0">
          <p className="font-semibold">3. Choose your pack</p>
          <div className="mt-3 grid gap-3">
            {c.packs.map((pid) => {
              const p = PACKS[pid];
              const on = packId === pid;
              return (
                <button
                  key={pid}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setPackId(pid)}
                  className={`relative rounded-2xl border-2 p-4 text-left transition ${on ? "border-kumkum bg-[#fbf1ee]" : "border-line hover:border-gold"}`}
                >
                  {p.highlight && c.packs.length > 1 ? (
                    <span className="absolute -top-2.5 right-4 rounded-full bg-gold px-2.5 py-0.5 text-xs font-semibold text-maroon-deep">Most popular</span>
                  ) : null}
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="font-display text-2xl text-maroon">{p.images} portraits</span>
                    <span className="font-display text-2xl">{formatUSD(p.priceCents)}</span>
                  </span>
                  <span className="mt-1 block text-sm text-ink-soft">
                    {p.blurb} {p.freeRegens} free redos.
                  </span>
                </button>
              );
            })}
          </div>
          <label className="mt-4 flex gap-3 rounded-2xl bg-silk p-4 text-sm" data-field="col-consent">
            <input type="checkbox" className="mt-0.5 h-4 w-4 flex-none accent-[#9E1B32]" checked={consent} onChange={(e) => {
                setConsent(e.target.checked);
                if (e.target.checked && photos.length) setError(null);
              }}
            />
            <span>These are photos of me and I&apos;m 18 or older. Photos are deleted after 7 days; your portraits stay in your album.</span>
          </label>
          <button type="button" className="btn btn-primary mt-5 w-full" onClick={() => buy()} disabled={busy}>
            {busy ? <Loader2 size={18} className="animate-spin" /> : null}
            Get my {pack.images} portraits, {formatUSD(pack.priceCents)}
          </button>
          {admin ? (
            <button type="button" className="btn btn-ghost btn-sm mt-3 w-full" onClick={() => buy(true)} disabled={busy}>
              Admin: create these {pack.images} portraits free (no payment)
            </button>
          ) : null}
          {error ? (
            <p id="col-error" role="alert" className="mt-3 rounded-2xl bg-[#fbeaea] p-3 text-sm text-kumkum-deep">
              {error}
            </p>
          ) : null}
          <ul className="mt-4 space-y-1 text-sm text-ink-soft">
            <li>✓ No watermark, private album to share</li>
            <li>✓ Ready in about 10 minutes</li>
            <li>✓ Not happy with one? Redo it free</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
