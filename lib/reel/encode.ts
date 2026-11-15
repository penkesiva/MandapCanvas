"use client";

/**
 * Turns a reel into a video file in the browser. Uses WebCodecs (H.264 MP4, faster than real time) where the
 * browser has it, and falls back to recording the canvas in real time with MediaRecorder elsewhere.
 * No server, no upload: the images never leave the customer's device.
 */

import { REEL_FPS } from "./templates";

export interface EncodeResult {
  blob: Blob;
  ext: "mp4" | "webm";
}

export interface EncodeOptions {
  canvas: HTMLCanvasElement;
  duration: number;
  /** Draws the frame for time t (seconds) onto the canvas. */
  draw: (t: number) => void;
  onProgress?: (fraction: number) => void;
  signal?: { cancelled: boolean };
}

export class EncodeCancelled extends Error {
  constructor() {
    super("cancelled");
  }
}

export async function encodeReel(o: EncodeOptions): Promise<EncodeResult> {
  if (typeof window !== "undefined" && "VideoEncoder" in window) {
    try {
      const r = await encodeWithWebCodecs(o);
      if (r) return r;
    } catch (e) {
      if (e instanceof EncodeCancelled) throw e;
      console.warn("WebCodecs export failed, recording in real time instead", e);
    }
  }
  return recordRealtime(o);
}

async function encodeWithWebCodecs(o: EncodeOptions): Promise<EncodeResult | null> {
  const mb = await import("mediabunny");
  const { width, height } = o.canvas;
  const supported = await mb.canEncodeVideo("avc", { width, height, frameRate: REEL_FPS, quality: mb.QUALITY_HIGH });
  if (!supported) return null;

  const target = new mb.BufferTarget();
  const output = new mb.Output({ format: new mb.Mp4OutputFormat({ fastStart: "in-memory" }), target });
  const source = new mb.CanvasSource(o.canvas, { codec: "avc", quality: mb.QUALITY_HIGH, keyFrameInterval: 1 });
  output.addVideoTrack(source, { frameRate: REEL_FPS });
  await output.start();

  const frames = Math.ceil(o.duration * REEL_FPS);
  const dt = 1 / REEL_FPS;
  for (let i = 0; i < frames; i++) {
    if (o.signal?.cancelled) {
      await output.cancel();
      throw new EncodeCancelled();
    }
    const t = i * dt;
    o.draw(t);
    await source.add(t, dt);
    o.onProgress?.((i + 1) / frames);
    // Let the page breathe so the progress bar paints.
    if (i % 10 === 9) await new Promise((r) => setTimeout(r, 0));
  }
  await output.finalize();
  if (!target.buffer) return null;
  return { blob: new Blob([target.buffer], { type: "video/mp4" }), ext: "mp4" };
}

function pickRecorderType(): { mime: string; ext: "mp4" | "webm" } | null {
  if (typeof MediaRecorder === "undefined") return null;
  const options: { mime: string; ext: "mp4" | "webm" }[] = [
    { mime: "video/mp4;codecs=avc1", ext: "mp4" },
    { mime: "video/mp4", ext: "mp4" },
    { mime: "video/webm;codecs=vp9", ext: "webm" },
    { mime: "video/webm", ext: "webm" },
  ];
  return options.find((x) => MediaRecorder.isTypeSupported(x.mime)) ?? null;
}

async function recordRealtime(o: EncodeOptions): Promise<EncodeResult> {
  const type = pickRecorderType();
  if (!type || !o.canvas.captureStream) throw new Error("This browser can't make videos. Try the latest Chrome, Safari or Edge.");
  const stream = o.canvas.captureStream(REEL_FPS);
  const rec = new MediaRecorder(stream, { mimeType: type.mime, videoBitsPerSecond: 12_000_000 });
  const chunks: Blob[] = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  const stopped = new Promise<void>((r) => (rec.onstop = () => r()));

  o.draw(0);
  rec.start(250);
  const t0 = performance.now();
  await new Promise<void>((resolve, reject) => {
    const tick = () => {
      if (o.signal?.cancelled) {
        rec.stop();
        return reject(new EncodeCancelled());
      }
      const t = (performance.now() - t0) / 1000;
      o.draw(Math.min(t, o.duration));
      o.onProgress?.(Math.min(1, t / o.duration));
      if (t >= o.duration) return resolve();
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  rec.stop();
  await stopped;
  stream.getTracks().forEach((tr) => tr.stop());
  return { blob: new Blob(chunks, { type: type.mime.split(";")[0] }), ext: type.ext };
}
