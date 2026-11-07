"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { engage as track } from "@/lib/engage";
import { Check, Copy, Download, ImagePlus, Pipette, ShieldCheck, Sparkles } from "lucide-react";
import { colorDistance, extractColors, hexToRgb, mainOutfitColor, nameColor, sampleAt, toHex, type ExtractedColor } from "@/lib/colorExtract";
import { nearestOutfit } from "@/lib/outfitColors";
import { PALETTES, getPalette } from "@/lib/catalog";
import { CoupleScene, Family } from "./Figures";
import { PaletteMandap } from "./PaletteMandap";

const EXAMPLES = [
  { src: "/samples/bride.jpg", label: "Emerald lehenga" },
  { src: "/samples/groom.jpg", label: "Ivory sherwani" },
  { src: "/samples/family.jpg", label: "Haldi family" },
];

type Pixels = { data: Uint8ClampedArray; width: number; height: number };

async function readPixels(src: string): Promise<Pixels> {
  const img = new Image();
  img.decoding = "async";
  img.src = src;
  await img.decode();
  const scale = Math.min(1, 220 / Math.max(img.naturalWidth, img.naturalHeight));
  const width = Math.max(1, Math.round(img.naturalWidth * scale));
  const height = Math.max(1, Math.round(img.naturalHeight * scale));
  const c = document.createElement("canvas");
  c.width = width;
  c.height = height;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, width, height);
  return { data: ctx.getImageData(0, 0, width, height).data, width, height };
}

/** Our decor palettes ranked against the photo: the outfit's recommended palette first, then the closest in color. */
function rankPalettes(colors: ExtractedColor[], main: ExtractedColor) {
  const recommended = nearestOutfit(main.hex).decorPalette;
  return PALETTES.map((p) => {
    const sw = p.swatches.map(hexToRgb);
    const closeness = colors.reduce((sum, c) => sum + c.share * Math.min(...sw.map((s) => colorDistance(s, c.rgb))), 0);
    return { p, score: (p.id === recommended ? -400 : 0) + closeness };
  })
    .sort((a, b) => a.score - b.score)
    .slice(0, 2)
    .map((x) => x.p);
}

function drawCard(colors: ExtractedColor[], main: ExtractedColor, groom: string[], family: string[], decor: string): Promise<Blob | null> {
  const W = 1080, H = 1350;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d")!;
  g.fillStyle = "#fbf1ee";
  g.fillRect(0, 0, W, H);
  g.fillStyle = "#4a0d1a";
  g.fillRect(0, 0, W, 210);
  g.fillStyle = "#ecd08a";
  g.font = "600 30px Georgia, serif";
  g.fillText("MY WEDDING PALETTE", 80, 95);
  g.fillStyle = "#fff8ef";
  g.font = "bold 58px Georgia, serif";
  g.fillText(`${main.name} outfit`, 80, 165);
  // proportional strip
  let x = 80;
  const stripW = W - 160;
  colors.forEach((col) => {
    const w = Math.max(20, stripW * col.share);
    g.fillStyle = col.hex;
    g.fillRect(x, 260, w, 230);
    x += w;
  });
  // swatch list
  g.font = "500 30px Helvetica, Arial, sans-serif";
  colors.slice(0, 6).forEach((col, i) => {
    const y = 560 + i * 82;
    g.fillStyle = col.hex;
    g.fillRect(80, y, 64, 64);
    g.fillStyle = "#2b1620";
    g.fillText(`${col.name}${col.metal ? " (metallic)" : ""}`, 170, y + 30);
    g.fillStyle = "#6b5560";
    g.fillText(col.hex, 170, y + 62);
  });
  g.fillStyle = "#2b1620";
  g.font = "600 30px Helvetica, Arial, sans-serif";
  g.fillText("Groom", 600, 590);
  g.fillText("Family", 600, 760);
  g.fillText("Decor", 600, 930);
  g.font = "28px Helvetica, Arial, sans-serif";
  g.fillStyle = "#6b5560";
  groom.forEach((t, i) => g.fillText(t, 600, 630 + i * 36));
  family.forEach((t, i) => g.fillText(t, 600, 800 + i * 36));
  g.fillText(decor, 600, 970);
  g.fillStyle = "#9e1b32";
  g.font = "600 30px Helvetica, Arial, sans-serif";
  g.fillText("Make yours free at MandapCanvas", 80, H - 70);
  return new Promise((res) => c.toBlob(res, "image/png"));
}

export function PhotoPalette() {
  const [src, setSrc] = useState<string | null>(null);
  const [pixels, setPixels] = useState<Pixels | null>(null);
  const [colors, setColors] = useState<ExtractedColor[]>([]);
  const [picked, setPicked] = useState<ExtractedColor | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const objectUrl = useRef<string | null>(null);

  useEffect(() => () => void (objectUrl.current && URL.revokeObjectURL(objectUrl.current)), []);

  const load = useCallback(async (url: string, how: string) => {
    setError(null);
    setPicked(null);
    try {
      const px = await readPixels(url);
      setSrc(url);
      setPixels(px);
      setColors(extractColors(px.data, px.width, px.height, 7));
      track("tool_photo_palette_load", { how });
    } catch {
      setError("We couldn't read that image. Try a JPG or PNG photo.");
    }
  }, []);

  const onFile = (f: File | undefined) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) return setError("Choose a photo (JPG, PNG or WEBP).");
    if (f.size > 25 * 1024 * 1024) return setError("That photo is over 25 MB. Try a smaller one.");
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    objectUrl.current = URL.createObjectURL(f);
    void load(objectUrl.current, "upload");
  };

  const [hover, setHover] = useState<{ c: ExtractedColor; x: number; y: number } | null>(null);
  const [pin, setPin] = useState<{ x: number; y: number } | null>(null);
  const frame = useRef(0);
  const hoverColor = hover?.c ?? null;
  // The kept color (ignores hover), for things that shouldn't flicker while the pointer moves.
  const keptMain = useMemo(() => picked ?? mainOutfitColor(colors), [picked, colors]);
  const main = useMemo(() => hoverColor ?? picked ?? mainOutfitColor(colors), [hoverColor, picked, colors]);
  const match = main ? nearestOutfit(main.hex) : null;
  const decor = useMemo(() => (main ? rankPalettes(colors, main) : []), [colors, main]);
  const metal = colors.find((c) => c.metal);

  // Hovering previews the color under the pointer (shown in a ring, like a loupe); a click or tap keeps it.

  const sampleEvent = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!pixels) return null;
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    // The image is object-contain: map the pointer into the drawn picture, ignoring the letterbox.
    const scale = Math.min(r.width / el.naturalWidth, r.height / el.naturalHeight);
    const w = el.naturalWidth * scale;
    const h = el.naturalHeight * scale;
    const left = (r.width - w) / 2;
    const top = (r.height - h) / 2;
    const fx = (e.clientX - r.left - left) / w;
    const fy = (e.clientY - r.top - top) / h;
    if (fx < 0 || fx > 1 || fy < 0 || fy > 1) return null;
    const rgb = sampleAt(pixels.data, pixels.width, pixels.height, Math.round(fx * (pixels.width - 1)), Math.round(fy * (pixels.height - 1))).map(Math.round) as [
      number,
      number,
      number,
    ];
    return { c: { rgb, hex: toHex(rgb), share: 0, name: nameColor(rgb) } as ExtractedColor, x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 };
  };

  const hoverAt = (e: React.MouseEvent<HTMLImageElement>) => {
    const ev = { clientX: e.clientX, clientY: e.clientY, currentTarget: e.currentTarget } as React.MouseEvent<HTMLImageElement>;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => setHover(sampleEvent(ev)));
  };

  const pickAt = (e: React.MouseEvent<HTMLImageElement>) => {
    const hit = sampleEvent(e);
    if (!hit) return;
    setPicked(hit.c);
    setPin({ x: hit.x, y: hit.y });
    setHover(null);
    track("tool_photo_palette_pick");
  };

  const copy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 1300);
    } catch {
      /* blocked */
    }
  };

  const download = async () => {
    if (!main || !match) return;
    const blob = await drawCard(colors, main, match.groom.map((s) => s.name), match.family.map((s) => s.name), getPalette(match.decorPalette).name);
    if (!blob) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "my-wedding-palette.png";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    track("tool_photo_palette_download");
  };

  return (
    <div className="rounded-[26px] border border-gold/40 bg-white p-4 shadow-[0_30px_60px_-44px_rgba(74,13,26,0.6)] sm:p-7">
      {!src ? (
        <div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              onFile(e.dataTransfer.files?.[0]);
            }}
            className={`flex w-full flex-col items-center justify-center gap-3 rounded-[22px] border-2 border-dashed px-6 py-14 text-center transition ${
              drag ? "border-kumkum bg-[#fdf3f1]" : "mc-attention border-gold/60 bg-silk hover:border-gold"
            }`}
          >
            <span className="grid h-14 w-14 place-items-center rounded-full bg-maroon text-gold-light">
              <ImagePlus size={24} />
            </span>
            <span className="font-display text-2xl text-maroon">Upload a photo of the outfit</span>
            <span className="max-w-md text-ink-soft">A lehenga, saree, sherwani or a fabric swatch. A store photo or a screenshot from Instagram works too.</span>
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm">
            <span className="text-ink-soft">Or try an example:</span>
            {EXAMPLES.map((x) => (
              <button key={x.src} type="button" className="chip !min-h-9 !text-sm" onClick={() => load(x.src, "example")}>
                {x.label}
              </button>
            ))}
          </div>
          <p className="mt-4 flex items-center justify-center gap-2 text-sm text-mehndi">
            <ShieldCheck size={16} /> Your photo stays on your device. Nothing is uploaded.
          </p>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="min-w-0">
            <div className="relative overflow-hidden rounded-2xl bg-silk">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt="Your outfit photo"
                onClick={pickAt}
                onMouseMove={hoverAt}
                onMouseLeave={() => {
                  cancelAnimationFrame(frame.current);
                  setHover(null);
                }}
                className="max-h-[520px] w-full cursor-crosshair object-contain"
              />
              {hover || (pin && picked) ? (
                <span
                  className="pointer-events-none absolute h-11 w-11 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white shadow-[0_0_0_2px_rgba(0,0,0,0.25),0_6px_14px_rgba(0,0,0,0.25)]"
                  style={{ left: `${(hover ?? pin)!.x}%`, top: `${(hover ?? pin)!.y}%`, background: (hover?.c ?? picked)!.hex }}
                  aria-hidden="true"
                />
              ) : null}
            </div>
            <p className="mt-2 flex items-center gap-2 text-sm text-ink-soft">
              <Pipette size={15} className="text-gold" /> Move over the outfit to see its colors. Tap to keep one.
            </p>
            <button
              type="button"
              className="mt-3 text-sm font-semibold text-kumkum underline underline-offset-4"
              onClick={() => {
                setSrc(null);
                setPixels(null);
                setColors([]);
                setPicked(null);
                setPin(null);
              }}
            >
              Use a different photo
            </button>
          </div>

          <div className="min-w-0" aria-live="polite">
            <p className="font-semibold">Colors in your photo</p>
            <div className="mt-2 flex h-14 overflow-hidden rounded-xl ring-1 ring-ink/10" aria-hidden="true">
              {colors.map((c) => (
                <span key={c.hex} style={{ background: c.hex, flex: Math.max(c.share, 0.04) }} />
              ))}
            </div>
            <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {colors.map((c) => (
                <li key={c.hex}>
                  <button type="button" onClick={() => { setPicked(c); setPin(null); }} className={`flex w-full items-center gap-2 rounded-xl border p-2 text-left ${main?.hex === c.hex ? "border-kumkum" : "border-line hover:border-gold"}`}>
                    <span className="h-8 w-8 flex-none rounded-lg ring-1 ring-ink/10" style={{ background: c.hex }} />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{c.name}</span>
                      <span className="block text-xs text-ink-soft">
                        {c.hex} · {Math.round(c.share * 100)}%
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            {metal ? (
              <p className="mt-3 flex items-center gap-2 text-sm">
                <Sparkles size={15} className="text-gold" /> {metal.metal === "gold" ? "Gold zari or gota work" : "Silver work"} detected: carry {metal.metal} into the decor.
              </p>
            ) : null}

            {main && match ? (
              <>
                <div className="mt-5 flex items-center gap-4 rounded-2xl bg-silk p-4">
                  <span className="h-14 w-14 flex-none rounded-2xl ring-1 ring-ink/10" style={{ background: main.hex }} />
                  <div className="min-w-0">
                    <p className="text-sm text-ink-soft">{picked ? "Your picked color" : "Main outfit color"}</p>
                    <p className="font-display text-2xl text-maroon">
                      {main.name} <span className="font-sans text-sm text-ink-soft">{main.hex}</span>
                    </p>
                  </div>
                </div>
                <CoupleScene
                  className="mt-5 h-auto w-full max-w-md"
                  bride={main.hex}
                  dupatta={match.family[0].hex}
                  groom={match.groom[0].hex}
                  safa={main.hex}
                  trim={metal?.metal === "silver" ? "#C0C6D0" : "#C9A24B"}
                  decor={(decor[0] ?? getPalette(match.decorPalette)).swatches}
                />
                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  <div>
                    <p className="font-semibold">Groom</p>
                    <ul className="mt-2 space-y-2">
                      {match.groom.map((s) => (
                        <li key={s.name} className="flex items-center gap-2 text-sm">
                          <span className="h-6 w-6 rounded-md ring-1 ring-ink/10" style={{ background: s.hex }} /> {s.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold">Family and bridal party</p>
                    <Family a={match.family[0].hex} b={match.family[2]?.hex ?? match.family[1].hex} className="mt-2 h-auto w-24" />
                    <ul className="mt-2 space-y-2">
                      {match.family.map((s) => (
                        <li key={s.name} className="flex items-center gap-2 text-sm">
                          <span className="h-6 w-6 rounded-md ring-1 ring-ink/10" style={{ background: s.hex }} /> {s.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <p className="mt-5 font-semibold">Decor palettes that frame this outfit</p>
                <div className="mt-2 grid gap-3 sm:grid-cols-2">
                  {decor.map((p, i) => (
                    <div key={p.id} className="rounded-2xl border border-line p-3">
                      <div className="flex h-8 overflow-hidden rounded-lg" aria-hidden="true">
                        {p.swatches.map((c, j) => (
                          <span key={c} className={j === 0 ? "flex-[2]" : "flex-1"} style={{ background: c }} />
                        ))}
                      </div>
                      <p className="mt-2 text-sm font-semibold">{p.name}</p>
                      <Link
                        href={`/create?palette=${p.id}`}
                        className={`btn btn-sm mt-2 w-full ${i === 0 ? "btn-primary" : "btn-ghost"}`}
                        onClick={() => track("tool_photo_palette_cta", { palette: p.id })}
                      >
                        Design with this palette
                      </Link>
                    </div>
                  ))}
                </div>
                <PaletteMandap
                  colors={[keptMain ?? main, ...colors.filter((c) => c.hex !== (keptMain ?? main).hex && !c.metal)].slice(0, 5).map((c) => ({ hex: c.hex, name: c.name }))}
                  metal={metal?.metal === "silver" ? "silver" : "gold"}
                  palette={decor[0]?.id ?? match.decorPalette}
                />
                <p className="mt-3 text-sm">
                  <span className="font-semibold text-kumkum-deep">Avoid:</span> {match.avoid}
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <button type="button" className="btn btn-gold btn-sm" onClick={download}>
                    <Download size={15} /> Save palette card
                  </button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => copy(colors.map((c) => `${c.name} ${c.hex}`).join("\n"), "hex")}>
                    {copied === "hex" ? <Check size={15} /> : <Copy size={15} />} {copied === "hex" ? "Copied" : "Copy color codes"}
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
      {error ? (
        <p role="alert" className="mt-4 text-center text-kumkum-deep">
          {error}
        </p>
      ) : null}
    </div>
  );
}
