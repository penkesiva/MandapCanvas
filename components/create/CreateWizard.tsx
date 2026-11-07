"use client";

import { readJson } from "@/lib/readJson";
import { flagField, scrollToTopOf } from "@/lib/flagField";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { track } from "@vercel/analytics";
import { AlertCircle, ArrowDown, Check, Copy, Download, ImagePlus, LayoutGrid, Loader2, Lock, Maximize2, Minus, Pencil, Plus, Sparkles, Upload } from "lucide-react";
import { SketchCanvas, type SketchCanvasHandle } from "./SketchCanvas";
import { Divider } from "@/components/Ornaments";
import { ALBUM_PACKS, PACKS, AI_LABEL, formatUSD, type PackId } from "@/lib/config";
import { CATEGORIES, DECOR_PRESETS, EVENT_DEFAULT_PRESET, PALETTES, STYLE_TIERS, normalizeEventSettings, TRADITIONS, defaultMix, eventLabel, mixTotal } from "@/lib/catalog";
import type { DecorSource, EventDesign, EventId, EventSetting, LightingMode, PeopleMode, ShotMix, TraditionId, VenueMode } from "@/lib/types";

type PreviewShot = { id: string; url?: string; status: string; category: string; event: EventId };

interface WizardState {
  /** Template chosen on the home page; seeds the main event's design. */
  styleHint?: string;
  tradition: TraditionId;
  events: EventId[];
  palettes: string[];
  eventSettings: Partial<Record<EventId, EventSetting>>;
  venue: VenueMode;
  lighting: LightingMode;
  notes: string;
  peopleMode: PeopleMode;
  brideUrl?: string;
  groomUrl?: string;
  /** Keep eyeglasses in likeness images (off by default: glasses are removed). */
  keepGlasses?: boolean;
  consent: boolean;
  packId: PackId;
  mix: ShotMix;
  title: string;
  clientName: string;
  inventoryUrls: string[];
}

const STEPS = ["Wedding", "Designs", "People", "Album", "Preview"] as const;
const STORAGE_KEY = "mc:wizard:v2";

const DEFAULT_PRESET = "floral_classic";

function initialState(pack: PackId, style?: string): WizardState {
  return {
    styleHint: style,
    tradition: "hindu_north",
    events: ["mehndi", "sangeet", "ceremony", "reception"],
    palettes: [],
    eventSettings: {},
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

/** Per-event settings with every event's design filled in (template defaults where none was chosen). */
const MAX_PALETTES = Math.max(...ALBUM_PACKS.map((id) => PACKS[id].maxPalettes));

/** True when a pack covers this many events and distinct palettes. */
function packFits(id: PackId, events: number, palettes: number): boolean {
  return PACKS[id].maxEvents >= events && PACKS[id].maxPalettes >= palettes;
}

/** The smallest album pack that covers the choices (falls back to the biggest). */
function smallestFit(events: number, palettes: number): PackId {
  return ALBUM_PACKS.find((id) => packFits(id, events, palettes)) ?? ALBUM_PACKS[ALBUM_PACKS.length - 1];
}

function resolveSettings(st: WizardState) {
  // Default palettes are fitted to the current pack, so defaults never force a bigger pack;
  // palettes the couple adds themselves raise the pack (see toggleEventPalette).
  const norm = normalizeEventSettings(st.events, st.eventSettings, st.palettes, PACKS[st.packId].maxPalettes);
  const main = st.events.includes("ceremony") ? "ceremony" : st.events[0];
  for (const e of st.events) {
    const set = norm.eventSettings[e]!;
    if (!set.design) {
      const hint = e === main && st.styleHint && DECOR_PRESETS.some((p) => p.id === st.styleHint) ? st.styleHint : EVENT_DEFAULT_PRESET[e];
      set.design = { source: "preset", presetId: hint };
    }
  }
  return norm;
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
  initialPalette,
  initialRef,
  mode,
  credits,
  plan,
  inventory = [],
}: {
  initialPack: PackId;
  initialStyle?: string;
  initialPalette?: string;
  /** A photo to use as one event's design (from the venue visualizer). */
  initialRef?: { event: EventId; url: string };
  mode: "couple" | "proposal";
  credits: number;
  plan: string | null;
  inventory?: { id: string; url: string; label: string }[];
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [s, setS] = useState<WizardState>(() => ({ ...initialState(initialPack, initialStyle), ...(initialPalette ? { palettes: [initialPalette] } : {}) }));
  const [hydrated, setHydrated] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [albumId, setAlbumId] = useState<string | null>(null);
  const [albumKey, setAlbumKey] = useState<string | null>(null);
  const [previews, setPreviews] = useState<PreviewShot[]>([]);
  const [dirtySketches, setDirtySketches] = useState<Partial<Record<EventId, boolean>>>({});
  const canvases = useRef<Partial<Record<EventId, SketchCanvasHandle | null>>>({});
  const [activeEvent, setActiveEvent] = useState<EventId | null>(null);
  const [copyMsg, setCopyMsg] = useState<string | null>(null);
  const [paywall, setPaywall] = useState<{ url: string; reason: "view" | "download" | "more"; label?: string } | null>(null);
  const topRef = useRef<HTMLDivElement>(null);
  // The site header is sticky; the event tabs stick just below it.
  const [headerH, setHeaderH] = useState(64);
  useEffect(() => {
    const h = document.querySelector("header");
    if (!h) return;
    const set = () => setHeaderH(h.getBoundingClientRect().height);
    set();
    const ro = new ResizeObserver(set);
    ro.observe(h);
    return () => ro.disconnect();
  }, []);

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
          ...(initialStyle ? { styleHint: initialStyle } : {}),
          // A palette picked in a free tool becomes the starting palette for every event.
          ...(initialPalette ? { palettes: [initialPalette], eventSettings: {} } : {}),
        }));
      }
    } catch {
      /* storage unavailable */
    }
    if (initialRef) {
      setS((cur) => {
        const events = cur.events.includes(initialRef.event) ? cur.events : [...cur.events, initialRef.event];
        const base = resolveSettings({ ...cur, events }).eventSettings;
        return {
          ...cur,
          events,
          eventSettings: { ...base, [initialRef.event]: { ...base[initialRef.event]!, design: { source: "upload", imageUrl: initialRef.url } } },
        };
      });
      setActiveEvent(initialRef.event);
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialStyle, initialPalette]);
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
  // Per-event palettes, venue and light, kept within the pack's palette limit.
  const perEvent = useMemo(() => resolveSettings(s), [s]);
  const current: EventId | undefined = activeEvent && s.events.includes(activeEvent) ? activeEvent : s.events[0];
  const setEvent = (e: EventId, patch: Partial<EventSetting>) =>
    setS((cur) => {
      const base = resolveSettings(cur).eventSettings;
      return { ...cur, eventSettings: { ...base, [e]: { ...base[e]!, ...patch } } };
    });
  const toggleEventPalette = (e: EventId, id: string) => {
    const mine = perEvent.eventSettings[e]?.palettes ?? [];
    if (mine.includes(id)) {
      if (mine.length === 1) return setError("Keep at least one palette for each event.");
      return setEvent(e, { palettes: mine.filter((x) => x !== id) });
    }
    const isNew = !perEvent.palettes.includes(id);
    if (isNew && perEvent.palettes.length >= MAX_PALETTES) {
      return setError(`You can use up to ${MAX_PALETTES} palettes across the album, and you're using ${perEvent.palettes.length}. Reuse one or remove one.`);
    }
    setError(null);
    const need = perEvent.palettes.length + (isNew ? 1 : 0);
    setS((cur) => {
      const packId = packFits(cur.packId, cur.events.length, need) ? cur.packId : smallestFit(cur.events.length, need);
      const base = resolveSettings({ ...cur, packId }).eventSettings;
      return {
        ...cur,
        packId,
        mix: packId === cur.packId ? cur.mix : defaultMix(PACKS[packId].images),
        eventSettings: { ...base, [e]: { ...base[e]!, palettes: [...mine, id] } },
      };
    });
  };

  const go = (n: number) => {
    setError(null);
    setStep(n);
    scrollToTopOf(topRef.current);
  };

  // Errors scroll to the field they're about (or the error banner) and nudge it.
  const flagged = useRef(false);
  const fail = (msg: string, target?: string) => {
    flagged.current = true;
    setError(msg);
    flagField(target ?? "#wizard-error");
  };
  useEffect(() => {
    if (error && !flagged.current) flagField("#wizard-error");
    flagged.current = false;
  }, [error]);

  const setDesign = (e: EventId, design: EventDesign) => setEvent(e, { design });

  /** Uploads an event's drawing if it changed; returns the event's design with its image URL. */
  const saveSketch = async (e: EventId): Promise<EventDesign | null> => {
    const d = perEvent.eventSettings[e]?.design;
    if (!d || d.source !== "sketch") return d ?? null;
    const c = canvases.current[e];
    if (c && !c.isEmpty() && (dirtySketches[e] || !d.imageUrl)) {
      const blob = await c.toBlob();
      if (!blob) throw new Error("Couldn't read the drawing.");
      const url = await uploadFile(blob, "sketch");
      const next = { source: "sketch" as const, imageUrl: url };
      setDesign(e, next);
      setDirtySketches((x) => ({ ...x, [e]: false }));
      return next;
    }
    return d;
  };

  const copyDesign = async (from: EventId, targets: EventId[], withColors: boolean) => {
    if (!targets.length) return;
    setError(null);
    try {
      setBusy("Copying the design…");
      const d = await saveSketch(from);
      if (!d || (d.source !== "preset" && !d.imageUrl)) throw new Error("Finish this event's design first.");
      setS((cur) => {
        const next = resolveSettings(cur).eventSettings;
        const src = next[from]!;
        for (const t of targets) {
          const base = next[t]!;
          next[t] = withColors ? { ...base, design: d, palettes: src.palettes, venue: src.venue, lighting: src.lighting } : { ...base, design: d };
        }
        return { ...cur, eventSettings: next };
      });
      setCopyMsg(`Copied to ${targets.map((t) => eventLabel(t, s.tradition)).join(", ")}.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't copy the design.");
    } finally {
      setBusy(null);
    }
  };

  /* -------- step validation + side effects */

  const finishWedding = () => {
    if (!s.events.length) return fail("Pick at least one event.", '[data-field="events"]');
    setActiveEvent(s.events[0]);
    go(1);
  };

  const finishDesigns = async () => {
    setBusy("Saving your designs…");
    setError(null);
    try {
      for (const e of s.events) {
        const d = await saveSketch(e);
        if (!d || (d.source !== "preset" && !d.imageUrl)) {
          setActiveEvent(e);
          setBusy(null);
          return fail(
            d?.source === "sketch"
              ? `Draw something for ${eventLabel(e, s.tradition)}, start from an outline, or pick a template.`
              : `Upload a reference image for ${eventLabel(e, s.tradition)}, or pick a template.`,
            `[data-field="design-${e}"]`,
          );
        }
      }
      if (!perEvent.palettes.length) {
        setBusy(null);
        return fail("Pick at least one palette.", `[data-field="palettes-${current ?? s.events[0]}"]`);
      }
      setBusy(null);
      go(2);
    } catch (e) {
      setBusy(null);
      fail(e instanceof Error ? e.message : "Something went wrong.");
    }
  };

  const finishPeople = () => {
    if (s.peopleMode === "likeness") {
      if (!s.brideUrl && !s.groomUrl) return fail("Add at least one photo, or choose soft faces.", '[data-field="people-photos"]');
      if (!s.consent) return fail("Please confirm you have permission to use these photos.", '[data-field="consent"]');
    }
    go(3);
  };

  const setPack = (id: PackId) => {
    const p = PACKS[id];
    if (!packFits(id, s.events.length, perEvent.palettes.length)) {
      return setError(
        `${p.name} covers up to ${p.maxEvents} events and ${p.maxPalettes} palettes. You have ${s.events.length} events and ${perEvent.palettes.length} palettes. Go back to remove some, or keep a bigger pack.`,
      );
    }
    setError(null);
    setS((cur) => ({ ...cur, packId: id, mix: defaultMix(p.images) }));
  };

  // Keep the pack big enough for the events and palettes chosen. Couples pick their pack on the Album step.
  useEffect(() => {
    if (!hydrated) return;
    if (PACKS[s.packId].maxEvents >= s.events.length) return;
    const fit = smallestFit(s.events.length, 0);
    setS((cur) => ({ ...cur, packId: fit, mix: defaultMix(PACKS[fit].images) }));
  }, [hydrated, s.packId, s.events.length]);

  const configPayload = useMemo(
    () => ({
      tradition: s.tradition,
      events: s.events,
      palettes: perEvent.palettes,
      venue: "mixed",
      lighting: "mixed",
      eventSettings: perEvent.eventSettings,
      notes: s.notes,
      decor: { source: "preset", presetId: DEFAULT_PRESET, applyToAllEvents: false },
      people: { mode: s.peopleMode, brideUrl: s.brideUrl, groomUrl: s.groomUrl, glasses: s.keepGlasses ? "keep" : "remove", consent: s.consent },
      mix: s.mix,
      inventoryUrls: mode === "proposal" ? s.inventoryUrls : [],
    }),
    [s, mode, perEvent],
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

  useEffect(() => {
    if (!paywall) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setPaywall(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [paywall]);

  // The rest of the album, laid out as locked tiles on the preview step (nothing is generated).
  const lockedTiles = useMemo(() => {
    const people: Partial<Record<keyof ShotMix, string>> = {
      bride: "/samples/bride.jpg",
      groom: "/samples/groom.jpg",
      couple: "/samples/couple.jpg",
      couple_stage: "/samples/couple.jpg",
      family: "/samples/family.jpg",
    };
    const designImage = (e: EventId) => {
      const d = perEvent.eventSettings[e]?.design;
      return (d?.source === "preset" ? DECOR_PRESETS.find((p) => p.id === d.presetId)?.image : d?.imageUrl) ?? "/samples/hero-after.jpg";
    };
    const events = s.events.length ? s.events : (["ceremony"] as EventId[]);
    const order = CATEGORIES.map((c) => c.id);
    const left = { ...s.mix };
    // The two free previews are one wide decor shot and one couple-at-the-stage shot.
    left.decor = Math.max(0, (left.decor ?? 0) - 1);
    left.couple_stage = Math.max(0, (left.couple_stage ?? 0) - 1);
    const seen: Partial<Record<keyof ShotMix, number>> = {};
    const tiles: { key: string; label: string; image: string; portrait: boolean }[] = [];
    let guard = 0;
    while (tiles.length < pack.images - 2 && guard++ < 2000) {
      let placed = false;
      for (const c of order) {
        if ((left[c] ?? 0) <= 0 || tiles.length >= pack.images - 2) continue;
        left[c] -= 1;
        const i = seen[c] ?? 0;
        seen[c] = i + 1;
        const e = events[(i + 1) % events.length];
        tiles.push({
          key: `${c}-${i}`,
          label: `${CATEGORIES.find((x) => x.id === c)?.name}, ${eventLabel(e, s.tradition)}`,
          image: c === "decor" || c === "decor_detail" ? designImage(e) : people[c]!,
          portrait: c === "bride" || c === "groom",
        });
        placed = true;
      }
      if (!placed) break;
    }
    return tiles;
  }, [s.events, s.mix, s.tradition, perEvent, pack.images]);
  const SHOWN_LOCKED = 23; // + one closing tile = a full 3-, 4- or 6-column grid

  /* -------- render */

  return (
    <div ref={topRef} className="mx-auto max-w-5xl scroll-mt-24 px-4 pb-16 pt-6 sm:px-6 sm:pb-24 sm:pt-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-[2rem] leading-tight sm:text-[2.8rem]">{mode === "proposal" ? "New client proposal" : "Create your wedding album"}</h1>
        <ol className="-mx-4 mt-4 flex gap-1.5 overflow-x-auto whitespace-nowrap px-4 [scrollbar-width:none] sm:mx-0 sm:mt-5 sm:flex-wrap sm:gap-2 sm:px-0" aria-label="Steps">
          {STEPS.map((label, i) => (
            <li key={label}>
              <button
                type="button"
                onClick={() => i < step && go(i)}
                disabled={i > step}
                aria-current={i === step ? "step" : undefined}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium sm:gap-2 sm:px-3.5 ${
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
        <div id="wizard-error" role="alert" className="mb-6 flex items-start gap-3 rounded-2xl border border-kumkum/30 bg-[#fdecee] px-4 py-3 text-kumkum-deep">
          <AlertCircle className="mt-0.5 flex-none" size={18} />
          <p>{error}</p>
        </div>
      ) : null}

      {step === 0 && (
        <section aria-labelledby="wedding-h" className="space-y-8">
          <h2 id="wedding-h" className="text-2xl">Tell us about your wedding</h2>
          {initialRef && s.eventSettings[initialRef.event]?.design?.imageUrl === initialRef.url ? (
            <div className="flex items-center gap-3 rounded-2xl border border-gold/50 bg-silk p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={initialRef.url} alt="" className="h-14 w-20 flex-none rounded-lg object-cover" />
              <p className="text-sm">
                <span className="font-semibold">Your decorated venue is in.</span> It&apos;s the design for your {eventLabel(initialRef.event, s.tradition).toLowerCase()}. Pick your other events, then set each one&apos;s design.
              </p>
            </div>
          ) : null}
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
                    setS((cur) => ({ ...cur, tradition: t.id, events: cur.events.filter((e) => t.events.includes(e)).length ? cur.events.filter((e) => t.events.includes(e)) : t.events.slice(0, 4) }))
                  }
                >
                  {t.short}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Which events are you having?" hint="Pick one or more. Each event gets its own design.">
            <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <span className="font-semibold text-kumkum-deep">
                {s.events.length === 0 ? "No events picked yet" : `${s.events.length} of ${tradition.events.length} picked`}
              </span>
              {s.events.length < tradition.events.length ? (
                <button type="button" className="font-semibold text-kumkum underline underline-offset-4" onClick={() => update("events", [...tradition.events])}>
                  Select all
                </button>
              ) : (
                <button type="button" className="font-semibold text-kumkum underline underline-offset-4" onClick={() => update("events", [])}>
                  Clear
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Events, pick one or more" data-field="events">
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
                      else update("events", tradition.events.filter((x) => x === e || s.events.includes(x)));
                    }}
                  >
                    {on ? (
                      <span className="pop-in grid h-4 w-4 place-items-center rounded-full bg-kumkum text-white" aria-hidden="true">
                        <Check size={11} strokeWidth={3} />
                      </span>
                    ) : null}
                    {eventLabel(e, s.tradition)}
                  </button>
                );
              })}
            </div>
            {s.events.length > 0 ? (
              <p key={s.events.length} className="mt-4 flex items-center gap-2 text-sm font-medium text-kumkum-deep">
                <ArrowDown size={16} className="nudge-down text-gold" aria-hidden="true" />
                Next, you&apos;ll set the backdrop, colors, venue and light for {s.events.length === 1 ? "this event" : `each of these ${s.events.length} events`}.
              </p>
            ) : null}
          </Field>
          <Field label="Anything else? (optional)" hint="Flowers you love or hate, a venue name, family must-haves.">
            <textarea className="field min-h-24" maxLength={600} value={s.notes} onChange={(e) => update("notes", e.target.value)} placeholder="e.g. no lilies, lots of jasmine, venue is a garden estate in Sonoma" />
          </Field>
          <StepNav error={error} onNext={finishWedding} busy={busy} nextLabel="Next: design each event" />
        </section>
      )}

      {s.events.length > 0 && step >= 1 && (
        <section aria-labelledby="designs-h" hidden={step !== 1}>
          <h2 id="designs-h" className="text-2xl">Design each event</h2>
          <p className="mt-1 text-ink-soft">Every event gets its own backdrop, colors, venue and light. Set one up, then copy it to others if you like.</p>

          <div
            id="event-tabs"
            style={{ top: headerH }}
            className="sticky z-30 -mx-4 mt-5 flex gap-2 overflow-x-auto border-b border-gold/30 bg-milk/95 px-4 py-2.5 backdrop-blur [scrollbar-width:none] sm:-mx-6 sm:flex-wrap sm:px-6 [&::-webkit-scrollbar]:hidden"
            role="tablist"
            aria-label="Events"
          >
            {tradition.events
              .filter((e) => s.events.includes(e))
              .map((e) => {
                const d = perEvent.eventSettings[e]?.design;
                const preset = d?.source === "preset" ? DECOR_PRESETS.find((p) => p.id === d.presetId) : null;
                const thumb = preset?.image ?? d?.imageUrl;
                const on = current === e;
                return (
                  <button
                    key={e}
                    type="button"
                    role="tab"
                    aria-selected={on}
                    onClick={() => {
                      setCopyMsg(null);
                      setActiveEvent(e);
                    }}
                    className={`flex flex-none items-center gap-2.5 whitespace-nowrap rounded-full border-2 py-1 pl-1 pr-4 text-[0.95rem] font-medium transition ${
                      on ? "border-kumkum bg-white text-kumkum-deep" : "border-line bg-white hover:border-gold"
                    }`}
                  >
                    <span className="h-8 w-8 overflow-hidden rounded-full bg-silk ring-1 ring-ink/10">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {thumb ? <img src={thumb} alt="" className="h-full w-full object-cover" /> : null}
                    </span>
                    {eventLabel(e, s.tradition)}
                  </button>
                );
              })}
          </div>

          {tradition.events
            .filter((e) => s.events.includes(e))
            .map((e) => {
              const set = perEvent.eventSettings[e]!;
              const d = set.design!;
              const label = eventLabel(e, s.tradition);
              const others = s.events.filter((x) => x !== e);
              const idx = s.events.indexOf(e);
              const nextEvent = tradition.events.filter((x) => s.events.includes(x)).find((x, i, arr) => arr.indexOf(e) + 1 === i);
              return (
                <div key={e} role="tabpanel" hidden={current !== e} className="mt-6 space-y-8 rounded-[24px] border border-gold/40 bg-white p-4 sm:p-6" data-index={idx}>
                  <div data-field={`design-${e}`}>
                    <h3 className="text-2xl text-maroon">Backdrop for {label}</h3>
                    <div className="mt-4 grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label={`How to start the ${label} design`}>
                      {(
                        [
                          ["preset", "Pick a template", "12 styles from simple to grand", LayoutGrid],
                          ["upload", "Upload a reference", "A photo you love or a decorator's sketch", Upload],
                          ["sketch", "Draw it", "Sketch the shape on screen", Pencil],
                        ] as [DecorSource, string, string, typeof Upload][]
                      ).map(([id, title, sub, Icon]) => (
                        <button
                          key={id}
                          type="button"
                          role="radio"
                          aria-checked={d.source === id}
                          onClick={() =>
                            setDesign(e, id === "preset" ? { source: "preset", presetId: d.presetId ?? EVENT_DEFAULT_PRESET[e] } : { source: id, imageUrl: d.source === id ? d.imageUrl : undefined })
                          }
                          className={`flex items-start gap-3 rounded-2xl border-2 px-4 py-3 text-left transition ${
                            d.source === id ? "border-kumkum bg-[#fdf3f1]" : "border-line hover:border-gold"
                          }`}
                        >
                          <Icon size={20} className={`mt-0.5 flex-none ${d.source === id ? "text-kumkum" : "text-gold"}`} />
                          <span>
                            <span className="block font-semibold">{title}</span>
                            <span className="block text-sm text-ink-soft">{sub}</span>
                          </span>
                        </button>
                      ))}
                    </div>

                    <div className="mt-5">
                      {d.source === "preset" && (
                        <div role="radiogroup" aria-label={`Template for ${label}`} className="space-y-5">
                          {STYLE_TIERS.map((t) => (
                            <div key={t.id}>
                              <p className="mb-2 flex items-baseline gap-3">
                                <span className="font-display text-lg">{t.name}</span>
                                <span className="text-sm text-ink-soft">{t.note}</span>
                              </p>
                              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                                {DECOR_PRESETS.filter((p) => p.tier === t.id).map((p) => {
                                  const sel = d.presetId === p.id;
                                  return (
                                    <button
                                      key={p.id}
                                      type="button"
                                      role="radio"
                                      aria-checked={sel}
                                      onClick={() => setDesign(e, { source: "preset", presetId: p.id })}
                                      className={`overflow-hidden rounded-2xl border-2 bg-white text-left transition ${sel ? "border-kumkum ring-4 ring-kumkum/15" : "border-line hover:border-gold"}`}
                                    >
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img src={p.image} alt="" className="aspect-[4/3] w-full object-cover" loading="lazy" />
                                      <span className="block px-3 py-2">
                                        <span className="block text-[0.95rem] font-semibold">{p.name}</span>
                                        <span className="block text-xs text-ink-soft">{p.description}</span>
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {d.source === "upload" && (
                        <ImageDrop
                          label={`Upload a reference for ${label}: a photo you love, or a decorator's sketch`}
                          kind="decor"
                          value={d.imageUrl}
                          onUploaded={(url) => setDesign(e, { source: "upload", imageUrl: url })}
                          onError={setError}
                        />
                      )}
                      <div hidden={d.source !== "sketch"}>
                        {d.source === "sketch" && d.imageUrl && !dirtySketches[e] ? (
                          <div className="mb-4 flex items-center gap-4 rounded-2xl border border-line bg-white p-3">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={d.imageUrl} alt="Your saved sketch" className="h-16 w-20 rounded-lg object-cover" />
                            <p className="text-sm text-ink-soft">We saved this sketch. Draw below to replace it.</p>
                          </div>
                        ) : null}
                        {(d.source === "sketch" || dirtySketches[e] !== undefined) && (
                          <SketchCanvas
                            ref={(h) => {
                              canvases.current[e] = h;
                            }}
                            onChange={() => setDirtySketches((x) => ({ ...x, [e]: true }))}
                          />
                        )}
                        <p className="mt-3 text-sm text-ink-soft">Rough is fine. Shapes, symmetry and color washes matter more than detail.</p>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(ev) => (ev.currentTarget.nextElementSibling as HTMLElement | null)?.scrollIntoView({ behavior: "smooth", block: "start" })}
                    className="mx-auto flex w-fit items-center gap-2 rounded-full border border-gold/50 bg-silk px-4 py-1.5 text-sm font-medium text-kumkum-deep hover:border-gold"
                  >
                    <ArrowDown size={15} className="nudge-down text-gold" aria-hidden="true" /> Colors, venue and light for {label}
                  </button>
                  <div className="scroll-mt-24">
                    <p className="mb-3 font-semibold">
                      Colors for {label} <span className="font-normal text-ink-soft">(pick one, or two to compare)</span>
                    </p>
                    <div data-field={`palettes-${e}`}>
                      <PaletteGrid selected={set.palettes} onToggle={(id) => toggleEventPalette(e, id)} />
                    </div>
                    <p className="mt-3 text-sm text-ink-soft">
                      {perEvent.palettes.length} of up to {MAX_PALETTES} palettes used across the album. Reusing one for several events counts once.
                    </p>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <p className="mb-2 font-semibold">Venue</p>
                      <Segmented value={set.venue} onChange={(v) => setEvent(e, { venue: v as "indoor" | "outdoor" })} options={[["indoor", "Indoor"], ["outdoor", "Outdoor"]]} />
                    </div>
                    <div>
                      <p className="mb-2 font-semibold">Light</p>
                      <Segmented value={set.lighting} onChange={(v) => setEvent(e, { lighting: v as "day" | "evening" })} options={[["day", "Daytime"], ["evening", "Evening"]]} />
                    </div>
                  </div>

                  {others.length > 0 && (
                    <div className="rounded-2xl bg-silk p-4">
                      <p className="font-semibold">Use this {label} setup for other events</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {others.map((o) => (
                          <button key={o} type="button" className="chip" disabled={!!busy} onClick={() => copyDesign(e, [o], false)}>
                            <Copy size={14} /> Backdrop to {eventLabel(o, s.tradition)}
                          </button>
                        ))}
                        <button type="button" className="chip" disabled={!!busy} onClick={() => copyDesign(e, others, true)}>
                          <Copy size={14} /> Backdrop, colors and light to all
                        </button>
                      </div>
                      {copyMsg ? <p className="mt-2 text-sm text-mehndi">{copyMsg}</p> : null}
                    </div>
                  )}

                  {nextEvent ? (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => {
                          setCopyMsg(null);
                          setActiveEvent(nextEvent);
                          scrollToTopOf(document.getElementById("designs-h") ?? topRef.current, headerH + 12);
                        }}
                      >
                        Next event: {eventLabel(nextEvent, s.tradition)}
                      </button>
                    </div>
                  ) : null}
                </div>
              );
            })}
          <StepNav error={error} onBack={() => go(0)} onNext={finishDesigns} busy={busy} nextLabel="Next: people" />
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
              <div className="grid gap-4 sm:grid-cols-2" data-field="people-photos">
                <ImageDrop label="Bride's photo" kind="bride" value={s.brideUrl} onUploaded={(u) => update("brideUrl", u)} onError={setError} compact />
                <ImageDrop label="Groom's photo" kind="groom" value={s.groomUrl} onUploaded={(u) => update("groomUrl", u)} onError={setError} compact />
              </div>
              <div>
                <p className="text-sm font-semibold">Glasses</p>
                <div className="mt-1.5 flex flex-wrap gap-2" role="radiogroup" aria-label="Glasses">
                  <button type="button" className="chip" role="radio" aria-checked={!s.keepGlasses} onClick={() => update("keepGlasses", false)}>
                    Remove glasses
                  </button>
                  <button type="button" className="chip" role="radio" aria-checked={!!s.keepGlasses} onClick={() => update("keepGlasses", true)}>
                    Keep our glasses
                  </button>
                </div>
              </div>
              <label className="flex items-start gap-3" data-field="consent">
                <input type="checkbox" className="mt-1 h-4 w-4 accent-kumkum" checked={s.consent} onChange={(e) => update("consent", e.target.checked)} />
                <span className="text-[0.97rem]">
                  These photos are of adults (18+), and I have their permission to use them for wedding previews. I understand photos are deleted within 7 days and never used to train AI.
                </span>
              </label>
            </div>
          )}
          <StepNav error={error} onBack={() => go(1)} onNext={finishPeople} busy={busy} nextLabel="Next: your album" />
        </section>
      )}

      {step === 3 && (
        <section aria-labelledby="album-h" className="space-y-8">
          <h2 id="album-h" className="text-2xl">Size your album</h2>
          {mode === "couple" ? (
            <div className="grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Pack">
              {ALBUM_PACKS.map((id) => {
                const p = PACKS[id];
                const fits = packFits(id, s.events.length, perEvent.palettes.length);
                return (
                  <button
                    key={id}
                    type="button"
                    role="radio"
                    aria-checked={s.packId === id}
                    aria-disabled={!fits}
                    onClick={() => setPack(id)}
                    className={`rounded-2xl border-2 bg-white p-4 text-left ${s.packId === id ? "border-kumkum" : "border-line"} ${fits ? "" : "opacity-55"}`}
                  >
                    <span className="flex items-baseline justify-between">
                      <span className="text-lg font-semibold">{p.name}</span>
                      <span className="font-display text-2xl">{formatUSD(p.priceCents)}</span>
                    </span>
                    <span className="mt-1 block text-sm text-ink-soft">
                      {p.images} images, up to {p.maxEvents} events and {p.maxPalettes} palettes
                    </span>
                    {!fits ? (
                      <span className="mt-1 block text-xs font-semibold text-kumkum-deep">
                        You picked {s.events.length} events{perEvent.palettes.length > p.maxPalettes ? ` and ${perEvent.palettes.length} palettes` : ""}.
                      </span>
                    ) : null}
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
          <StepNav error={error} onBack={() => go(2)} onNext={finishAlbum} busy={busy} nextLabel={mode === "couple" ? "See my free preview" : "Review proposal"} />
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
                    <div key={i} className="group relative aspect-[4/3] overflow-hidden rounded-[18px] border border-line bg-white">
                      {p?.url ? (
                        <>
                          <button type="button" className="block h-full w-full" onClick={() => setPaywall({ url: p.url!, reason: "view" })} aria-label="View larger">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={p.url} alt={`Preview ${i + 1}: ${p.category === "decor" ? "decor" : "couple at the stage"}`} className="h-full w-full object-cover" />
                          </button>
                          <div className="absolute right-3 top-3 flex gap-2 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
                            <button type="button" onClick={() => setPaywall({ url: p.url!, reason: "view" })} className="grid h-9 w-9 place-items-center rounded-full bg-white/95 text-ink shadow" aria-label="Full screen (with your album)">
                              <Maximize2 size={16} />
                            </button>
                            <button type="button" onClick={() => setPaywall({ url: p.url!, reason: "download" })} className="relative grid h-9 w-9 place-items-center rounded-full bg-white/95 text-ink shadow" aria-label="Download (with your album)">
                              <Download size={16} />
                              <span className="absolute -bottom-0.5 -right-0.5 grid h-4 w-4 place-items-center rounded-full bg-kumkum text-white"><Lock size={9} /></span>
                            </button>
                          </div>
                        </>
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
              {previews.length > 0 ? (
                <div className="rounded-[24px] border border-gold/40 bg-white p-4 sm:p-6">
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <p className="font-display text-2xl text-maroon">Your full album: {pack.images} images</p>
                      <p className="text-sm text-ink-soft">
                        2 free previews above. These {pack.images - 2} unlock in HD, without watermarks, across {s.events.map((e) => eventLabel(e, s.tradition)).join(", ")}.
                      </p>
                    </div>
                    <button type="button" className="btn btn-primary btn-sm" onClick={checkout} disabled={!!busy || !albumId}>
                      <Lock size={14} /> Unlock all {pack.images}, {formatUSD(pack.priceCents)}
                    </button>
                  </div>
                  <ul className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-2.5 lg:grid-cols-6">
                    {lockedTiles.slice(0, SHOWN_LOCKED).map((t, i) => (
                      <li key={t.key}>
                        <button
                          type="button"
                          onClick={() => setPaywall({ url: t.image, reason: "more", label: t.label })}
                          className={`group relative block aspect-[4/3] w-full overflow-hidden rounded-xl bg-maroon ${i < 2 ? "sheen" : ""}`}
                          aria-label={`${t.label}: locked, in your album`}
                          title={t.label}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={t.image} alt="" loading="lazy" className={`h-full w-full scale-125 object-cover blur-[10px] brightness-90 ${t.portrait ? "object-top" : ""}`} aria-hidden="true" />
                          <span className="absolute inset-0 bg-gradient-to-t from-maroon/80 via-maroon/20 to-transparent" />
                          <Lock size={14} className="absolute right-2 top-2 text-gold-light" aria-hidden="true" />
                          <span className="absolute inset-x-2 bottom-1.5 truncate text-left text-[0.72rem] font-medium text-[#fff8ef]">{t.label}</span>
                        </button>
                      </li>
                    ))}
                    <li>
                      {lockedTiles.length > SHOWN_LOCKED ? (
                        <button
                          type="button"
                          onClick={() => setPaywall({ url: lockedTiles[0].image, reason: "more", label: `${lockedTiles.length - SHOWN_LOCKED} more images` })}
                          className="grid aspect-[4/3] w-full place-items-center rounded-xl border-2 border-dashed border-gold/60 bg-silk text-center font-display text-xl text-maroon hover:border-gold"
                        >
                          <span>
                            +{lockedTiles.length - SHOWN_LOCKED}
                            <span className="block font-sans text-xs font-medium text-ink-soft">more images</span>
                          </span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={checkout}
                          disabled={!!busy || !albumId}
                          className="grid aspect-[4/3] w-full place-items-center rounded-xl border-2 border-dashed border-gold/60 bg-silk text-center text-sm font-semibold text-maroon hover:border-gold"
                        >
                          <span className="flex flex-col items-center gap-1">
                            <Lock size={16} className="text-gold" /> Unlock all {pack.images}
                          </span>
                        </button>
                      )}
                    </li>
                  </ul>
                </div>
              ) : null}
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
                      {s.events.map((e) => eventLabel(e, s.tradition)).join(", ")}. {perEvent.palettes.length} palette{perEvent.palettes.length > 1 ? "s" : ""}. {pack.freeRegens} free new versions.
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
      {paywall ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/80 p-4" role="dialog" aria-modal="true" aria-labelledby="paywall-h" onClick={() => setPaywall(null)}>
          <div className="grid w-full max-w-4xl overflow-hidden rounded-[26px] bg-silk shadow-2xl md:grid-cols-[1.25fr_1fr]" onClick={(e) => e.stopPropagation()}>
            <div className="relative bg-maroon">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={paywall.url} alt="" className={`h-full max-h-[60vh] w-full object-cover ${paywall.reason === "more" ? "scale-110 blur-[14px]" : ""}`} />
              <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-ink/75 px-3 py-1 text-xs font-semibold text-white">
                <Lock size={12} /> {paywall.reason === "more" ? paywall.label : "Watermarked preview"}
              </span>
            </div>
            <div className="flex flex-col p-6 sm:p-8">
              <Divider className="!justify-start" />
              <h3 id="paywall-h" className="mt-3 text-[1.8rem] leading-tight text-maroon">
                {paywall.reason === "download" ? "Keep it in full quality" : paywall.reason === "more" ? "See the rest of your wedding" : "See it full screen"}
              </h3>
              <ul className="mt-4 space-y-2 text-[0.97rem]">
                {[
                  `${pack.images} images across ${s.events.map((e) => eventLabel(e, s.tradition)).join(", ")}`,
                  "Full screen, HD and no watermark",
                  "Download every image, or the whole album as a ZIP",
                  "Change anything: “make the flowers white”",
                  "A share link for family to vote on favorites",
                ].map((x) => (
                  <li key={x} className="flex gap-2.5">
                    <span className="mt-2 h-1.5 w-1.5 flex-none rotate-45 bg-gold" aria-hidden="true" />
                    {x}
                  </li>
                ))}
              </ul>
              <div className="mt-auto pt-6">
                <button type="button" className="btn btn-primary w-full" onClick={() => { setPaywall(null); void checkout(); }} disabled={!!busy || !albumId}>
                  Create my album, {formatUSD(pack.priceCents)}
                </button>
                <button type="button" className="mt-2 w-full py-2 text-sm font-medium text-ink-soft hover:text-ink" onClick={() => setPaywall(null)}>
                  Keep looking
                </button>
                <p className="mt-1 text-center text-xs text-ink-soft">One-time payment. Refund within 14 days if you&apos;re not happy.</p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
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

/** Palette options as fabric swatches: the colors fill the tile, the name sits underneath. */
function PaletteGrid({ selected, onToggle }: { selected: string[]; onToggle: (id: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-4">
      {PALETTES.map((p) => {
        const on = selected.includes(p.id);
        return (
          <button key={p.id} type="button" aria-pressed={on} onClick={() => onToggle(p.id)} className="group text-left">
            <span
              className={`relative flex h-16 overflow-hidden rounded-2xl ring-offset-2 ring-offset-white transition ${
                on ? "ring-[3px] ring-kumkum" : "ring-1 ring-ink/10 group-hover:ring-2 group-hover:ring-gold"
              }`}
            >
              {p.swatches.map((c, i) => (
                <span key={c} className={i === 0 ? "flex-[2]" : "flex-1"} style={{ background: c }} />
              ))}
              {on ? (
                <span className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-kumkum text-white shadow" aria-hidden="true">
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-8 8a1 1 0 01-1.4 0l-4-4a1 1 0 111.4-1.4L8 12.6l7.3-7.3a1 1 0 011.4 0z" clipRule="evenodd" /></svg>
                </span>
              ) : null}
            </span>
            <span className={`mt-2 block text-[0.95rem] leading-tight ${on ? "font-semibold text-kumkum-deep" : "font-medium"}`}>{p.name}</span>
          </button>
        );
      })}
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

function StepNav({ onBack, onNext, busy, nextLabel, error }: { onBack?: () => void; onNext: () => void; busy: string | null; nextLabel: string; error?: string | null }) {
  return (
    <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-line pt-6">
      {error ? (
        <p className="flex w-full items-start gap-2 text-sm font-semibold text-kumkum-deep">
          <AlertCircle className="mt-0.5 flex-none" size={16} aria-hidden="true" />
          {error}
        </p>
      ) : null}
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
      className={`relative overflow-hidden rounded-[18px] border-2 border-dashed bg-white ${over ? "border-kumkum" : "border-line"} ${compact ? "aspect-square" : "aspect-[4/3]"} ${!value && !busy ? "mc-attention" : ""}`}
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
