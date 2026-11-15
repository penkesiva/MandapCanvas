"use client";

/**
 * Draws one frame of a reel onto a canvas. Everything is laid out on a 1080x1920 grid and scaled, so the
 * small live preview and the exported MP4 are the same picture. Text stays clear of the top 8% and the
 * bottom 22% of the frame, where Instagram and YouTube put their own buttons and captions.
 */

import { INTRO_SECONDS, OUTRO_SECONDS, transitionFor, type ReelStyleId } from "./templates";

export const W = 1080;
export const H = 1920;

type Drawable = ImageBitmap | HTMLCanvasElement | HTMLImageElement;

export interface ReelImage {
  src: Drawable;
  /** A small, soft copy used as a blurred backdrop. */
  backdrop: HTMLCanvasElement;
  /** Width / height. */
  aspect: number;
  label: string;
  /** Accent color for this image (a saree, an event, an art style). */
  accent: string;
}

export interface ReelPlan {
  style: ReelStyleId;
  /** An optional "before" photo that opens the reel. */
  before?: ReelImage | null;
  images: ReelImage[];
  /** Seconds each image holds. */
  hold: number;
  hook: string;
  captions: boolean;
  cornerMark: boolean;
  /** Optional promo or creator code for the end card. */
  code: string;
  logo?: Drawable | null;
}

interface Slide {
  kind: "before" | "image" | "end";
  img?: ReelImage;
  /** Index among the album images (for varying the camera move). */
  n: number;
  start: number;
  dur: number;
  accent: string;
}

export interface Timeline {
  slides: Slide[];
  total: number;
  transition: number;
}

const GOLD = "#ECD08A";
const GOLD_DEEP = "#B8923A";
const MAROON = "#320811";

export function buildTimeline(plan: ReelPlan): Timeline {
  const slides: Slide[] = [];
  let t = 0;
  const transition = transitionFor(plan.style, plan.hold);
  if (plan.before) {
    slides.push({ kind: "before", img: plan.before, n: -1, start: 0, dur: INTRO_SECONDS, accent: plan.images[0]?.accent ?? GOLD_DEEP });
    t = INTRO_SECONDS;
  }
  plan.images.forEach((img, i) => {
    const dur = plan.hold + (!plan.before && i === 0 ? INTRO_SECONDS : 0);
    slides.push({ kind: "image", img, n: i, start: t, dur, accent: img.accent });
    t += dur;
  });
  slides.push({ kind: "end", n: plan.images.length, start: t, dur: OUTRO_SECONDS, accent: GOLD_DEEP, img: plan.images[plan.images.length - 1] });
  t += OUTRO_SECONDS;
  return { slides, total: t, transition };
}

/* -------- easing and helpers */

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const easeOutCubic = (x: number) => 1 - Math.pow(1 - clamp01(x), 3);
const easeInOutCubic = (x: number) => {
  const v = clamp01(x);
  return v < 0.5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2;
};
const easeInOutQuart = (x: number) => {
  const v = clamp01(x);
  return v < 0.5 ? 8 * v * v * v * v : 1 - Math.pow(-2 * v + 2, 4) / 2;
};

function luminance(hex: string): number {
  const m = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(hex);
  if (!m) return 0;
  const [r, g, b] = [m[1], m[2], m[3]].map((h) => {
    const c = parseInt(h, 16) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function withAlpha(hex: string, a: number): string {
  const m = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(hex);
  if (!m) return `rgba(0,0,0,${a})`;
  return `rgba(${parseInt(m[1], 16)},${parseInt(m[2], 16)},${parseInt(m[3], 16)},${a})`;
}

function srcSize(s: Drawable): { w: number; h: number } {
  if (s instanceof HTMLImageElement) return { w: s.naturalWidth || s.width, h: s.naturalHeight || s.height };
  return { w: s.width, h: s.height };
}

/** Draws an image to cover a box, scaled by `zoom` around the box center plus an offset. */
function drawCover(ctx: CanvasRenderingContext2D, s: Drawable, x: number, y: number, w: number, h: number, zoom = 1, dx = 0, dy = 0) {
  const { w: sw, h: sh } = srcSize(s);
  if (!sw || !sh) return;
  const scale = Math.max(w / sw, h / sh) * zoom;
  const dw = sw * scale;
  const dh = sh * scale;
  // Keep the image covering the box even when panned.
  const maxX = (dw - w) / 2;
  const maxY = (dh - h) / 2;
  const ox = Math.max(-maxX, Math.min(maxX, dx));
  const oy = Math.max(-maxY, Math.min(maxY, dy));
  ctx.drawImage(s, x + (w - dw) / 2 + ox, y + (h - dh) / 2 + oy, dw, dh);
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

/** A soft, small copy of an image for blurred backdrops. Works in every browser (no canvas filters). */
export function makeBackdrop(s: Drawable): HTMLCanvasElement {
  const tiny = document.createElement("canvas");
  tiny.width = 27;
  tiny.height = 48;
  const t = tiny.getContext("2d")!;
  t.imageSmoothingQuality = "high";
  drawCover(t, s, 0, 0, tiny.width, tiny.height, 1.15);
  const mid = document.createElement("canvas");
  mid.width = 108;
  mid.height = 192;
  const m = mid.getContext("2d")!;
  m.imageSmoothingEnabled = true;
  m.imageSmoothingQuality = "high";
  m.drawImage(tiny, 0, 0, mid.width, mid.height);
  return mid;
}

export class ReelRenderer {
  readonly canvas: HTMLCanvasElement;
  readonly scale: number;
  private ctx: CanvasRenderingContext2D;
  private bufA: HTMLCanvasElement;
  private bufB: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement, scale: number) {
    this.canvas = canvas;
    this.scale = scale;
    canvas.width = Math.round(W * scale);
    canvas.height = Math.round(H * scale);
    this.ctx = canvas.getContext("2d", { alpha: false })!;
    this.bufA = document.createElement("canvas");
    this.bufB = document.createElement("canvas");
    for (const b of [this.bufA, this.bufB]) {
      b.width = canvas.width;
      b.height = canvas.height;
    }
  }

  private prep(ctx: CanvasRenderingContext2D) {
    ctx.setTransform(this.scale, 0, 0, this.scale, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }

  /** Canvas shadows are in device pixels and ignore the transform, so scale them by hand. */
  private shadow(ctx: CanvasRenderingContext2D, blur: number, color = "rgba(0,0,0,0.55)", oy = 0) {
    ctx.shadowColor = color;
    ctx.shadowBlur = blur * this.scale;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = oy * this.scale;
  }

  private noShadow(ctx: CanvasRenderingContext2D) {
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
  }

  render(plan: ReelPlan, tl: Timeline, time: number) {
    const ctx = this.ctx;
    const t = Math.max(0, Math.min(tl.total - 1e-4, time));
    const T = tl.transition;
    let k = tl.slides.findIndex((s) => t >= s.start && t < s.start + s.dur);
    if (k < 0) k = tl.slides.length - 1;
    const cur = tl.slides[k];
    const next = tl.slides[k + 1];
    const lt = t - cur.start;

    this.prep(ctx);
    if (next && lt > cur.dur - T) {
      const p = (lt - (cur.dur - T)) / T;
      const a = this.bufA.getContext("2d")!;
      const b = this.bufB.getContext("2d")!;
      this.prep(a);
      this.prep(b);
      this.drawSlide(a, plan, cur, lt, T);
      this.drawSlide(b, plan, next, t - next.start, T);
      this.compose(ctx, plan.style, p, next.accent);
    } else {
      this.drawSlide(ctx, plan, cur, lt, T);
    }

    // Global overlays.
    this.prep(ctx);
    const endSlide = tl.slides[tl.slides.length - 1];
    const endVis = clamp01((t - (endSlide.start - T)) / Math.max(0.01, T));
    if (plan.cornerMark && endVis < 1) this.drawCornerMark(ctx, 1 - endVis);
    if (plan.hook.trim() && t < INTRO_SECONDS) this.drawHook(ctx, plan, t);
  }

  /* -------- transitions */

  private compose(ctx: CanvasRenderingContext2D, style: ReelStyleId, p: number, accent: string) {
    const A = this.bufA;
    const B = this.bufB;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const cw = this.canvas.width;
    const ch = this.canvas.height;
    const s = this.scale;

    if (style === "colorWipe") {
      const e = easeInOutCubic(p);
      const band = W * 0.22;
      const slant = 0.28; // x shift per unit of height
      const start = -band - H * slant;
      const pos = start + (W - start) * e; // trailing edge
      ctx.drawImage(A, 0, 0);
      // Next image left of the trailing edge, a slanted line x = pos + slant * (H - y).
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(-10, 0);
      ctx.lineTo((pos + slant * H) * s, 0);
      ctx.lineTo(pos * s, ch);
      ctx.lineTo(-10, ch);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(B, 0, 0);
      ctx.restore();
      // The color band, with a thin bright line on its leading edge.
      ctx.save();
      ctx.beginPath();
      ctx.moveTo((pos + slant * H) * s, 0);
      ctx.lineTo((pos + band + slant * H) * s, 0);
      ctx.lineTo((pos + band) * s, ch);
      ctx.lineTo(pos * s, ch);
      ctx.closePath();
      const g = ctx.createLinearGradient(pos * s, 0, (pos + band + slant * H) * s, 0);
      g.addColorStop(0, withAlpha(accent, 0.92));
      g.addColorStop(1, accent);
      ctx.fillStyle = g;
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo((pos + band + slant * H) * s, 0);
      ctx.lineTo((pos + band + 10 + slant * H) * s, 0);
      ctx.lineTo((pos + band + 10) * s, ch);
      ctx.lineTo((pos + band) * s, ch);
      ctx.closePath();
      ctx.fillStyle = "rgba(255,248,230,0.85)";
      ctx.fill();
      ctx.restore();
      return;
    }

    if (style === "royalReveal") {
      const e = easeInOutCubic(p);
      ctx.save();
      // The outgoing image keeps pushing in as it dissolves.
      const z = 1 + 0.05 * e;
      ctx.drawImage(A, (cw - cw * z) / 2, (ch - ch * z) / 2, cw * z, ch * z);
      ctx.globalAlpha = e;
      ctx.drawImage(B, 0, 0);
      ctx.restore();
      // A diagonal sweep of warm gold light.
      const glow = Math.sin(Math.PI * clamp01(p));
      const cx = (-0.4 + 1.8 * e) * cw;
      const g = ctx.createLinearGradient(cx - cw * 0.5, ch * 0.2, cx + cw * 0.5, ch * 0.8);
      g.addColorStop(0, "rgba(255,226,160,0)");
      g.addColorStop(0.5, `rgba(255,232,180,${0.55 * glow})`);
      g.addColorStop(1, "rgba(255,226,160,0)");
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, cw, ch);
      ctx.restore();
      return;
    }

    if (style === "eventCard") {
      // Dip through deep maroon with a turning mandala.
      const first = p < 0.5;
      ctx.drawImage(first ? A : B, 0, 0);
      const dip = first ? easeInOutCubic(p * 2) : 1 - easeInOutCubic((p - 0.5) * 2);
      ctx.fillStyle = withAlpha(MAROON, 0.94 * dip);
      ctx.fillRect(0, 0, cw, ch);
      this.prep(ctx);
      this.drawMandala(ctx, W / 2, H * 0.44, 170, p * 0.9, dip);
      return;
    }

    // whipPan: both images slide left with motion blur.
    const e = easeInOutQuart(p);
    const off = e * cw;
    const blur = Math.sin(Math.PI * clamp01(p)) * cw * 0.06;
    const samples = 6;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, cw, ch);
    for (let i = 0; i < samples; i++) {
      const d = (i / (samples - 1) - 0.5) * blur;
      ctx.globalAlpha = 1 / (i + 1);
      ctx.drawImage(A, -off + d, 0);
      ctx.drawImage(B, cw - off + d, 0);
    }
    ctx.globalAlpha = 1;
  }

  /* -------- slides */

  private drawSlide(ctx: CanvasRenderingContext2D, plan: ReelPlan, slide: Slide, lt: number, T: number) {
    if (slide.kind === "end") return this.drawEnd(ctx, plan, slide, lt);
    const img = slide.img!;
    // Camera progress runs through the incoming transition too, so the move never jumps.
    const prog = clamp01((lt + T) / (slide.dur + T));
    this.drawPhoto(ctx, plan.style, img, slide.n, prog, lt);
    if (plan.style === "royalReveal") this.drawRoyalFrame(ctx);
    if (slide.kind === "before") {
      this.drawBeforeTag(ctx, lt);
      return;
    }
    // With no before photo the hook sits on the first image, so its label waits for the hook to go.
    const delay = slide.n === 0 && !plan.before && plan.hook.trim() ? INTRO_SECONDS - 0.1 : 0;
    if (plan.captions && img.label) this.drawLabel(ctx, plan.style, img, lt - delay, slide.dur - T - delay, slide.n);
  }

  private drawPhoto(ctx: CanvasRenderingContext2D, style: ReelStyleId, img: ReelImage, n: number, prog: number, lt: number) {
    const zoomIn = style === "royalReveal" || n % 2 === 0;
    const range = style === "royalReveal" ? 0.12 : 0.08;
    let zoom = zoomIn ? 1 + range * prog : 1 + range * (1 - prog);
    if (style === "whipPan" && lt >= 0 && lt < 0.3) zoom += 0.05 * (1 - easeOutCubic(lt / 0.3)); // a beat punch-in
    const dir = ((n % 3) + 3) % 3 - 1; // -1, 0, 1
    const dx = dir * 60 * (prog - 0.5);
    const dy = -40 * (prog - 0.5);

    if (img.aspect <= 0.8) {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, H);
      drawCover(ctx, img.src, 0, 0, W, H, zoom, dx, dy);
    } else {
      // Wide images: a soft backdrop of the same image, the photo framed on top.
      drawCover(ctx, img.backdrop, 0, 0, W, H, 1.1);
      ctx.fillStyle = "rgba(10,4,8,0.35)";
      ctx.fillRect(0, 0, W, H);
      const bw = W * 0.9;
      const bh = Math.min(H * 0.52, bw / img.aspect);
      const fw = bh * img.aspect;
      const z = 0.97 + 0.05 * prog;
      const w = fw * z;
      const h = bh * z;
      const x = (W - w) / 2;
      const y = H * 0.41 - h / 2;
      ctx.save();
      this.shadow(ctx, 60, "rgba(0,0,0,0.5)", 20);
      roundRect(ctx, x, y, w, h, 34);
      ctx.fillStyle = "#000";
      ctx.fill();
      this.noShadow(ctx);
      ctx.clip();
      drawCover(ctx, img.src, x, y, w, h, 1.0);
      ctx.restore();
    }
  }

  private drawRoyalFrame(ctx: CanvasRenderingContext2D) {
    // Vignette.
    const v = ctx.createRadialGradient(W / 2, H * 0.45, H * 0.3, W / 2, H * 0.5, H * 0.75);
    v.addColorStop(0, "rgba(20,6,10,0)");
    v.addColorStop(1, "rgba(20,6,10,0.55)");
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, W, H);
    // A gold double rule.
    ctx.strokeStyle = withAlpha(GOLD, 0.9);
    ctx.lineWidth = 3;
    roundRect(ctx, 46, 46, W - 92, H - 92, 22);
    ctx.stroke();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = withAlpha(GOLD, 0.6);
    roundRect(ctx, 62, 62, W - 124, H - 124, 16);
    ctx.stroke();
    // Small diamonds at the middle of each side.
    ctx.fillStyle = GOLD;
    for (const [x, y] of [[W / 2, 46], [W / 2, H - 46], [46, H / 2], [W - 46, H / 2]] as const) {
      ctx.beginPath();
      ctx.moveTo(x, y - 12);
      ctx.lineTo(x + 12, y);
      ctx.lineTo(x, y + 12);
      ctx.lineTo(x - 12, y);
      ctx.closePath();
      ctx.fill();
    }
  }

  private drawBeforeTag(ctx: CanvasRenderingContext2D, lt: number) {
    const a = easeOutCubic(lt / 0.25);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.font = `600 34px Hind, sans-serif`;
    const label = "BEFORE";
    const w = spacedWidth(ctx, label, 8) + 64;
    roundRect(ctx, (W - w) / 2, H * 0.12, w, 70, 35);
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.textBaseline = "middle";
    fillSpaced(ctx, label, W / 2, H * 0.12 + 37, 8);
    ctx.restore();
  }

  /** The image's label: a Navratri day, an event, an art style. Off-screen during transitions. */
  private drawLabel(ctx: CanvasRenderingContext2D, style: ReelStyleId, img: ReelImage, lt: number, visibleUntil: number, n: number) {
    if (lt < 0) return;
    const enter = Math.min(0.35, Math.max(0.12, visibleUntil * 0.35));
    const inA = easeOutCubic(lt / enter);
    const outA = clamp01((visibleUntil - lt) / 0.15);
    const a = Math.min(inA, outA);
    if (a <= 0) return;
    const y = H * 0.7;

    // Readability: a soft dark gradient behind the text.
    const g = ctx.createLinearGradient(0, H * 0.52, 0, H * 0.86);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, `rgba(0,0,0,${(style === "royalReveal" ? 0.78 : 0.6) * a})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, H * 0.52, W, H * 0.48);

    ctx.save();
    ctx.globalAlpha = a;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    if (style === "colorWipe") {
      ctx.font = `600 54px Hind, sans-serif`;
      const text = img.label;
      const w = Math.min(W - 120, ctx.measureText(text).width + 100);
      const lift = (1 - inA) * 40;
      this.shadow(ctx, 30, "rgba(0,0,0,0.35)", 8);
      roundRect(ctx, (W - w) / 2, y - 48 + lift, w, 96, 48);
      ctx.fillStyle = img.accent;
      ctx.fill();
      this.noShadow(ctx);
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(255,255,255,0.85)";
      ctx.stroke();
      ctx.fillStyle = luminance(img.accent) > 0.45 ? "#2b1620" : "#fff";
      ctx.fillText(text, W / 2, y + 4 + lift, W - 160);
    } else if (style === "royalReveal") {
      ctx.font = `400 52px Cinzel, Georgia, serif`;
      const text = img.label.toUpperCase();
      this.shadow(ctx, 22, "rgba(0,0,0,0.95)", 2);
      ctx.fillStyle = GOLD;
      const tw = Math.min(W - 260, spacedWidth(ctx, text, 6));
      fillSpaced(ctx, text, W / 2, y, 6, W - 260);
      this.noShadow(ctx);
      const reach = (1 - inA) * 0.6 + 0.4;
      ctx.strokeStyle = withAlpha(GOLD, 0.85);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(W / 2 - tw / 2 - 30, y);
      ctx.lineTo(W / 2 - tw / 2 - 30 - 80 * reach, y);
      ctx.moveTo(W / 2 + tw / 2 + 30, y);
      ctx.lineTo(W / 2 + tw / 2 + 30 + 80 * reach, y);
      ctx.stroke();
    } else if (style === "eventCard") {
      const slide = (1 - inA) * -120;
      ctx.font = `400 150px "Great Vibes", cursive`;
      this.shadow(ctx, 26, "rgba(0,0,0,0.6)");
      ctx.fillStyle = "#fff";
      ctx.fillText(img.label, W / 2 + slide, y - 20, W - 140);
      this.noShadow(ctx);
      ctx.font = `600 30px Hind, sans-serif`;
      ctx.fillStyle = GOLD;
      fillSpaced(ctx, `${String(n + 1).padStart(2, "0")}`, W / 2 - slide * 0.5, y + 92, 6);
      ctx.strokeStyle = withAlpha(GOLD, 0.9);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(W / 2 - 160 * inA, y + 92);
      ctx.lineTo(W / 2 - 44, y + 92);
      ctx.moveTo(W / 2 + 44, y + 92);
      ctx.lineTo(W / 2 + 160 * inA, y + 92);
      ctx.stroke();
    } else {
      // whipPan: a tilted sticker.
      ctx.font = `400 58px Bungee, Impact, sans-serif`;
      const text = img.label.toUpperCase();
      const w = Math.min(W - 120, ctx.measureText(text).width + 90);
      const pop = 0.85 + 0.15 * easeOutCubic(lt / 0.18);
      ctx.translate(W / 2, y);
      ctx.rotate((-3 * Math.PI) / 180);
      ctx.scale(pop, pop);
      this.shadow(ctx, 0, "rgba(0,0,0,0.9)", 10);
      roundRect(ctx, -w / 2, -52, w, 104, 18);
      ctx.fillStyle = img.accent;
      ctx.fill();
      this.noShadow(ctx);
      ctx.lineWidth = 6;
      ctx.strokeStyle = "#111";
      ctx.stroke();
      ctx.fillStyle = luminance(img.accent) > 0.45 ? "#111" : "#fff";
      ctx.fillText(text, 0, 6, W - 180);
    }
    ctx.restore();
  }

  private drawEnd(ctx: CanvasRenderingContext2D, plan: ReelPlan, slide: Slide, lt: number) {
    if (slide.img) drawCover(ctx, slide.img.backdrop, 0, 0, W, H, 1.15);
    else {
      ctx.fillStyle = MAROON;
      ctx.fillRect(0, 0, W, H);
    }
    ctx.fillStyle = "rgba(50,8,17,0.84)";
    ctx.fillRect(0, 0, W, H);
    const glow = ctx.createRadialGradient(W / 2, H * 0.42, 40, W / 2, H * 0.42, W * 0.8);
    glow.addColorStop(0, "rgba(236,208,138,0.22)");
    glow.addColorStop(1, "rgba(236,208,138,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);
    this.drawMandala(ctx, W / 2, H * 0.36, 230, Math.max(0, lt) * 0.15, 0.35);

    const step = (i: number) => easeOutCubic((Math.max(0, lt) - 0.07 * i) / 0.45);
    const item = (i: number, fn: () => void) => {
      const e = step(i);
      if (e <= 0) return;
      ctx.save();
      ctx.globalAlpha = e;
      ctx.translate(0, (1 - e) * 40);
      fn();
      ctx.restore();
    };
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    item(0, () => {
      const size = 190;
      const x = W / 2 - size / 2;
      const y = H * 0.36 - size / 2;
      if (plan.logo) {
        this.shadow(ctx, 40, "rgba(0,0,0,0.45)", 10);
        ctx.save();
        roundRect(ctx, x, y, size, size, 42);
        ctx.clip();
        ctx.drawImage(plan.logo, x, y, size, size);
        ctx.restore();
        this.noShadow(ctx);
      } else {
        roundRect(ctx, x, y, size, size, 42);
        ctx.fillStyle = "#9E1B32";
        ctx.fill();
      }
    });
    item(1, () => {
      ctx.font = `500 44px Hind, sans-serif`;
      ctx.fillStyle = "rgba(255,255,255,0.78)";
      ctx.fillText("Made with", W / 2, H * 0.47);
    });
    item(2, () => {
      ctx.font = `400 128px "Rozha One", Georgia, serif`;
      ctx.fillStyle = GOLD;
      this.shadow(ctx, 24, "rgba(0,0,0,0.4)");
      ctx.fillText("MandapCanvas", W / 2, H * 0.53, W - 120);
      this.noShadow(ctx);
    });
    item(3, () => {
      ctx.font = `600 50px Hind, sans-serif`;
      ctx.fillStyle = "#fff";
      ctx.fillText("mandapcanvas.com", W / 2, H * 0.59);
      ctx.font = `400 36px Hind, sans-serif`;
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.fillText("Your looks, from one selfie", W / 2, H * 0.625);
    });
    const code = plan.code.trim();
    if (code) {
      item(4, () => {
        ctx.font = `600 52px Hind, sans-serif`;
        const label = `Use code ${code}`;
        const w = Math.min(W - 140, ctx.measureText(label).width + 110);
        const y = H * 0.69;
        roundRect(ctx, (W - w) / 2, y - 55, w, 110, 55);
        ctx.fillStyle = "rgba(236,208,138,0.14)";
        ctx.fill();
        ctx.setLineDash([14, 10]);
        ctx.lineWidth = 3;
        ctx.strokeStyle = GOLD;
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = "#fff";
        ctx.fillText(label, W / 2, y + 4, W - 200);
      });
    }
  }

  private drawMandala(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, rot: number, alpha: number) {
    if (alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(cx, cy);
    ctx.rotate(rot);
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 3;
    const petals = 16;
    for (let i = 0; i < petals; i++) {
      ctx.save();
      ctx.rotate((i * 2 * Math.PI) / petals);
      ctx.beginPath();
      ctx.ellipse(0, -r * 0.62, r * 0.13, r * 0.38, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    ctx.rotate(Math.PI / petals);
    for (let i = 0; i < petals; i++) {
      ctx.save();
      ctx.rotate((i * 2 * Math.PI) / petals);
      ctx.beginPath();
      ctx.ellipse(0, -r * 0.36, r * 0.07, r * 0.2, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.14, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.02, 0, Math.PI * 2);
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = GOLD;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.05, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawCornerMark(ctx: CanvasRenderingContext2D, alpha: number) {
    ctx.save();
    ctx.globalAlpha = 0.8 * alpha;
    ctx.font = `600 28px Hind, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#fff";
    this.shadow(ctx, 12, "rgba(0,0,0,0.6)");
    fillSpaced(ctx, "MANDAPCANVAS.COM", W / 2, H * 0.085, 5);
    ctx.restore();
  }

  private drawHook(ctx: CanvasRenderingContext2D, plan: ReelPlan, t: number) {
    // Fully visible on the first frame, so it works as the reel's cover.
    const a = clamp01((INTRO_SECONDS - t) / 0.3);
    if (a <= 0) return;
    const pop = 1 + 0.04 * (1 - easeOutCubic(t / 0.4));
    const font =
      plan.style === "royalReveal"
        ? { family: `Cinzel, Georgia, serif`, weight: 400, size: 96 }
        : plan.style === "eventCard"
        ? { family: `"Playfair Display", Georgia, serif`, weight: 400, size: 104 }
        : plan.style === "whipPan"
        ? { family: `Bungee, Impact, sans-serif`, weight: 400, size: 100 }
        : { family: `Unbounded, "Hind", sans-serif`, weight: 400, size: 96 };

    // Sits over the lower middle, where portraits show the outfit, not the face.
    const g = ctx.createLinearGradient(0, H * 0.36, 0, H * 0.86);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, `rgba(0,0,0,${0.62 * a})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, H * 0.36, W, H * 0.64);

    ctx.save();
    ctx.globalAlpha = a;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const maxW = W * 0.84;
    let size = font.size;
    let lines: string[] = [];
    for (; size >= 54; size -= 6) {
      ctx.font = `${font.weight} ${size}px ${font.family}`;
      lines = wrap(ctx, plan.hook.trim(), maxW);
      if (lines.length <= 3 && lines.every((l) => ctx.measureText(l).width <= maxW)) break;
    }
    lines = balance(ctx, plan.hook.trim(), lines.length, maxW);
    const lh = size * 1.18;
    const cy = H * 0.64;
    ctx.translate(W / 2, cy);
    ctx.scale(pop, pop);
    this.shadow(ctx, 30, "rgba(0,0,0,0.65)", 4);
    ctx.fillStyle = "#fff";
    lines.forEach((l, i) => ctx.fillText(l, 0, (i - (lines.length - 1) / 2) * lh, maxW));
    ctx.restore();
  }
}

/* -------- text */

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line);
      line = w;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

/** Same number of lines as a greedy wrap, but evened out ("9 days, 9 colors, / 1 selfie" not "9 days, 9 / colors, 1 selfie"). */
function balance(ctx: CanvasRenderingContext2D, text: string, count: number, maxW: number): string[] {
  let best = wrap(ctx, text, maxW);
  if (count <= 1) return best;
  // Prefer breaking at commas when the phrases fit.
  const parts = text.split(/(?<=,)\s+/);
  if (parts.length >= count && parts.length <= 6) {
    let pick: string[] | null = null;
    let pickW = Infinity;
    const walk = (i: number, acc: string[]) => {
      if (acc.length === count - 1) {
        const lines = [...acc, parts.slice(i).join(" ")];
        const widest = Math.max(...lines.map((l) => ctx.measureText(l).width));
        if (widest <= maxW && widest < pickW) {
          pick = lines;
          pickW = widest;
        }
        return;
      }
      for (let j = i + 1; j <= parts.length - (count - 1 - acc.length); j++) walk(j, [...acc, parts.slice(i, j).join(" ")]);
    };
    walk(0, []);
    if (pick) return pick;
  }
  for (let w = maxW; w > 100; w -= 8) {
    const l = wrap(ctx, text, w);
    if (l.length > count) break;
    best = l;
  }
  return best;
}

/** Letter spacing by hand: canvas letterSpacing isn't in every browser yet. */
function spacedWidth(ctx: CanvasRenderingContext2D, text: string, spacing: number): number {
  let w = 0;
  for (const ch of text) w += ctx.measureText(ch).width + spacing;
  return Math.max(0, w - spacing);
}

function fillSpaced(ctx: CanvasRenderingContext2D, text: string, cx: number, y: number, spacing: number, maxW?: number) {
  const full = spacedWidth(ctx, text, spacing);
  const squeeze = maxW && full > maxW ? maxW / full : 1;
  ctx.save();
  const align = ctx.textAlign;
  ctx.textAlign = "left";
  ctx.translate(cx - (full * squeeze) / 2, y);
  ctx.scale(squeeze, 1);
  let x = 0;
  for (const ch of text) {
    ctx.fillText(ch, x, 0);
    x += ctx.measureText(ch).width + spacing;
  }
  ctx.textAlign = align;
  ctx.restore();
}
