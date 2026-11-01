"use client";

import { cardLines, type CardDetails, type CardFormat, type CardTemplate, type LineRole } from "./weddingCards";

/** Pixel size of the finished card. */
export function cardSize(format: CardFormat): { w: number; h: number } {
  return format === "story" ? { w: 1080, h: 1920 } : { w: 1200, h: 1600 };
}

const BOX: Record<CardTemplate["area"], [number, number, number, number]> = {
  center: [0.13, 0.19, 0.74, 0.62],
  lower: [0.09, 0.5, 0.82, 0.45],
  upper: [0.08, 0.04, 0.84, 0.46],
};

/** Script and wide display faces read at different sizes; even them out. */
const DISPLAY_SCALE: Record<string, number> = {
  "Great Vibes": 1.4,
  Cinzel: 0.82,
  Unbounded: 0.72,
  Bungee: 0.78,
  "Yatra One": 1,
  "Playfair Display": 0.98,
  Fredoka: 1,
  "M PLUS Rounded 1c": 0.92,
};

interface Style {
  font: "display" | "body";
  size: number; // in % of card width
  weight: number;
  italic?: boolean;
  color: "ink" | "accent";
  gapBefore: number; // in % of card width
  caps?: boolean;
  spacing?: number; // letter spacing in em
}

const ROLE: Record<LineRole, Style> = {
  kicker: { font: "body", size: 3.3, weight: 500, italic: true, color: "accent", gapBefore: 0 },
  names: { font: "display", size: 9.5, weight: 400, color: "ink", gapBefore: 1.4 },
  amp: { font: "display", size: 5, weight: 400, color: "accent", gapBefore: 0.2 },
  event: { font: "body", size: 3.2, weight: 500, color: "ink", gapBefore: 1.6 },
  date: { font: "body", size: 3.9, weight: 700, color: "ink", gapBefore: 2.2, caps: false },
  venue: { font: "body", size: 3.4, weight: 500, color: "ink", gapBefore: 0.8 },
  small: { font: "body", size: 2.7, weight: 600, color: "accent", gapBefore: 1 },
};

export async function loadCardFonts(t: CardTemplate): Promise<void> {
  if (typeof document === "undefined" || !document.fonts) return;
  await Promise.all(
    [`400 40px "${t.display}"`, `500 40px "${t.body}"`, `600 40px "${t.body}"`, `700 40px "${t.body}"`, `italic 500 40px "${t.body}"`].map((f) =>
      document.fonts.load(f).catch(() => null),
    ),
  );
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((ok, no) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => ok(img);
    img.onerror = () => no(new Error("image failed"));
    img.src = src;
  });
}

function fontString(t: CardTemplate, s: Style, px: number): string {
  const fam = s.font === "display" ? t.display : t.body;
  return `${s.italic ? "italic " : ""}${s.font === "display" ? 400 : s.weight} ${px}px "${fam}", Georgia, serif`;
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(/\s+/);
  const out: string[] = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(next).width <= maxW || !cur) cur = next;
    else {
      out.push(cur);
      cur = w;
    }
  }
  if (cur) out.push(cur);
  return out;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  // Big radii become an arch: round top, gently rounded bottom.
  const top = Math.min(r, w / 2, h / 2);
  const bottom = r > 60 ? 18 : Math.min(r, h / 2);
  ctx.beginPath();
  ctx.moveTo(x, y + top);
  ctx.arcTo(x, y, x + top, y, top);
  ctx.lineTo(x + w - top, y);
  ctx.arcTo(x + w, y, x + w, y + top, top);
  ctx.lineTo(x + w, y + h - bottom);
  ctx.arcTo(x + w, y + h, x + w - bottom, y + h, bottom);
  ctx.lineTo(x + bottom, y + h);
  ctx.arcTo(x, y + h, x, y + h - bottom, bottom);
  ctx.closePath();
}

/**
 * Draws a finished invitation: the artwork (cover-fit), a panel if the style uses one, then the
 * text block fitted inside the style's text area.
 */
export function drawCard(
  canvas: HTMLCanvasElement,
  opts: { art: HTMLImageElement | null; template: CardTemplate; details: CardDetails; format: CardFormat; sample?: boolean; badge?: boolean },
) {
  const { w: W, h: H } = cardSize(opts.format);
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const t = opts.template;

  // artwork
  if (opts.art) {
    const s = Math.max(W / opts.art.naturalWidth, H / opts.art.naturalHeight);
    const dw = opts.art.naturalWidth * s;
    const dh = opts.art.naturalHeight * s;
    ctx.drawImage(opts.art, (W - dw) / 2, (H - dh) / 2, dw, dh);
  } else {
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, t.swatch[2]);
    g.addColorStop(0.6, t.swatch[0]);
    g.addColorStop(1, t.swatch[1]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  // text box
  const [bx, by, bw, bh] = BOX[t.area];
  const box = { x: bx * W, y: by * H, w: bw * W, h: bh * H };
  const pad = W * 0.05;
  const inner = { x: box.x + pad, y: box.y + pad, w: box.w - pad * 2, h: box.h - pad * 2 };
  const unit = W / 100;
  const lines = cardLines(opts.details);

  // Lay out at full size, then shrink until it fits the box height.
  type Laid = { text: string; font: string; color: string; size: number; gap: number };
  let scale = 1;
  let laid: Laid[] = [];
  let total = 0;
  for (let pass = 0; pass < 6; pass++) {
    laid = [];
    total = 0;
    lines.forEach((ln, i) => {
      const st = ROLE[ln.role];
      const base = st.size * unit * scale * (st.font === "display" ? (DISPLAY_SCALE[t.display] ?? 1) : 1);
      let size = base;
      ctx.font = fontString(t, st, size);
      // Names never wrap: shrink the one line instead.
      if (ln.role === "names") {
        const width = ctx.measureText(ln.text).width;
        if (width > inner.w) size = (size * inner.w) / width;
        ctx.font = fontString(t, st, size);
      }
      const rows = ln.role === "names" || ln.role === "amp" ? [ln.text] : wrap(ctx, ln.text, inner.w);
      rows.forEach((r, j) => {
        const gap = j === 0 && i > 0 ? st.gapBefore * unit * scale : size * 0.18;
        const lh = st.font === "display" ? size * 1.08 : size * 1.25;
        laid.push({ text: r, font: ctx.font, color: st.color === "ink" ? t.ink : t.accent, size: lh, gap });
        total += gap + lh;
      });
    });
    if (total <= inner.h) break;
    scale *= Math.max(0.7, inner.h / total);
  }

  // panel hugs the text (centered in the box)
  if (t.panel) {
    const ph = Math.min(box.h, total + pad * 2);
    const py = box.y + (box.h - ph) / 2;
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.12)";
    ctx.shadowBlur = W * 0.02;
    roundRect(ctx, box.x, py, box.w, ph, (t.panel.radius / 900) * W);
    ctx.fillStyle = t.panel.fill;
    ctx.fill();
    ctx.restore();
    if (t.panel.stroke) {
      roundRect(ctx, box.x + W * 0.008, py + W * 0.008, box.w - W * 0.016, ph - W * 0.016, Math.max(0, (t.panel.radius / 900) * W - W * 0.008));
      ctx.strokeStyle = t.panel.stroke;
      ctx.lineWidth = W * 0.0025;
      ctx.stroke();
    }
  }

  // No panel: a soft paper-colored glow keeps the words readable if the artwork crowds the space.
  if (!t.panel) {
    const cxg = box.x + box.w / 2;
    const cyg = box.y + box.h / 2;
    const r = Math.max(box.w, total + pad * 2) * 0.62;
    const g = ctx.createRadialGradient(cxg, cyg, r * 0.2, cxg, cyg, r);
    g.addColorStop(0, "rgba(255,252,246,0.78)");
    g.addColorStop(0.6, "rgba(255,252,246,0.55)");
    g.addColorStop(1, "rgba(255,252,246,0)");
    ctx.save();
    ctx.translate(cxg, cyg);
    ctx.scale(1, (total + pad * 2) / Math.max(box.w, total + pad * 2) + 0.25);
    ctx.translate(-cxg, -cyg);
    ctx.fillStyle = g;
    ctx.fillRect(box.x - r, cyg - r, box.w + r * 2, r * 2);
    ctx.restore();
  }

  // text
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  let y = box.y + (box.h - total) / 2;
  const cx = box.x + box.w / 2;
  for (const l of laid) {
    y += l.gap;
    ctx.font = l.font;
    ctx.fillStyle = l.color;
    if (!t.panel) {
      ctx.shadowColor = "rgba(255,255,255,0.65)";
      ctx.shadowBlur = W * 0.01;
    }
    ctx.fillText(l.text, cx, y + l.size / 2);
    ctx.shadowBlur = 0;
    y += l.size;
  }

  if (opts.sample) {
    const label = "SAMPLE ARTWORK";
    ctx.font = `700 ${unit * 2.4}px "Hind", sans-serif`;
    const tw = ctx.measureText(label).width + unit * 4;
    ctx.fillStyle = "rgba(50,8,17,0.78)";
    roundRect(ctx, W - tw - unit * 3, unit * 3, tw, unit * 5, unit * 2.5);
    ctx.fill();
    ctx.fillStyle = "#ecd08a";
    ctx.textAlign = "center";
    ctx.fillText(label, W - tw / 2 - unit * 3, unit * 5.6);
  }
  if (opts.badge) {
    const label = "Made with MandapCanvas";
    ctx.font = `600 ${unit * 2}px "Hind", sans-serif`;
    const tw = ctx.measureText(label).width + unit * 3.6;
    ctx.fillStyle = "rgba(50,8,17,0.72)";
    roundRect(ctx, (W - tw) / 2, H - unit * 6.2, tw, unit * 4, unit * 2);
    ctx.fill();
    ctx.fillStyle = "#fff8ef";
    ctx.textAlign = "center";
    ctx.fillText(label, W / 2, H - unit * 4.15);
  }
}
