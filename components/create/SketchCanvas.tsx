"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Brush, Circle, Eraser, Minus, PenLine, Redo2, Square, Trash2, Undo2, Spline } from "lucide-react";

export interface SketchCanvasHandle {
  toBlob(): Promise<Blob | null>;
  isEmpty(): boolean;
}

type Tool = "pen" | "brush" | "line" | "rect" | "arch" | "circle" | "eraser";

const W = 1200;
const H = 900;
const PAPER = "#fcf8f2";

const COLORS = [
  { name: "Ink", value: "#2b1620" },
  { name: "Rose", value: "#e8789a" },
  { name: "Blush", value: "#f2c4c0" },
  { name: "Marigold", value: "#e9a23b" },
  { name: "Red", value: "#9e1b32" },
  { name: "Gold", value: "#b8923a" },
  { name: "Leaf", value: "#5f7f3a" },
  { name: "Ivory", value: "#efe2c6" },
];

const TOOLS: { id: Tool; label: string; icon: React.ReactNode }[] = [
  { id: "pen", label: "Pen", icon: <PenLine size={18} /> },
  { id: "brush", label: "Watercolor brush", icon: <Brush size={18} /> },
  { id: "line", label: "Straight line", icon: <Minus size={18} /> },
  { id: "arch", label: "Arch or dome", icon: <Spline size={18} /> },
  { id: "rect", label: "Rectangle", icon: <Square size={18} /> },
  { id: "circle", label: "Circle", icon: <Circle size={18} /> },
  { id: "eraser", label: "Eraser", icon: <Eraser size={18} /> },
];

type TemplateId = "four_pillar" | "arch_stage" | "three_arches" | "round_mandap";

const TEMPLATES: { id: TemplateId; name: string }[] = [
  { id: "four_pillar", name: "Four-pillar mandap" },
  { id: "round_mandap", name: "Round mandap" },
  { id: "arch_stage", name: "Arch backdrop stage" },
  { id: "three_arches", name: "Three-arch stage" },
];

function drawTemplate(ctx: CanvasRenderingContext2D, id: TemplateId) {
  ctx.save();
  ctx.strokeStyle = "#2b1620";
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const line = (x1: number, y1: number, x2: number, y2: number) => {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  };
  // stage
  line(150, 780, 1050, 780);
  line(220, 720, 980, 720);
  line(150, 780, 220, 720);
  line(1050, 780, 980, 720);
  if (id === "four_pillar" || id === "round_mandap") {
    const xs = [250, 450, 750, 950];
    for (const x of xs) {
      line(x, 300, x, 730);
      line(x - 16, 730, x + 16, 730);
      line(x - 16, 300, x + 16, 300);
    }
    ctx.beginPath();
    if (id === "four_pillar") {
      ctx.moveTo(220, 300);
      ctx.quadraticCurveTo(600, 80, 980, 300);
      ctx.moveTo(220, 300);
      ctx.lineTo(980, 300);
    } else {
      ctx.ellipse(600, 300, 380, 170, 0, Math.PI, 2 * Math.PI);
      ctx.moveTo(220, 300);
      ctx.lineTo(980, 300);
    }
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(600, 120, 22, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (id === "arch_stage") {
    ctx.beginPath();
    ctx.moveTo(330, 720);
    ctx.lineTo(330, 380);
    ctx.arc(600, 380, 270, Math.PI, 0);
    ctx.lineTo(870, 720);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(600, 450, 110, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (id === "three_arches") {
    for (const [cx, w, top] of [[340, 180, 420], [600, 240, 330], [860, 180, 420]] as const) {
      ctx.beginPath();
      ctx.moveTo(cx - w / 2, 720);
      ctx.lineTo(cx - w / 2, top);
      // scalloped Mughal arch
      ctx.quadraticCurveTo(cx - w / 2, top - w * 0.45, cx, top - w * 0.62);
      ctx.quadraticCurveTo(cx + w / 2, top - w * 0.45, cx + w / 2, top);
      ctx.lineTo(cx + w / 2, 720);
      ctx.stroke();
    }
  }
  // couple seats
  for (const x of [540, 660]) {
    line(x - 30, 720, x - 30, 640);
    line(x + 30, 720, x + 30, 640);
    ctx.beginPath();
    ctx.arc(x, 640, 30, Math.PI, 0);
    ctx.stroke();
  }
  ctx.restore();
}

export const SketchCanvas = forwardRef<SketchCanvasHandle, { onChange?: () => void }>(function SketchCanvas({ onChange }, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<Tool>("pen");
  const [color, setColor] = useState(COLORS[0].value);
  const [size, setSize] = useState(6);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [future, setFuture] = useState<ImageData[]>([]);
  const drawing = useRef<{ x: number; y: number; points: { x: number; y: number }[] } | null>(null);
  const dirty = useRef(false);

  const ctx = () => canvasRef.current!.getContext("2d", { willReadFrequently: true })!;

  const fillPaper = useCallback(() => {
    const c = ctx();
    c.save();
    c.globalCompositeOperation = "source-over";
    c.fillStyle = PAPER;
    c.fillRect(0, 0, W, H);
    c.restore();
  }, []);

  useEffect(() => {
    fillPaper();
  }, [fillPaper]);

  useImperativeHandle(ref, () => ({
    toBlob: () => new Promise((resolve) => canvasRef.current!.toBlob((b) => resolve(b), "image/png")),
    isEmpty: () => !dirty.current,
  }));

  const snapshot = () => {
    setHistory((h) => [...h.slice(-29), ctx().getImageData(0, 0, W, H)]);
    setFuture([]);
  };

  const point = (e: React.PointerEvent) => {
    const r = canvasRef.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
  };

  const strokeStyle = (c: CanvasRenderingContext2D, pressure = 0.5) => {
    c.lineCap = "round";
    c.lineJoin = "round";
    if (tool === "eraser") {
      c.globalCompositeOperation = "source-over";
      c.strokeStyle = PAPER;
      c.globalAlpha = 1;
      c.lineWidth = size * 4;
    } else if (tool === "brush") {
      c.globalCompositeOperation = "multiply";
      c.strokeStyle = color;
      c.globalAlpha = 0.18;
      c.lineWidth = size * 5;
    } else {
      c.globalCompositeOperation = "source-over";
      c.strokeStyle = color;
      c.globalAlpha = 1;
      c.lineWidth = Math.max(1.5, size * (0.6 + pressure * 0.8));
    }
  };

  const drawShape = (c: CanvasRenderingContext2D, a: { x: number; y: number }, b: { x: number; y: number }) => {
    c.beginPath();
    if (tool === "line") {
      c.moveTo(a.x, a.y);
      c.lineTo(b.x, b.y);
    } else if (tool === "rect") {
      c.rect(Math.min(a.x, b.x), Math.min(a.y, b.y), Math.abs(b.x - a.x), Math.abs(b.y - a.y));
    } else if (tool === "circle") {
      const r = Math.hypot(b.x - a.x, b.y - a.y);
      c.arc(a.x, a.y, r, 0, Math.PI * 2);
    } else if (tool === "arch") {
      const left = Math.min(a.x, b.x);
      const right = Math.max(a.x, b.x);
      const base = Math.max(a.y, b.y);
      const top = Math.min(a.y, b.y);
      c.moveTo(left, base);
      c.bezierCurveTo(left, top, right, top, right, base);
    }
    c.stroke();
  };

  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    snapshot();
    const p = point(e);
    drawing.current = { ...p, points: [p] };
    if (tool === "pen" || tool === "brush" || tool === "eraser") {
      const c = ctx();
      strokeStyle(c, e.pressure || 0.5);
      c.beginPath();
      c.moveTo(p.x, p.y);
      c.lineTo(p.x + 0.01, p.y + 0.01);
      c.stroke();
    }
  };

  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const d = drawing.current;
    if (!d) return;
    const p = point(e);
    if (tool === "pen" || tool === "brush" || tool === "eraser") {
      const c = ctx();
      strokeStyle(c, e.pressure || 0.5);
      const last = d.points[d.points.length - 1];
      const mid = { x: (last.x + p.x) / 2, y: (last.y + p.y) / 2 };
      c.beginPath();
      c.moveTo(last.x, last.y);
      c.quadraticCurveTo(last.x, last.y, mid.x, mid.y);
      c.lineTo(p.x, p.y);
      c.stroke();
      d.points.push(p);
    } else {
      const o = overlayRef.current!.getContext("2d")!;
      o.clearRect(0, 0, W, H);
      strokeStyle(o);
      o.globalCompositeOperation = "source-over";
      drawShape(o, d, p);
    }
  };

  const onUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const d = drawing.current;
    drawing.current = null;
    if (!d) return;
    if (!(tool === "pen" || tool === "brush" || tool === "eraser")) {
      overlayRef.current!.getContext("2d")!.clearRect(0, 0, W, H);
      const c = ctx();
      strokeStyle(c);
      drawShape(c, d, point(e));
    }
    const c = ctx();
    c.globalAlpha = 1;
    c.globalCompositeOperation = "source-over";
    dirty.current = true;
    onChange?.();
  };

  const undo = () => {
    if (!history.length) return;
    const prev = history[history.length - 1];
    setFuture((f) => [ctx().getImageData(0, 0, W, H), ...f]);
    setHistory((h) => h.slice(0, -1));
    ctx().putImageData(prev, 0, 0);
  };
  const redo = () => {
    if (!future.length) return;
    setHistory((h) => [...h, ctx().getImageData(0, 0, W, H)]);
    ctx().putImageData(future[0], 0, 0);
    setFuture((f) => f.slice(1));
  };
  const clear = () => {
    snapshot();
    fillPaper();
    dirty.current = false;
    onChange?.();
  };
  const template = (id: TemplateId) => {
    snapshot();
    drawTemplate(ctx(), id);
    dirty.current = true;
    onChange?.();
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2" role="toolbar" aria-label="Drawing tools">
        <div className="flex rounded-full border border-line bg-white p-1">
          {TOOLS.map((t) => (
            <button
              key={t.id}
              type="button"
              title={t.label}
              aria-label={t.label}
              aria-pressed={tool === t.id}
              onClick={() => setTool(t.id)}
              className={`grid h-9 w-9 place-items-center rounded-full ${tool === t.id ? "bg-kumkum text-white" : "text-ink hover:bg-milk"}`}
            >
              {t.icon}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-line bg-white px-2 py-1.5">
          {COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              title={c.name}
              aria-label={`${c.name} color`}
              aria-pressed={color === c.value}
              onClick={() => setColor(c.value)}
              className={`h-7 w-7 rounded-full border-2 ${color === c.value ? "border-ink ring-2 ring-marigold" : "border-white"}`}
              style={{ background: c.value }}
            />
          ))}
        </div>
        <label className="flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5 text-sm">
          Size
          <input type="range" min={2} max={20} value={size} onChange={(e) => setSize(Number(e.target.value))} className="w-24 accent-kumkum" />
        </label>
        <div className="ml-auto flex gap-1">
          <button type="button" className="btn btn-ghost !min-h-10 !px-3" onClick={undo} disabled={!history.length} aria-label="Undo">
            <Undo2 size={18} />
          </button>
          <button type="button" className="btn btn-ghost !min-h-10 !px-3" onClick={redo} disabled={!future.length} aria-label="Redo">
            <Redo2 size={18} />
          </button>
          <button type="button" className="btn btn-ghost !min-h-10 !px-3" onClick={clear} aria-label="Clear drawing">
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-[18px] border border-line bg-white">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="block aspect-[4/3] w-full touch-none"
          style={{ cursor: "crosshair" }}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          aria-label="Drawing canvas for your mandap or stage sketch"
          role="img"
        />
        <canvas ref={overlayRef} width={W} height={H} className="pointer-events-none absolute inset-0 aspect-[4/3] w-full" />
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-ink-soft">Start from an outline:</span>
        {TEMPLATES.map((t) => (
          <button key={t.id} type="button" className="chip !min-h-9 !text-sm" onClick={() => template(t.id)}>
            {t.name}
          </button>
        ))}
      </div>
    </div>
  );
});
