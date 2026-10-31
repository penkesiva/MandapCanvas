"use client";

import { readJson } from "@/lib/readJson";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { track } from "@vercel/analytics";
import { AlertCircle, Check, ImagePlus, Loader2, Minus, Plus, Sparkles, Upload } from "lucide-react";
import { SketchCanvas, type SketchCanvasHandle } from "./SketchCanvas";
import { ALBUM_PACKS, PACKS, AI_LABEL, formatUSD, type PackId } from "@/lib/config";
import { CATEGORIES, DECOR_PRESETS, PALETTES, STYLE_TIERS, TRADITIONS, defaultMix, eventLabel, mixTotal } from "@/lib/catalog";
import type { DecorSource, EventId, LightingMode, PeopleMode, ShotMix, TraditionId, VenueMode } from "@/lib/types";

type PreviewShot = { id: string; url?: string; status: string; category: string; event: EventId };

interface WizardState {
  decorSource: DecorSource;
  decorImageUrl?: string;
  presetId: string;
  applyToAllEvents: boolean;
  tradition: TraditionId;
  events: EventId[];
  palettes: string[];
  venue: VenueMode;
  lighting: LightingMode;
  notes: string;
  peopleMode: PeopleMode;
  brideUrl?: string;
  groomUrl?: string;
  consent: boolean;
  packId: PackId;
  mix: ShotMix;
  title: string;
  clientName: string;
  inventoryUrls: string[];
}

const STEPS = ["Decor", "Wedding", "People", "Album", "Preview"] as const;
const STORAGE_KEY = "mc:wizard:v1";

const DEFAULT_PRESET = "floral_classic";

function initialState(pack: PackId, style?: string): WizardState {
  return {
    decorSource: style ? "preset" : "sketch",
    presetId: style ?? DEFAULT_PRESET,
    applyToAllEvents: false,
    tradition: "hindu_north",
    events: ["mehndi", "sangeet", "ceremony", "reception"],
    palettes: ["blush_ivory", "emerald_gold"],
    venue: "mixed",
    lighting: "mixed",
    notes: "",
    peopleMode: "silhouette",
    consent: false,
    packId: pack,
    mix: defaultMix(PACKS[pack].images),
    title: "",
    clientName: "",
    inventoryUrls: [],
  };
}

async function uploadFile(file: Blob, kind: string): Promise<string> {
  const form = new FormData();
  form.append("file", file, kind === "sketch" ? "sketch.png" : "upload.jpg");
  form.append("kind", kind);
  const res = await fetch("/api/upload", { method: "POST", body: form });
  const data = await readJson(res);
  if (!res.ok || !data.ok) throw new Error(data.error || "Upload failed.");
  return data.url as string;
}

export function CreateWizard({
  initialPack,
  initialStyle,
  mode,
  credits,
  plan,
  inventory = [],
}: {
  initialPack: PackId;
  initialStyle?: string;
  mode: "couple" | "proposal";
  credits: number;
  plan: string | null;
  inventory?: { id: string; url: string; label: string }[];
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [s, setS] = useState<WizardState>(() => initialState(initialPack, initialStyle));
  const [hydrated, setHydrated] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [albumId, setAlbumId] = useState<string | null>(null);
  const [albumKey, setAlbumKey] = useState<string | null>(null);
  const [previews, setPreviews] = useState<PreviewShot[]>([]);
  const [sketchDirty, setSketchDirty] = useState(false);
  const canvas = useRef<SketchCanvasHandle>(null);
  const topRef = useRef<HTMLDivElement>(null);

  // Restore an in-progress draft (per-browser convenience only).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<WizardState>;
        // A style picked on the home page wins over the saved draft's decor choice.
        setS((cur) => ({
          ...cur,
          ...saved,
          packId: saved.packId ?? cur.packId,
          ...(initialStyle ? { decorSource: "preset" as const, presetId: initialStyle } : {}),
        }));
      }
    } catch {
      /* storage unavailable */
    }
    setHydrated(true);
  }, [initialStyle]);
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    } catch {
      /* ignore */
    }
  }, [s, hydrated]);

  const update = useCallback(<K extends keyof WizardState>(k: K, v: WizardState[K]) => setS((cur) => ({ ...cur, [k]: v })), []);
  const pack = PACKS[s.packId];
  const tradition = TRADITIONS.find((t) => t.id === s.tradition)!;
  const total = mixTotal(s.mix);

  const go = (n: number) => {
    setError(null);
    setStep(n);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  /* -------- step validation + side effects */

  const finishDecor = async () => {
    if (s.decorSource === "sketch") {
      if (canvas.current && !canvas.current.isEmpty() && (sketchDirty || !s.decorImageUrl)) {
        setBusy("Saving your sketch…");
        try {
          const blob = await canvas.current.toBlob();
          if (!blob) throw new Error("Couldn't read the drawing.");
          const url = await uploadFile(blob, "sketch");
          update("decorImageUrl", url);
          setSketchDirty(false);
        } catch (e) {
          setError(e instanceof Error ? e.message : "Upload failed.");
          setBusy(null);
          return;
        }
        setBusy(null);
      } else if (!s.decorImageUrl) {
        setError("Draw something first, start from an outline, or choose a different option.");
        return;
      }
    }
    if (s.decorSource === "upload" && !s.decorImageUrl) {
      setError("Upload a sketch or photo first.");
      return;
    }
    go(1);
  };

  const finishWedding = () => {
    if (!s.events.length) return setError("Pick at least one event.");
    if (!s.palettes.length) return setError("Pick at least one palette.");
    go(2);
  };

  const finishPeople = () => {
    if (s.peopleMode === "likeness") {
      if (!s.brideUrl && !s.groomUrl) return setError("Add at least one photo, or choose soft faces.");
      if (!s.consent) return setError("Please confirm you have permission to use these photos.");
    }
    go(3);
  };

  const setPack = (id: PackId) => {
    const p = PACKS[id];
    setS((cur) => ({
      ...cur,
      packId: id,
      mix: defaultMix(p.images),
      events: cur.events.slice(0, p.maxEvents),
      palettes: cur.palettes.slice(0, p.maxPalettes),
    }));
  };

  const configPayload = useMemo(
    () => ({
      tradition: s.tradition,
      events: s.events,
      palettes: s.palettes,
      venue: s.venue,
      lighting: s.lighting,
      notes: s.notes,
      decor: {
        source: s.decorSource,
        imageUrl: s.decorSource === "preset" ? undefined : s.decorImageUrl,
        presetId: s.decorSource === "preset" ? s.presetId : undefined,
        applyToAllEvents: s.applyToAllEvents,
      },
      people: { mode: s.peopleMode, brideUrl: s.brideUrl, groomUrl: s.groomUrl, consent: s.consent },
      mix: s.mix,
      inventoryUrls: mode === "proposal" ? s.inventoryUrls : [],
    }),
    [s, mode],
  );
  const configKey = JSON.stringify([configPayload, s.packId]);

  const finishAlbum = async () => {
    if (total !== pack.images) return setError(`Your mix adds up to ${total}. Adjust it to ${pack.images}.`);
    setBusy("Setting up your album…");
    setError(null);
    try {
      let id = albumId;
      if (!id || albumKey !== configKey) {
        const res = await fetch("/api/albums", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ packId: s.packId, config: configPayload, title: s.title, clientName: s.clientName, kind: mode }),
        });
        const data = await readJson(res);
        if (!res.ok || !data.ok) throw new Error(data.error || "Couldn't create the album.");
        id = data.album.id as string;
        setAlbumId(id);
        setAlbumKey(configKey);
        setPreviews([]);
      } else if (s.title) {
        await fetch(`/api/albums/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: s.title, clientName: s.clientName }) });
      }
      setBusy(null);
      go(4);
      if (mode === "couple" && (albumKey !== configKey || previews.length === 0)) void runPreview(id!);
    } catch (e) {
      setBusy(null);
      setError(e instanceof Error ? e.message : "Something went wrong.");
    }
  };

  const runPreview = async (id: string) => {
    setBusy("Creating your two free previews. This takes about a minute…");
    setError(null);
    track("preview_started", { pack: s.packId, tradition: s.tradition });
    try {
      const res = await fetch(`/api/albums/${id}/preview`, { method: "POST" });
      const data = await readJson(res);
      if (!res.ok || !data.ok) throw new Error(data.error || "Preview failed.");
      setPreviews(data.album.previews);
      track("preview_done", { pack: s.packId });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Preview failed.");
    } finally {
      setBusy(null);
    }
  };

  const checkout = async () => {
    if (!albumId) return;
    setBusy("Opening secure checkout…");
    setError(null);
    track("checkout_started", { pack: s.packId });
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "pack", packId: s.packId, albumId }),
      });
      const data = await readJson(res);
      if (!res.ok || !data.ok) throw new Error(data.error || "Checkout failed.");
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {}
      window.location.href = data.url;
    } catch (e) {
      setBusy(null);
      setError(e instanceof Error ? e.message : "Checkout failed.");
    }
  };

  const createProposal = async () => {
    if (!albumId) return;
    setBusy("Creating the proposal…");
    setError(null);
    try {
      const res = await fetch(`/api/albums/${albumId}/fund`, { method: "POST" });
      const data = await readJson(res);
      if (!res.ok || !data.ok) throw new Error(data.error || "Couldn't create the proposal.");
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {}
      router.push(`/album/${albumId}`);
    } catch (e) {
      setBusy(null);
      setError(e instanceof Error ? e.message : "Something went wrong.");
    }
  };

  /* -------- render */

  return (
    <div ref={topRef} className="mx-auto max-w-5xl scroll-mt-24 px-4 pb-24 pt-8 sm:px-6">
      <div className="mb-8">
        <h1 className="text-[2.2rem] sm:text-[2.8rem]">{mode === "proposal" ? "New client proposal" : "Create your wedding album"}</h1>
        <ol className="mt-5 flex flex-wrap gap-2" aria-label="Steps">
          {STEPS.map((label, i) => (
            <li key={label}>
              <button
                type="button"
                onClick={() => i < step && go(i)}
                disabled={i > step}
                aria-current={i === step ? "step" : undefined}
                className={`flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium ${
                  i === step ? "bg-ink text-white" : i < step ? "bg-white text-ink hover:bg-silk" : "text-ink-soft"
                }`}
              >
                <span className={`grid h-5 w-5 place-items-center rounded-full text-[0.7rem] ${i < step ? "bg-mehndi text-white" : i === step ? "bg-marigold text-ink" : "border border-line"}`}>
                  {i < step ? <Check size={12} /> : i + 1}
                </span>
                {label}
              </button>
            </li>
          ))}
        </ol>
      </div>

      {error ? (
        <div role="alert" className="mb-6 flex items-start gap-3 rounded-2xl border border-kumkum/30 bg-[#fdecee] px-4 py-3 text-kumkum-deep">
          <AlertCircle className="mt-0.5 flex-none" size={18} />
          <p>{error}</p>
        </div>
      ) : null}

      {(
        <section aria-labelledby="decor-h" hidden={step !== 0}>
          <h2 id="decor-h" className="text-2xl">Start with the decor you have in mind</h2>
          <div className="mt-4 flex flex-wrap gap-2" role="radiogroup" aria-label="Decor source">
            {(
              [
                ["sketch", "Draw it here"],
                ["upload", "Upload a sketch or photo"],
                ["preset", "Pick a style"],
              ] as [DecorSource, string][]
            ).map(([id, label]) => (
              <button key={id} type="button" role="radio" aria-checked={s.decorSource === id} className="chip" onClick={() => update("decorSource", id)}>
                {label}
              </button>
            ))}
          </div>

          <div className="mt-6">
            {s.decorSource === "sketch" && (
              <>
                {s.decorImageUrl && !sketchDirty ? (
                  <div className="mb-4 flex items-center gap-4 rounded-2xl border border-line bg-white p-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={s.decorImageUrl} alt="Your saved sketch" className="h-16 w-20 rounded-lg object-cover" />
                    <p className="text-sm text-ink-soft">We kept your last sketch. Draw below to replace it.</p>
                  </div>
                ) : null}
                <SketchCanvas ref={canvas} onChange={() => setSketchDirty(true)} />
                <p className="mt-3 text-sm text-ink-soft">
                  Rough is fine. Shapes, symmetry and color washes matter more than detail. Notes like &ldquo;marigold strings&rdquo; help too.
                </p>
              </>
            )}
            {s.decorSource === "upload" && (
              <ImageDrop
                label="Upload a hand sketch, a decorator's drawing, or a photo of a mandap you love"
                kind="decor"
                value={s.decorImageUrl}
                onUploaded={(url) => update("decorImageUrl", url)}
                onError={setError}
              />
            )}
            {s.decorSource === "preset" && (
              <div role="radiogroup" aria-label="Decor style" className="space-y-7">
                {STYLE_TIERS.map((t) => (
                <div key={t.id}>
                  <p className="mb-3 flex items-baseline gap-3">
                    <span className="font-display text-xl">{t.name}</span>
                    <span className="text-sm text-ink-soft">{t.note}</span>
                  </p>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {DECOR_PRESETS.filter((p) => p.tier === t.id).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    role="radio"
                    aria-checked={s.presetId === p.id}
                    onClick={() => update("presetId", p.id)}
                    className={`overflow-hidden rounded-[18px] border-2 bg-white text-left transition ${s.presetId === p.id ? "border-kumkum ring-4 ring-kumkum/15" : "border-line hover:border-gold"}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.image} alt="" className="aspect-[4/3] w-full object-cover" loading="lazy" />
                    <span className="block px-4 py-3">
                      <span className="block font-semibold">{p.name}</span>
                      <span className="block text-sm text-ink-soft">{p.description}</span>
                    </span>
                  </button>
                ))}
                </div>
                </div>
                ))}
              </div>
            )}
          </div>
          {s.decorSource !== "preset" && (
            <label className="mt-5 flex items-start gap-3 text-[0.97rem]">
              <input type="checkbox" className="mt-1 h-4 w-4 accent-kumkum" checked={s.applyToAllEvents} onChange={(e) => update("applyToAllEvents", e.target.checked)} />
              <span>
                Use this design for every event
                <span className="block text-sm text-ink-soft">Off: it guides the wedding ceremony, and other events get their own decor in your palettes.</span>
              </span>
            </label>
          )}
          <StepNav onNext={finishDecor} busy={busy} nextLabel="Next: your wedding" />
        </section>
      )}

      {step === 1 && (
        <section aria-labelledby="wedding-h" className="space-y-8">
          <h2 id="wedding-h" className="text-2xl">Tell us about your wedding</h2>
          <Field label="Tradition">
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Tradition">
              {TRADITIONS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="radio"
                  aria-checked={s.tradition === t.id}
                  className="chip"
                  onClick={() =>
                    setS((cur) => ({ ...cur, tradition: t.id, events: cur.events.filter((e) => t.events.includes(e)).length ? cur.events.filter((e) => t.events.includes(e)) : t.events.slice(0, pack.maxEvents) }))
                  }
                >
                  {t.short}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Events" hint={`The ${pack.name} pack covers up to ${pack.maxEvents} ${pack.maxEvents === 1 ? "event" : "events"}.`}>
            <div className="flex flex-wrap gap-2">
              {tradition.events.map((e) => {
                const on = s.events.includes(e);
                return (
                  <button
                    key={e}
                    type="button"
                    aria-pressed={on}
                    className="chip"
                    onClick={() => {
                      if (on) update("events", s.events.filter((x) => x !== e));
                      else if (s.events.length < pack.maxEvents) update("events", [...s.events, e]);
                      else setError(`The ${pack.name} pack covers up to ${pack.maxEvents} events. Choose a bigger pack on the Album step for more.`);
                    }}
                  >
                    {eventLabel(e, s.tradition)}
                  </button>
                );
              })}
            </div>
          </Field>
          <Field label="Color palettes" hint={`Pick up to ${pack.maxPalettes}. Your album rotates through them so you can compare.`}>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {PALETTES.map((p) => {
                const on = s.palettes.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => {
                      if (on) update("palettes", s.palettes.filter((x) => x !== p.id));
                      else if (s.palettes.length < pack.maxPalettes) update("palettes", [...s.palettes, p.id]);
                      else setError(`The ${pack.name} pack covers up to ${pack.maxPalettes} palettes.`);
                    }}
                    className={`flex items-center gap-3 rounded-2xl border-2 bg-white px-3 py-3 text-left ${on ? "border-kumkum" : "border-line"}`}
                  >
                    <span className="flex flex-none">
                      {p.swatches.map((c) => (
                        <span key={c} className="-ml-1.5 h-7 w-7 rounded-full border-2 border-white ring-1 ring-ink/10 first:ml-0" style={{ background: c }} />
                      ))}
                    </span>
                    <span className="text-[0.95rem] font-medium leading-tight">{p.name}</span>
                  </button>
                );
              })}
            </div>
          </Field>
          <div className="grid gap-8 sm:grid-cols-2">
            <Field label="Venue">
              <Segmented value={s.venue} onChange={(v) => update("venue", v as VenueMode)} options={[["mixed", "Best per event"], ["indoor", "Indoor"], ["outdoor", "Outdoor"]]} />
            </Field>
            <Field label="Light">
              <Segmented value={s.lighting} onChange={(v) => update("lighting", v as LightingMode)} options={[["mixed", "Best per event"], ["day", "Daytime"], ["evening", "Evening"]]} />
            </Field>
          </div>
          <Field label="Anything else? (optional)" hint="Flowers you love or hate, a venue name, family must-haves.">
            <textarea className="field min-h-24" maxLength={600} value={s.notes} onChange={(e) => update("notes", e.target.value)} placeholder="e.g. no lilies, lots of jasmine, venue is a garden estate in Sonoma" />
          </Field>
          <StepNav onBack={() => go(0)} onNext={finishWedding} busy={busy} nextLabel="Next: people" />
        </section>
      )}

      {step === 2 && (
        <section aria-labelledby="people-h" className="space-y-6">
          <h2 id="people-h" className="text-2xl">Should the images look like you?</h2>
          <div className="grid gap-4 sm:grid-cols-2" role="radiogroup" aria-label="Faces">
            {(
              [
                ["silhouette", "Soft faces", "People appear as style models with soft or turned-away faces. Great for decor and outfit decisions."],
                ["likeness", "Use our photos", "Upload a clear, front-facing photo of the bride and/or groom. Photos are deleted within 7 days."],
              ] as [PeopleMode, string, string][]
            ).map(([id, title, desc]) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={s.peopleMode === id}
                onClick={() => update("peopleMode", id)}
                className={`rounded-2xl border-2 bg-white p-5 text-left ${s.peopleMode === id ? "border-kumkum" : "border-line"}`}
              >
                <span className="block text-lg font-semibold">{title}</span>
                <span className="mt-1 block text-ink-soft">{desc}</span>
              </button>
            ))}
          </div>
          {s.peopleMode === "likeness" && (
            <div className="space-y-5 rounded-2xl border border-line bg-silk p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <ImageDrop label="Bride's photo" kind="bride" value={s.brideUrl} onUploaded={(u) => update("brideUrl", u)} onError={setError} compact />
                <ImageDrop label="Groom's photo" kind="groom" value={s.groomUrl} onUploaded={(u) => update("groomUrl", u)} onError={setError} compact />
              </div>
              <label className="flex items-start gap-3">
                <input type="checkbox" className="mt-1 h-4 w-4 accent-kumkum" checked={s.consent} onChange={(e) => update("consent", e.target.checked)} />
                <span className="text-[0.97rem]">
                  These photos are of adults (18+), and I have their permission to use them for wedding previews. I understand photos are deleted within 7 days and never used to train AI.
                </span>
              </label>
            </div>
          )}
          <StepNav onBack={() => go(1)} onNext={finishPeople} busy={busy} nextLabel="Next: your album" />
        </section>
      )}

      {step === 3 && (
        <section aria-labelledby="album-h" className="space-y-8">
          <h2 id="album-h" className="text-2xl">Size your album</h2>
          {mode === "couple" ? (
            <div className="grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Pack">
              {ALBUM_PACKS.map((id) => {
                const p = PACKS[id];
                return (
                  <button
                    key={id}
                    type="button"
                    role="radio"
                    aria-checked={s.packId === id}
                    onClick={() => setPack(id)}
                    className={`rounded-2xl border-2 bg-white p-4 text-left ${s.packId === id ? "border-kumkum" : "border-line"}`}
                  >
                    <span className="flex items-baseline justify-between">
                      <span className="text-lg font-semibold">{p.name}</span>
                      <span className="font-display text-2xl">{formatUSD(p.priceCents)}</span>
                    </span>
                    <span className="mt-1 block text-sm text-ink-soft">
                      {p.images} images, up to {p.maxEvents} events and {p.maxPalettes} palettes
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Client names">
                  <input className="field" value={s.clientName} onChange={(e) => update("clientName", e.target.value)} placeholder="Priya & Arjun" maxLength={80} />
                </Field>
                <Field label="Proposal size">
                  <Segmented value={s.packId} onChange={(v) => setPack(v as PackId)} options={ALBUM_PACKS.map((id) => [id, `${PACKS[id].images} images`])} />
                </Field>
              </div>
              {inventory.length ? (
                <Field label="Style references from your inventory" hint="Pick up to 3 pieces you own. The proposal reuses their look.">
                  <div className="flex flex-wrap gap-3">
                    {inventory.map((i) => {
                      const on = s.inventoryUrls.includes(i.url);
                      return (
                        <button
                          key={i.id}
                          type="button"
                          aria-pressed={on}
                          onClick={() =>
                            update("inventoryUrls", on ? s.inventoryUrls.filter((u) => u !== i.url) : s.inventoryUrls.length < 3 ? [...s.inventoryUrls, i.url] : s.inventoryUrls)
                          }
                          className={`w-28 overflow-hidden rounded-xl border-2 bg-white text-left ${on ? "border-kumkum" : "border-line"}`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={i.url} alt="" className="aspect-square w-full object-cover" />
                          <span className="block truncate px-2 py-1 text-xs">{i.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </Field>
              ) : null}
              <p className="text-sm text-ink-soft">
                Uses {pack.images} of your {credits} images{plan ? "" : " — start Pro to get monthly images"}.
              </p>
            </div>
          )}

          <Field label="What goes in the album" hint="We've suggested a balanced mix. Adjust it to what you're deciding.">
            <div className="divide-y divide-line rounded-2xl border border-line bg-white">
              {CATEGORIES.map((c) => (
                <div key={c.id} className="flex items-center gap-4 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{c.name}</p>
                    <p className="text-sm text-ink-soft">{c.hint}</p>
                  </div>
                  <Stepper
                    value={s.mix[c.id]}
                    onChange={(n) => update("mix", { ...s.mix, [c.id]: n })}
                    max={pack.images}
                    canAdd={total < pack.images}
                    label={c.name}
                  />
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
              <span className={`rounded-full px-3 py-1 font-semibold ${total === pack.images ? "bg-[#e8efdc] text-mehndi" : "bg-[#fdecee] text-kumkum-deep"}`}>
                {total} of {pack.images} placed
              </span>
              <button type="button" className="font-medium text-kumkum underline underline-offset-4" onClick={() => update("mix", defaultMix(pack.images))}>
                Reset to suggested mix
              </button>
            </div>
          </Field>

          {mode === "couple" && (
            <Field label="Album name (optional)">
              <input className="field max-w-md" value={s.title} onChange={(e) => update("title", e.target.value)} placeholder="Priya & Arjun, June 2027" maxLength={80} />
            </Field>
          )}
          <StepNav onBack={() => go(2)} onNext={finishAlbum} busy={busy} nextLabel={mode === "couple" ? "See my free preview" : "Review proposal"} />
        </section>
      )}

      {step === 4 && (
        <section aria-labelledby="preview-h" className="space-y-6">
          {mode === "couple" ? (
            <>
              <h2 id="preview-h" className="text-2xl">Your free preview</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {[0, 1].map((i) => {
                  const p = previews[i];
                  return (
                    <div key={i} className="relative aspect-[4/3] overflow-hidden rounded-[18px] border border-line bg-white">
                      {p?.url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.url} alt={`Preview ${i + 1}: ${p.category === "decor" ? "decor" : "couple at the stage"}`} className="h-full w-full object-cover" />
                      ) : (
                        <div className="grid h-full place-items-center p-6 text-center text-ink-soft">
                          {busy ? (
                            <span className="flex flex-col items-center gap-3">
                              <Loader2 className="animate-spin text-kumkum" />
                              {i === 0 ? "Designing your decor…" : "Placing the two of you in it…"}
                            </span>
                          ) : (
                            <span>Preview {i + 1}</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-ink-soft">{AI_LABEL} Free previews are watermarked and lower resolution.</p>
              {!busy && previews.length === 0 && albumId ? (
                <button type="button" className="btn btn-ghost" onClick={() => runPreview(albumId)}>
                  <Sparkles size={18} /> Try the preview again
                </button>
              ) : null}

              <div className="rounded-[22px] border border-kumkum bg-white p-6 sm:p-7">
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold">
                      {pack.name} album: {pack.images} images, no watermark
                    </p>
                    <p className="text-ink-soft">
                      {s.events.map((e) => eventLabel(e, s.tradition)).join(", ")}. {s.palettes.length} palette{s.palettes.length > 1 ? "s" : ""}. {pack.freeRegens} free new versions.
                    </p>
                  </div>
                  <button type="button" className="btn btn-primary" onClick={checkout} disabled={!!busy || !albumId}>
                    Create my album, {formatUSD(pack.priceCents)}
                  </button>
                </div>
                <p className="mt-4 text-sm text-ink-soft">Secure payment by Stripe. Ready in about 5–15 minutes. Not happy? Email us within 14 days for a refund.</p>
              </div>
            </>
          ) : (
            <>
              <h2 id="preview-h" className="text-2xl">Ready to create the proposal</h2>
              <p className="text-ink-soft">
                {pack.images} images for {s.clientName || "your client"}, across {s.events.map((e) => eventLabel(e, s.tradition)).join(", ")}. Uses {pack.images} of your {credits} images.
              </p>
              <button type="button" className="btn btn-primary" onClick={createProposal} disabled={!!busy || credits < pack.images}>
                Create proposal
              </button>
              {credits < pack.images ? <p className="text-sm text-kumkum-deep">Not enough images left this month. Choose a smaller size or upgrade your plan.</p> : null}
            </>
          )}
          {busy ? (
            <p className="flex items-center gap-2 text-ink-soft" aria-live="polite">
              <Loader2 size={16} className="animate-spin" /> {busy}
            </p>
          ) : null}
          <button type="button" className="text-sm font-medium text-ink-soft underline underline-offset-4" onClick={() => go(3)}>
            Change album settings
          </button>
        </section>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- small parts */

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-semibold">{label}</p>
      {hint ? <p className="mb-3 text-sm text-ink-soft">{hint}</p> : <div className="mb-3" />}
      {children}
    </div>
  );
}

function Segmented({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <div className="inline-flex flex-wrap rounded-full border border-line bg-white p-1" role="radiogroup">
      {options.map(([v, label]) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={value === v}
          onClick={() => onChange(v)}
          className={`rounded-full px-4 py-1.5 text-[0.95rem] font-medium ${value === v ? "bg-ink text-white" : "text-ink-soft hover:text-ink"}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function Stepper({ value, onChange, max, canAdd, label }: { value: number; onChange: (n: number) => void; max: number; canAdd: boolean; label: string }) {
  return (
    <div className="flex items-center gap-1">
      <button type="button" className="grid h-9 w-9 place-items-center rounded-full border border-line hover:border-ink disabled:opacity-40" onClick={() => onChange(Math.max(0, value - 1))} disabled={value === 0} aria-label={`Fewer ${label}`}>
        <Minus size={16} />
      </button>
      <span className="w-9 text-center font-semibold tabular-nums" aria-live="polite">{value}</span>
      <button type="button" className="grid h-9 w-9 place-items-center rounded-full border border-line hover:border-ink disabled:opacity-40" onClick={() => onChange(Math.min(max, value + 1))} disabled={!canAdd} aria-label={`More ${label}`}>
        <Plus size={16} />
      </button>
    </div>
  );
}

function StepNav({ onBack, onNext, busy, nextLabel }: { onBack?: () => void; onNext: () => void; busy: string | null; nextLabel: string }) {
  return (
    <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-line pt-6">
      {onBack ? (
        <button type="button" className="btn btn-ghost" onClick={onBack} disabled={!!busy}>
          Back
        </button>
      ) : null}
      <button type="button" className="btn btn-primary ml-auto" onClick={onNext} disabled={!!busy}>
        {busy ? <Loader2 size={18} className="animate-spin" /> : null}
        {nextLabel}
      </button>
    </div>
  );
}

function ImageDrop({
  label,
  kind,
  value,
  onUploaded,
  onError,
  compact,
}: {
  label: string;
  kind: string;
  value?: string;
  onUploaded: (url: string) => void;
  onError: (msg: string) => void;
  compact?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const handle = async (file?: File | null) => {
    if (!file) return;
    setBusy(true);
    try {
      onUploaded(await uploadFile(file, kind));
    } catch (e) {
      onError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        void handle(e.dataTransfer.files?.[0]);
      }}
      className={`relative overflow-hidden rounded-[18px] border-2 border-dashed bg-white ${over ? "border-kumkum" : "border-line"} ${compact ? "aspect-square" : "aspect-[4/3]"}`}
    >
      {value ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt={label} className="h-full w-full object-contain" />
      ) : null}
      <button
        type="button"
        onClick={() => input.current?.click()}
        className={`absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center ${value ? "bg-transparent opacity-0 hover:bg-white/70 hover:opacity-100 focus:opacity-100" : ""}`}
      >
        {busy ? <Loader2 className="animate-spin text-kumkum" /> : value ? <ImagePlus className="text-kumkum" /> : <Upload className="text-kumkum" />}
        <span className="font-medium">{busy ? "Uploading…" : value ? "Replace photo" : label}</span>
        {!value && !busy ? <span className="text-sm text-ink-soft">JPG, PNG, WEBP or HEIC, up to 12 MB</span> : null}
      </button>
      <input ref={input} type="file" accept="image/*" className="sr-only" onChange={(e) => void handle(e.target.files?.[0])} />
    </div>
  );
}
