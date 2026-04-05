"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, Sparkles } from "lucide-react";
import { UploadPanel } from "@/components/UploadPanel";
import { GenerationOptions } from "@/components/GenerationOptions";
import { ResultsGallery } from "@/components/ResultsGallery";
import type { GeneratedImageResult, GenerationSettings } from "@/lib/types";

const defaultSettings = (): GenerationSettings => ({
  coupleMode: "none",
  audienceMode: "no_audience",
  venueMode: "indoor",
  colorMode: "preserve_sketch",
  paletteId: null,
  customNotes: "",
  variationCount: 2,
});

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [settings, setSettings] = useState<GenerationSettings>(defaultSettings);
  const [busy, setBusy] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string | null>(null);
  const [images, setImages] = useState<GeneratedImageResult[]>([]);
  const [warnings, setWarnings] = useState<string[] | undefined>();

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const canGenerate = useMemo(() => !!file && !busy, [file, busy]);

  const validateFile = useCallback((f: File | null) => {
    setUploadError(null);
    if (!f) return;
    const okTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    const t = f.type.toLowerCase();
    if (!okTypes.includes(t)) {
      setUploadError("Use JPG, PNG, or WEBP.");
      setFile(null);
      return;
    }
    if (f.size > 12 * 1024 * 1024) {
      setUploadError("Max 12 MB.");
      setFile(null);
      return;
    }
    setFile(f);
  }, []);

  const runGeneration = useCallback(async () => {
    if (!file) {
      setApiError("Add a sketch first.");
      return;
    }
    setBusy(true);
    setApiError(null);
    setWarnings(undefined);
    try {
      const form = new FormData();
      form.append("image", file);
      form.append("coupleMode", settings.coupleMode);
      form.append("audienceMode", settings.audienceMode);
      form.append("venueMode", settings.venueMode);
      form.append("colorMode", settings.colorMode);
      if (settings.paletteId) form.append("paletteId", settings.paletteId);
      form.append("customNotes", settings.customNotes);
      form.append("variationCount", String(settings.variationCount));

      const res = await fetch("/api/generate", {
        method: "POST",
        body: form,
      });
      const data = (await res.json()) as {
        ok: boolean;
        prompt?: string;
        images?: GeneratedImageResult[];
        warnings?: string[];
        error?: string;
      };

      if (!res.ok || !data.ok) {
        setApiError(data.error ?? "Generation failed.");
        return;
      }

      setPrompt(data.prompt ?? null);
      setImages(data.images ?? []);
      setWarnings(data.warnings);
    } catch {
      setApiError("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }, [file, settings]);

  const download = useCallback((img: GeneratedImageResult) => {
    const ext = img.mimeType.includes("jpeg") || img.mimeType.includes("jpg") ? "jpg" : "png";
    const a = document.createElement("a");
    a.href = `data:${img.mimeType};base64,${img.data}`;
    a.download = `mandapcanvas-variation-${img.variationIndex}.${ext}`;
    a.click();
  }, []);

  return (
    <div className="min-h-full bg-[var(--mc-bg)]">
      <header className="border-b border-[var(--mc-border)] bg-[var(--mc-surface)]/80 backdrop-blur-md">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <h1 className="font-display text-[clamp(2.5rem,8vw,4.75rem)] font-semibold leading-[1.05] tracking-tight text-[var(--mc-ink)]">
            MandapCanvas
          </h1>
          <p className="mt-5 flex items-center gap-3 text-base text-[var(--mc-muted)] sm:text-lg">
            <Sparkles className="h-6 w-6 shrink-0 text-[var(--mc-accent-strong)] sm:h-7 sm:w-7" strokeWidth={1.85} aria-hidden />
            <span>Sketch → realistic wedding decor previews</span>
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:space-y-8 sm:px-6 sm:py-10 lg:px-8">
        {apiError ? (
          <div
            className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
            role="alert"
          >
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
            <span>{apiError}</span>
          </div>
        ) : null}

        <UploadPanel file={file} previewUrl={previewUrl} error={uploadError} onFile={validateFile} />

        <GenerationOptions settings={settings} onChange={setSettings} />

        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[var(--mc-muted)] sm:max-w-[min(100%,24rem)]">
            {!file ? "Upload a sketch to generate." : busy ? "Generating…" : "Ready to generate."}
          </p>
          <button
            type="button"
            disabled={!canGenerate}
            onClick={runGeneration}
            className="inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2.5 rounded-md border border-[var(--mc-accent)]/40 bg-[var(--mc-ink)] px-6 py-2.5 font-display text-sm font-semibold tracking-wide text-[var(--mc-accent)] shadow-md transition hover:border-[var(--mc-accent)]/70 hover:brightness-[1.08] disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:min-w-[12rem] sm:px-8"
          >
            <Sparkles className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2} aria-hidden />
            {busy ? "Generating…" : "Generate"}
          </button>
        </div>

        <ResultsGallery
          prompt={prompt}
          images={images}
          warnings={warnings}
          busy={busy}
          onRegenerate={runGeneration}
          onDownload={download}
        />
      </main>

      <footer className="border-t border-[var(--mc-border)] px-4 py-6 text-center text-xs text-[var(--mc-muted)] sm:px-6">
        MandapCanvas · sketches processed for preview only
      </footer>
    </div>
  );
}
