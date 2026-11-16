"use client";

import "@fontsource/cinzel/400.css";
import "@fontsource/great-vibes/400.css";
import "@fontsource/playfair-display/400.css";
import "@fontsource/unbounded/400.css";
import "@fontsource/bungee/400.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { track } from "@vercel/analytics";
import { Check, Copy, Download, ImagePlus, Loader2, Pause, Play, RotateCcw, Share2, X, AlertCircle } from "lucide-react";
import {
  MAX_REEL_IMAGES,
  REEL_STYLES,
  REEL_TEMPLATES,
  clampLength,
  defaultSelection,
  holdFor,
  lengthRange,
  presetSeconds,
  type ReelSpeed,
  type ReelStyleId,
  type ReelTemplateId,
} from "@/lib/reel/templates";
import { ReelRenderer, buildTimeline, makeBackdrop, type ReelImage, type ReelPlan } from "@/lib/reel/render";
import { EncodeCancelled, encodeReel } from "@/lib/reel/encode";

export interface ReelItem {
  id: string;
  url: string;
  label: string;
  accent: string;
  favorite?: boolean;
}

const FONTS = [
  `400 50px Cinzel`,
  `400 50px "Great Vibes"`,
  `400 50px "Playfair Display"`,
  `400 50px Unbounded`,
  `400 50px Bungee`,
  `400 50px "Rozha One"`,
  `400 40px Hind`,
  `500 40px Hind`,
  `600 40px Hind`,
];

/** Largest side we keep in memory; the reel is 1080x1920, so more is wasted. */
const MAX_SIDE = 2000;

async function toBitmap(blob: Blob): Promise<ImageBitmap> {
  const bmp = await createImageBitmap(blob);
  const big = Math.max(bmp.width, bmp.height);
  if (big <= MAX_SIDE) return bmp;
  const k = MAX_SIDE / big;
  const small = await createImageBitmap(bmp, { resizeWidth: Math.round(bmp.width * k), resizeHeight: Math.round(bmp.height * k), resizeQuality: "high" });
  bmp.close();
  return small;
}

async function loadReelImage(item: ReelItem): Promise<ReelImage> {
  const res = await fetch(`/api/img?u=${encodeURIComponent(item.url)}`);
  if (!res.ok) throw new Error("image");
  const bmp = await toBitmap(await res.blob());
  return { src: bmp, backdrop: makeBackdrop(bmp), aspect: bmp.width / bmp.height, label: item.label, accent: item.accent };
}

async function loadLogo(): Promise<HTMLCanvasElement | null> {
  try {
    const img = new Image();
    img.src = "/icon.svg";
    await img.decode();
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    c.getContext("2d")!.drawImage(img, 0, 0, 256, 256);
    return c;
  } catch {
    return null;
  }
}

type ExportState =
  | { phase: "idle" }
  | { phase: "rendering"; progress: number }
  | { phase: "done"; url: string; file: File; ext: "mp4" | "webm" }
  | { phase: "error"; message: string };

export default function ReelMaker({
  title,
  template: templateId,
  items,
  onClose,
}: {
  title: string;
  template: ReelTemplateId;
  items: ReelItem[];
  onClose: () => void;
}) {
  const template = REEL_TEMPLATES[templateId];
  const [style, setStyle] = useState<ReelStyleId>(template.defaultStyle);
  const [selected, setSelected] = useState<string[]>(() => defaultSelection(items, template.defaultCount));
  const [speed, setSpeed] = useState<ReelSpeed | "custom">("normal");
  const [seconds, setSeconds] = useState(() => presetSeconds(template, Math.max(1, selected.length), "normal"));
  const [hook, setHook] = useState(template.hook);
  const [captions, setCaptions] = useState(true);
  const [cornerMark, setCornerMark] = useState(true);
  const [code, setCode] = useState("");
  const [labels, setLabels] = useState<Record<string, string>>({});
  const [editLabels, setEditLabels] = useState(false);
  const [before, setBefore] = useState<ReelImage | null>(null);
  const [beforeError, setBeforeError] = useState<string | null>(null);
  const [loadedTick, setLoadedTick] = useState(0);
  const [failed, setFailed] = useState<string[]>([]);
  const [fontsReady, setFontsReady] = useState(false);
  const [logo, setLogo] = useState<HTMLCanvasElement | null>(null);
  const [playing, setPlaying] = useState(true);
  const [exp, setExp] = useState<ExportState>({ phase: "idle" });
  const [copied, setCopied] = useState(false);

  const cache = useRef(new Map<string, ReelImage>());
  const loading = useRef(new Set<string>());
  const previewRef = useRef<HTMLCanvasElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const renderer = useRef<ReelRenderer | null>(null);
  const cancel = useRef({ cancelled: false });
  const clock = useRef({ start: 0, offset: 0 });

  const count = selected.length;
  const range = lengthRange(Math.max(1, count));
  const hold = holdFor(seconds, Math.max(1, count));
  const rendering = exp.phase === "rendering";

  /* -------- setup: fonts, logo, scroll lock, Escape */
  useEffect(() => {
    track("reel_opened", { template: templateId });
    const fonts = document.fonts ? Promise.all(FONTS.map((f) => document.fonts.load(f).catch(() => null))) : Promise.resolve();
    fonts.then(() => setFontsReady(true));
    loadLogo().then(setLogo);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [templateId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !rendering) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, rendering]);

  /* -------- load the chosen images */
  useEffect(() => {
    for (const id of selected) {
      if (cache.current.has(id) || loading.current.has(id)) continue;
      const item = items.find((i) => i.id === id);
      if (!item) continue;
      loading.current.add(id);
      loadReelImage(item)
        .then((img) => {
          cache.current.set(id, img);
          setLoadedTick((n) => n + 1);
        })
        .catch(() => setFailed((f) => [...f, id]))
        .finally(() => loading.current.delete(id));
    }
  }, [selected, items]);

  /* -------- keep the length in step with the speed and the number of images */
  useEffect(() => {
    const n = Math.max(1, count);
    setSeconds((s) => (speed === "custom" ? clampLength(s, n) : presetSeconds(template, n, speed)));
  }, [count, speed, template]);

  const ordered = useMemo(() => items.filter((i) => selected.includes(i.id) && !failed.includes(i.id)), [items, selected, failed]);
  const ready = useMemo(
    () =>
      ordered.flatMap((i) => {
        const img = cache.current.get(i.id);
        return img ? [{ ...img, label: labels[i.id] ?? i.label }] : [];
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ordered, loadedTick, labels],
  );
  const allLoaded = ready.length === ordered.length;

  const plan: ReelPlan | null = useMemo(
    () => (ready.length ? { style, before, images: ready, hold: holdFor(seconds, ready.length), hook, captions, cornerMark, code, logo } : null),
    [style, before, ready, seconds, hook, captions, cornerMark, code, logo],
  );
  const timeline = useMemo(() => (plan ? buildTimeline(plan) : null), [plan]);

  /* -------- live preview */
  const planRef = useRef({ plan, timeline });
  planRef.current = { plan, timeline };

  useEffect(() => {
    const canvas = previewRef.current;
    if (!canvas) return;
    if (!renderer.current) renderer.current = new ReelRenderer(canvas, 0.5);
    if (!playing || rendering || !fontsReady) return;
    clock.current.start = performance.now() - clock.current.offset * 1000;
    let raf = 0;
    const loop = () => {
      const { plan: p, timeline: tl } = planRef.current;
      if (p && tl) {
        let t = (performance.now() - clock.current.start) / 1000;
        if (t >= tl.total) {
          clock.current.start = performance.now();
          t = 0;
        }
        clock.current.offset = t;
        renderer.current!.render(p, tl, t);
        if (progressRef.current) progressRef.current.style.width = `${(t / tl.total) * 100}%`;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [playing, rendering, fontsReady]);

  // Paused: still redraw when settings change.
  useEffect(() => {
    if (playing || !plan || !timeline || !renderer.current) return;
    renderer.current.render(plan, timeline, Math.min(clock.current.offset, timeline.total));
  }, [playing, plan, timeline]);

  const restart = () => {
    clock.current.offset = 0;
    clock.current.start = performance.now();
    if (!playing) setPlaying(true);
  };

  /* -------- a finished file is out of date as soon as anything changes */
  const settingsKey = `${style}|${selected.join(",")}|${seconds}|${hook}|${captions}|${cornerMark}|${code}|${before ? 1 : 0}|${JSON.stringify(labels)}`;
  const lastKey = useRef(settingsKey);
  useEffect(() => {
    if (lastKey.current === settingsKey) return;
    lastKey.current = settingsKey;
    setExp((e) => (e.phase === "rendering" ? e : { phase: "idle" }));
  }, [settingsKey]);

  // Free the finished file when it's replaced or the Reel Maker closes.
  const fileUrl = exp.phase === "done" ? exp.url : null;
  useEffect(() => {
    if (!fileUrl) return;
    return () => URL.revokeObjectURL(fileUrl);
  }, [fileUrl]);
  useEffect(() => {
    const c = cancel;
    return () => {
      c.current.cancelled = true;
    };
  }, []);

  /* -------- actions */
  const toggle = (id: string) =>
    setSelected((s) => {
      if (s.includes(id)) return s.length <= 2 ? s : s.filter((x) => x !== id);
      if (s.length >= MAX_REEL_IMAGES) return s;
      return items.filter((i) => s.includes(i.id) || i.id === id).map((i) => i.id);
    });

  const pickBefore = async (file: File | undefined) => {
    setBeforeError(null);
    if (!file) return;
    if (!file.type.startsWith("image/")) return setBeforeError("Choose a photo (JPG, PNG or HEIC).");
    try {
      const bmp = await toBitmap(file);
      setBefore({ src: bmp, backdrop: makeBackdrop(bmp), aspect: bmp.width / bmp.height, label: "Before", accent: ready[0]?.accent ?? "#B8923A" });
      restart();
    } catch {
      setBeforeError("We couldn't open that photo. Try a JPG or PNG.");
    }
  };

  const fileName = `${(title || "mandapcanvas").replace(/[^\w-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").toLowerCase() || "mandapcanvas"}-reel`;

  const exportVideo = useCallback(async () => {
    if (!plan || !timeline) return;
    cancel.current = { cancelled: false };
    setExp({ phase: "rendering", progress: 0 });
    const started = performance.now();
    try {
      const canvas = document.createElement("canvas");
      const r = new ReelRenderer(canvas, 1);
      let last = 0;
      const res = await encodeReel({
        canvas,
        duration: timeline.total,
        draw: (t) => r.render(plan, timeline, t),
        signal: cancel.current,
        onProgress: (f) => {
          if (f - last >= 0.01 || f === 1) {
            last = f;
            setExp({ phase: "rendering", progress: f });
          }
        },
      });
      const file = new File([res.blob], `${fileName}.${res.ext}`, { type: res.blob.type });
      setExp({ phase: "done", url: URL.createObjectURL(file), file, ext: res.ext });
      track("reel_exported", {
        template: templateId,
        style,
        seconds: Math.round(timeline.total),
        images: plan.images.length,
        before: !!plan.before,
        code: !!plan.code.trim(),
        format: res.ext,
        renderMs: Math.round(performance.now() - started),
      });
    } catch (e) {
      if (e instanceof EncodeCancelled) return setExp({ phase: "idle" });
      setExp({ phase: "error", message: e instanceof Error && e.message !== "image" ? e.message : "The video didn't render. Try again, or try Chrome." });
      track("reel_failed", { template: templateId });
    }
  }, [plan, timeline, fileName, templateId, style]);

  const canShareFile = exp.phase === "done" && typeof navigator !== "undefined" && !!navigator.canShare?.({ files: [exp.file] });

  const shareVideo = async () => {
    if (exp.phase !== "done") return;
    try {
      await navigator.share({ files: [exp.file], title: "My MandapCanvas reel" });
      track("reel_shared", { template: templateId });
    } catch {
      /* closed the share sheet */
    }
  };

  const captionText = `${template.caption}${code.trim() ? `\nUse code ${code.trim()} at mandapcanvas.com` : ""}`;
  const copyCaption = () =>
    navigator.clipboard.writeText(captionText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });

  const pct = exp.phase === "rendering" ? Math.round(exp.progress * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-ink/90 p-0 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="reel-title">
      <div className="mx-auto min-h-full max-w-5xl bg-silk sm:min-h-0 sm:rounded-[28px] sm:shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-4 sm:px-7">
          <div>
            <h2 id="reel-title" className="text-[1.7rem] leading-none">Make a Reel</h2>
            <p className="mt-1 text-sm text-ink-soft">{template.name} · 9:16 MP4 for Instagram Reels and YouTube Shorts</p>
          </div>
          <button type="button" aria-label="Close" className="grid h-10 w-10 place-items-center rounded-full hover:bg-line/60 disabled:opacity-40" onClick={onClose} disabled={rendering}>
            <X />
          </button>
        </div>

        <div className="grid gap-6 p-5 sm:p-7 md:grid-cols-[minmax(0,340px)_1fr] md:gap-8">
          {/* Preview */}
          <div className="md:sticky md:top-6 md:self-start">
            <div className="relative mx-auto w-full max-w-[240px] overflow-hidden rounded-[22px] bg-ink shadow-lg md:max-w-none">
              <canvas ref={previewRef} className="block aspect-[9/16] h-auto w-full" aria-label="Reel preview" />
              {!plan || !fontsReady ? (
                <div className="absolute inset-0 grid place-items-center text-white/80">
                  <Loader2 className="animate-spin" />
                </div>
              ) : null}
              <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20">
                <div ref={progressRef} className="h-full bg-marigold" style={{ width: 0 }} />
              </div>
            </div>
            <div className="mt-3 flex items-center justify-center gap-2">
              <button type="button" className="chip" onClick={() => setPlaying((p) => !p)} disabled={rendering}>
                {playing ? <Pause size={15} /> : <Play size={15} />} {playing ? "Pause" : "Play"}
              </button>
              <button type="button" className="chip" onClick={restart} disabled={rendering}>
                <RotateCcw size={15} /> Restart
              </button>
              <span className="text-sm tabular-nums text-ink-soft">{timeline ? `${timeline.total.toFixed(1)}s` : ""}</span>
            </div>
            <p className="mt-2 text-center text-xs text-ink-soft">Preview. The download is full 1080×1920.</p>
          </div>

          {/* Controls */}
          <div className="space-y-7">
            <section>
              <h3 className="text-[1.2rem]">Transition style</h3>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {REEL_STYLES.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    aria-pressed={style === s.id}
                    onClick={() => {
                      setStyle(s.id);
                      restart();
                    }}
                    disabled={rendering}
                    className={`rounded-2xl border px-4 py-3 text-left transition ${style === s.id ? "border-kumkum bg-white shadow-sm ring-2 ring-kumkum/20" : "border-line bg-white/60 hover:bg-white"}`}
                  >
                    <span className="block font-semibold">{s.name}</span>
                    <span className="mt-0.5 block text-sm leading-snug text-ink-soft">{s.hint}</span>
                    {s.id === template.defaultStyle ? (
                      <span className="mt-2 inline-block rounded-full bg-marigold/20 px-2 py-0.5 text-[0.7rem] font-semibold text-maroon">Best for {template.name}</span>
                    ) : null}
                  </button>
                ))}
              </div>
            </section>

            <section>
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-[1.2rem]">Length</h3>
                <span className="text-sm tabular-nums text-ink-soft">
                  {seconds}s · {hold.toFixed(1)}s per image
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label="Speed">
                {(["fast", "normal", "slow"] as const).map((sp) => (
                  <button key={sp} type="button" role="radio" aria-checked={speed === sp} className="chip capitalize" onClick={() => setSpeed(sp)} disabled={rendering}>
                    {sp}
                  </button>
                ))}
                {speed === "custom" ? <span className="chip" aria-checked="true" role="radio">Custom</span> : null}
              </div>
              <input
                type="range"
                className="mt-4 w-full accent-[#9e1b32]"
                min={range.min}
                max={range.max}
                step={0.5}
                value={Math.min(range.max, Math.max(range.min, seconds))}
                onChange={(e) => {
                  setSpeed("custom");
                  setSeconds(Number(e.target.value));
                }}
                disabled={rendering || range.min === range.max}
                aria-label="Reel length in seconds"
              />
              <div className="flex justify-between text-xs text-ink-soft">
                <span>{range.min}s</span>
                <span>{range.max}s</span>
              </div>
            </section>

            <section>
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-[1.2rem]">Images</h3>
                <span className="text-sm text-ink-soft">
                  {count} of {Math.min(items.length, MAX_REEL_IMAGES)} max
                </span>
              </div>
              <p className="mt-1 text-sm text-ink-soft">Tap to add or remove. They play in this order.</p>
              <ul className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
                {items.map((it) => {
                  const pos = ordered.findIndex((o) => o.id === it.id);
                  const on = selected.includes(it.id);
                  const bad = failed.includes(it.id);
                  return (
                    <li key={it.id}>
                      <button
                        type="button"
                        onClick={() => toggle(it.id)}
                        disabled={rendering || bad}
                        aria-pressed={on}
                        aria-label={`${it.label}${on ? ", in the reel" : ""}`}
                        className={`relative block aspect-[3/4] w-full overflow-hidden rounded-xl border-2 transition ${on ? "border-kumkum" : "border-transparent opacity-55 hover:opacity-90"}`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={it.url} alt="" className="h-full w-full object-cover" loading="lazy" />
                        {on && pos >= 0 ? (
                          <span className="absolute left-1 top-1 grid h-6 min-w-6 place-items-center rounded-full bg-kumkum px-1 text-xs font-bold text-white">{pos + 1}</span>
                        ) : null}
                        {on && pos >= 0 && !cache.current.has(it.id) ? (
                          <span className="absolute inset-0 grid place-items-center bg-ink/30">
                            <Loader2 size={18} className="animate-spin text-white" />
                          </span>
                        ) : null}
                        <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-ink/80 to-transparent px-1.5 pb-1 pt-4 text-[0.68rem] font-medium text-white">{it.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              {captions ? (
                <div className="mt-3">
                  <button type="button" className="text-sm font-medium text-kumkum underline underline-offset-2" onClick={() => setEditLabels((v) => !v)} disabled={rendering}>
                    {editLabels ? "Done editing captions" : "Edit captions"}
                  </button>
                  {editLabels ? (
                    <ul className="mt-3 space-y-2">
                      {ordered.map((it, n) => (
                        <li key={it.id} className="flex items-center gap-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={it.url} alt="" className="h-12 w-9 flex-none rounded-md object-cover" />
                          <span className="w-5 flex-none text-sm font-semibold tabular-nums text-ink-soft">{n + 1}</span>
                          <input
                            className="field !min-h-10 !py-2"
                            value={labels[it.id] ?? it.label}
                            maxLength={32}
                            aria-label={`Caption for image ${n + 1}`}
                            onChange={(e) => setLabels((l) => ({ ...l, [it.id]: e.target.value }))}
                            disabled={rendering}
                          />
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ) : null}
              {failed.length ? <p className="mt-2 text-sm text-kumkum">{failed.length === 1 ? "One image" : `${failed.length} images`} couldn&apos;t load and were left out.</p> : null}
            </section>

            <section>
              <h3 className="text-[1.2rem]">Before photo (optional)</h3>
              <p className="mt-1 text-sm text-ink-soft">Open with your selfie for a before-and-after reveal. It stays on your device and is never uploaded.</p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <label className={`btn btn-ghost btn-sm cursor-pointer ${rendering ? "pointer-events-none opacity-50" : ""}`}>
                  <ImagePlus size={16} /> {before ? "Change photo" : "Add your selfie"}
                  <input type="file" accept="image/*" className="sr-only" onChange={(e) => pickBefore(e.target.files?.[0])} disabled={rendering} />
                </label>
                {before ? (
                  <button type="button" className="text-sm font-medium text-ink-soft underline underline-offset-2" onClick={() => setBefore(null)} disabled={rendering}>
                    Remove
                  </button>
                ) : null}
              </div>
              {beforeError ? <p className="mt-2 text-sm text-kumkum">{beforeError}</p> : null}
            </section>

            <section className="space-y-4">
              <div>
                <label htmlFor="reel-hook" className="block font-display text-[1.2rem] leading-tight">
                  Opening text
                </label>
                <p className="mt-1 text-sm text-ink-soft">The first second decides if people keep watching. It also becomes the reel&apos;s cover.</p>
                <input id="reel-hook" className="field mt-2" value={hook} maxLength={60} onChange={(e) => setHook(e.target.value)} disabled={rendering} placeholder={template.hook} />
              </div>
              <div>
                <label htmlFor="reel-code" className="block font-display text-[1.2rem] leading-tight">
                  Promo code on the end card (optional)
                </label>
                <input
                  id="reel-code"
                  className="field mt-2 uppercase placeholder:normal-case"
                  value={code}
                  maxLength={20}
                  onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ""))}
                  disabled={rendering}
                  placeholder="e.g. PRIYA15"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="chip" aria-pressed={captions} onClick={() => setCaptions((c) => !c)} disabled={rendering}>
                  {captions ? <Check size={15} /> : null} Captions on images
                </button>
                <button type="button" className="chip" aria-pressed={cornerMark} onClick={() => setCornerMark((c) => !c)} disabled={rendering}>
                  {cornerMark ? <Check size={15} /> : null} mandapcanvas.com tag
                </button>
              </div>
            </section>

            {/* Export */}
            <section className="rounded-2xl border border-line bg-white p-4 sm:p-5">
              {exp.phase === "done" ? (
                <div>
                  <p className="font-semibold text-mehndi">Your reel is ready.</p>
                  <video src={exp.url} className="mt-3 aspect-[9/16] w-32 rounded-xl bg-ink object-cover" muted autoPlay loop playsInline />
                  <div className="mt-4 flex flex-wrap gap-2">
                    {canShareFile ? (
                      <button type="button" className="btn btn-primary" onClick={shareVideo}>
                        <Share2 size={18} /> Share to Instagram…
                      </button>
                    ) : null}
                    <a className={`btn ${canShareFile ? "btn-ghost" : "btn-primary"}`} href={exp.url} download={exp.file.name} onClick={() => track("reel_downloaded", { template: templateId })}>
                      <Download size={18} /> Download {exp.ext.toUpperCase()}
                    </a>
                  </div>
                  {exp.ext === "webm" ? <p className="mt-3 text-sm text-ink-soft">Your browser made a WebM file. For Instagram on iPhone, open this page in Safari or Chrome to get an MP4.</p> : null}
                </div>
              ) : exp.phase === "rendering" ? (
                <div>
                  <div className="flex items-center justify-between text-sm font-medium">
                    <span className="flex items-center gap-2">
                      <Loader2 size={16} className="animate-spin" /> Making your video… {pct}%
                    </span>
                    <button type="button" className="text-ink-soft underline underline-offset-2" onClick={() => (cancel.current.cancelled = true)}>
                      Cancel
                    </button>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Video progress">
                    <div className="h-full rounded-full bg-kumkum transition-[width] duration-200" style={{ width: `${Math.max(3, pct)}%` }} />
                  </div>
                  <p className="mt-2 text-xs text-ink-soft">Keep this tab open. It&apos;s made on your device, nothing is uploaded.</p>
                </div>
              ) : (
                <div>
                  <button type="button" className="btn btn-primary w-full sm:w-auto" onClick={exportVideo} disabled={!plan || !allLoaded || !fontsReady || count < 2}>
                    {!allLoaded || !fontsReady ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                    {!allLoaded || !fontsReady ? "Loading images…" : "Create video"}
                  </button>
                  {exp.phase === "error" ? (
                    <p className="mt-3 flex items-start gap-2 text-sm text-kumkum">
                      <AlertCircle size={16} className="mt-0.5 flex-none" /> {exp.message}
                    </p>
                  ) : null}
                </div>
              )}

              <div className="mt-5 border-t border-line pt-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold">Caption to paste</p>
                  <button type="button" className="flex items-center gap-1.5 text-sm font-medium text-kumkum underline underline-offset-2" onClick={copyCaption}>
                    {copied ? <Check size={15} /> : <Copy size={15} />} {copied ? "Copied" : "Copy"}
                  </button>
                </div>
                <p className="mt-1 whitespace-pre-line text-sm text-ink-soft">{captionText}</p>
                <p className="mt-3 text-xs text-ink-soft">Tip: add a trending sound inside Instagram or YouTube. Reels with trending audio reach more people, and the music is licensed there.</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
