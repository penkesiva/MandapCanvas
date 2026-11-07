"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ImagePlus, Loader2, X } from "lucide-react";
import { engage as track } from "@/lib/engage";
import { LOOK_PACKS, PACKS, formatUSD, type PackId } from "@/lib/config";
import { defaultLookEvents, getTradition, type LookEvent, type LookGlasses, type LookJewelry, type LookWho } from "@/lib/bridalLooks";
import { Bride, Groom } from "./Figures";
import { flagField } from "@/lib/flagField";

const EVENT_INFO: Record<LookEvent, { name: string; bride: string; dupatta?: string; groom: string; safa: string; bg: string }> = {
  haldi: { name: "Haldi", bride: "#F2C14E", dupatta: "#F2A33A", groom: "#FFF3C4", safa: "#F2A33A", bg: "#FFF4D6" },
  mehndi: { name: "Mehndi", bride: "#3E8E41", dupatta: "#E7849B", groom: "#F4E3B5", safa: "#3E8E41", bg: "#E9F4E4" },
  sangeet: { name: "Sangeet", bride: "#B03A84", dupatta: "#E5B8D6", groom: "#22335E", safa: "#B03A84", bg: "#F6E6F1" },
  garba: { name: "Garba", bride: "#D9341F", dupatta: "#F2B705", groom: "#1F7A4D", safa: "#F2B705", bg: "#FCEBD9" },
  ceremony: { name: "Wedding", bride: "#B3131B", dupatta: "#C2185B", groom: "#F6EFE2", safa: "#B3131B", bg: "#FBE7E1" },
  reception: { name: "Reception", bride: "#1F3A6B", dupatta: "#C9A24B", groom: "#1E1E2A", safa: "#1E1E2A", bg: "#E5EAF4" },
};

const ALL_EVENTS: LookEvent[] = ["haldi", "mehndi", "sangeet", "garba", "ceremony", "reception"];
const CEREMONY_NAME: Record<string, string> = {
  north: "Pheras",
  south: "Muhurtham",
  bengali: "Bibaho",
  punjabi: "Pheras",
  gujarati: "Hast Melap",
  marathi: "Lagna",
  nikah: "Nikah",
  modern: "Wedding",
};

type Slot = "bride" | "groom" | "couple";

/** Upsell from one free portrait to a full set across every event. */
export function LookPack({
  who,
  tradition,
  color,
  jewelry,
  glasses = "remove",
  firstPhoto,
  consented,
}: {
  who: LookWho;
  tradition: string;
  color: string;
  jewelry: LookJewelry;
  glasses?: LookGlasses;
  firstPhoto: string | null;
  consented: boolean;
}) {
  const [events, setEvents] = useState<LookEvent[]>(defaultLookEvents(tradition));
  const [photos, setPhotos] = useState<Record<Slot, string[]>>({ bride: [], groom: [], couple: [] });
  const [packId, setPackId] = useState<PackId>("look30");
  const [consent, setConsent] = useState(consented);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = getTradition(tradition);

  useEffect(() => setEvents(defaultLookEvents(tradition)), [tradition]);
  useEffect(() => setConsent((c) => c || consented), [consented]);

  // The photo from the free tool goes first in the matching slot.
  const mainSlot: Slot = who === "couple" ? "couple" : who;
  useEffect(() => {
    if (!firstPhoto) return;
    setPhotos((p) => (p[mainSlot].includes(firstPhoto) ? p : { ...p, [mainSlot]: [firstPhoto, ...p[mainSlot]].slice(0, 5) }));
  }, [firstPhoto, mainSlot]);

  const slots: { id: Slot; label: string; hint: string }[] =
    who === "couple"
      ? [
          { id: "couple", label: "Photos of you both", hint: "Up to 5" },
          { id: "bride", label: "The bride alone", hint: "Optional, up to 5" },
          { id: "groom", label: "The groom alone", hint: "Optional, up to 5" },
        ]
      : [{ id: who, label: who === "bride" ? "Photos of the bride" : "Photos of the groom", hint: "Up to 5" }];

  const enough =
    who === "couple" ? photos.couple.length > 0 || (photos.bride.length > 0 && photos.groom.length > 0) : photos[who].length > 0 || photos.couple.length > 0;
  const pack = PACKS[packId];

  async function buy() {
    const fail = (msg: string, field: string) => {
      setError(msg);
      flagField(`[data-field="${field}"]`);
    };
    if (!events.length) return fail("Pick at least one event.", "pack-events");
    if (!enough) return fail(who === "couple" ? "Add a photo of you both, or one photo of each of you." : "Add at least one photo.", "pack-photos");
    if (!consent) return fail("Tick the box to confirm the photos are of you, or that everyone in them agreed.", "pack-consent");
    setError(null);
    setBusy(true);
    track("look_pack_checkout", { packId, who, events: events.length });
    try {
      const res = await fetch("/api/looks", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ who, tradition, color, jewelry, glasses, events, packId, photos, consent }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
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
      flagField("#pack-error");
      setBusy(false);
    }
  }

  return (
    <section id="look-pack" className="mt-10 scroll-mt-24 overflow-hidden rounded-[24px] sm:rounded-[28px] border border-gold/50 bg-white shadow-[0_30px_60px_-44px_rgba(74,13,26,0.6)]" aria-labelledby="look-pack-h">
      <div className="bg-maroon px-4 py-5 text-[#fff8ef] sm:px-8 sm:py-6">
        <h2 id="look-pack-h" className="text-[1.9rem] text-gold-light sm:text-[2.3rem]">
          {who === "couple" ? "The two of you, at every event" : "You, at every event"}
        </h2>
        <p className="mt-1 max-w-2xl text-[#f3e3d3]">
          The same photos, a portrait for each event: yellow for the Haldi, mehndi hands, Sangeet sparkle, your {t.name} look for the{" "}
          {CEREMONY_NAME[tradition] ?? "wedding"}, couture for the reception.
        </p>
      </div>

      <div className="grid gap-8 p-4 sm:p-8 lg:grid-cols-[1.1fr_1fr]">
        <div className="min-w-0">
          <p className="font-semibold">1. Pick your events</p>
          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6" data-field="pack-events">
            {ALL_EVENTS.map((e) => {
              const info = EVENT_INFO[e];
              const on = events.includes(e);
              return (
                <button
                  key={e}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setEvents((x) => (on ? x.filter((y) => y !== e) : ALL_EVENTS.filter((y) => y === e || x.includes(y))))}
                  className={`relative flex flex-col items-center rounded-2xl border-2 pb-2 pt-2 text-xs font-semibold transition ${on ? "border-kumkum" : "border-line opacity-60 hover:opacity-100"}`}
                  style={{ background: info.bg }}
                >
                  <span className="flex h-16 items-end" aria-hidden="true">
                    {who !== "bride" ? <Groom outfit={info.groom} safa={info.safa} className={`h-16 w-8 ${who === "couple" ? "-mr-2.5" : ""}`} /> : null}
                    {who !== "groom" ? <Bride outfit={info.bride} dupatta={info.dupatta} className="h-16 w-8" /> : null}
                  </span>
                  {e === "ceremony" ? CEREMONY_NAME[tradition] ?? info.name : info.name}
                  {on ? (
                    <span className="pop-in absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-kumkum text-white">
                      <Check size={12} strokeWidth={3} />
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          <p className="mt-7 font-semibold">2. Add more photos for a closer likeness</p>
          <p className="mt-1 text-sm text-ink-soft">
            More angles keep the face consistent: a front selfie, a smile, a side view.
          </p>
          <div className="mt-3 space-y-4 p-1" data-field="pack-photos">
            {slots.map((s) => (
              <PhotoRow
                key={s.id}
                label={s.label}
                hint={s.hint}
                urls={photos[s.id]}
                onChange={(urls) => setPhotos((p) => ({ ...p, [s.id]: urls }))}
              />
            ))}
          </div>
        </div>

        <div className="min-w-0">
          <p className="font-semibold">3. Choose your pack</p>
          <div className="mt-3 grid gap-3">
            {LOOK_PACKS.map((id) => {
              const p = PACKS[id];
              const on = packId === id;
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setPackId(id)}
                  className={`relative rounded-2xl border-2 p-4 text-left transition ${on ? "border-kumkum bg-[#fbf1ee]" : "border-line hover:border-gold"}`}
                >
                  {p.highlight ? (
                    <span className="absolute -top-2.5 right-4 rounded-full bg-gold px-2.5 py-0.5 text-xs font-semibold text-maroon-deep">Most popular</span>
                  ) : null}
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="font-display text-2xl text-maroon">{p.images} portraits</span>
                    <span className="flex-none">
                      {p.listCents ? <s className="mr-1.5 text-sm text-ink-soft">{formatUSD(p.listCents)}</s> : null}
                      <span className="font-display text-2xl">{formatUSD(p.priceCents)}</span>
                    </span>
                  </span>
                  <span className="mt-1 block text-sm text-ink-soft">
                    {p.blurb} {p.freeRegens} free redos.
                  </span>
                </button>
              );
            })}
          </div>

          {!consented ? (
            <label className="mt-4 flex gap-3 rounded-2xl bg-silk p-4 text-sm" data-field="pack-consent">
              <input type="checkbox" className="mt-0.5 h-4 w-4 flex-none accent-[#9E1B32]" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
              <span>These are my photos, or everyone in them said yes, and we&apos;re 18 or older. Photos are deleted after 7 days; your portraits stay in your album.</span>
            </label>
          ) : null}

          <button type="button" className="btn btn-primary mt-5 w-full" onClick={buy} disabled={busy}>
            {busy ? <Loader2 size={18} className="animate-spin" /> : null}
            Get my {pack.images} portraits, {formatUSD(pack.priceCents)}
          </button>
          {error ? (
            <p id="pack-error" role="alert" className="mt-3 rounded-2xl bg-[#fbeaea] p-3 text-sm text-kumkum-deep">
              {error}
            </p>
          ) : null}
          <ul className="mt-4 space-y-1 text-sm text-ink-soft">
            <li>✓ {Math.max(1, Math.floor(pack.images / Math.max(1, events.length)))}+ portraits for each of your {events.length} events</li>
            <li>✓ No watermark, private album to share</li>
            <li>✓ Ready in about 10 minutes</li>
          </ul>
        </div>
      </div>
    </section>
  );
}

export function PhotoRow({ label, hint, urls, onChange }: { label: string; hint: string; urls: string[]; onChange: (u: string[]) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function add(files: FileList) {
    setErr(null);
    setBusy(true);
    const next = [...urls];
    for (const f of Array.from(files).slice(0, 5 - urls.length)) {
      try {
        const form = new FormData();
        form.set("kind", "look");
        form.set("file", f);
        const res = await fetch("/api/upload", { method: "POST", body: form });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Upload failed.");
        next.push(data.url);
        onChange([...next]);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Upload failed.");
      }
    }
    setBusy(false);
  }

  return (
    <div>
      <p className="flex items-baseline justify-between text-sm">
        <span className="font-semibold">{label}</span>
        <span className="text-xs text-ink-soft">
          {hint} · {urls.length}/5
        </span>
      </p>
      <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" multiple className="sr-only" onChange={(e) => e.target.files && add(e.target.files)} />
      <div className="mt-2 flex flex-wrap gap-2">
        {urls.map((u) => (
          <span key={u} className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={u} alt="" className="h-20 w-16 rounded-lg object-cover ring-1 ring-line" />
            <button
              type="button"
              onClick={() => onChange(urls.filter((x) => x !== u))}
              className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-ink text-white"
              aria-label="Remove photo"
            >
              <X size={12} />
            </button>
          </span>
        ))}
        {urls.length < 5 ? (
          <button
            type="button"
            onClick={() => ref.current?.click()}
            className="grid h-20 w-16 place-items-center rounded-lg border-2 border-dashed border-gold/70 bg-silk text-kumkum hover:border-kumkum"
            aria-label={`Add ${label.toLowerCase()}`}
          >
            {busy ? <Loader2 size={18} className="animate-spin" /> : <ImagePlus size={20} />}
          </button>
        ) : null}
      </div>
      {err ? <p className="mt-1 text-xs text-kumkum-deep">{err}</p> : null}
    </div>
  );
}
