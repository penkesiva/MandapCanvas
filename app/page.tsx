"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
      setUploadError("Please use JPG, PNG, or WEBP.");
      setFile(null);
      return;
    }
    if (f.size > 12 * 1024 * 1024) {
      setUploadError("File is too large (max 12 MB).");
      setFile(null);
      return;
    }
    setFile(f);
  }, []);

  const runGeneration = useCallback(async () => {
    if (!file) {
      setApiError("Upload a sketch first.");
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
      setApiError("Network error. Check your connection and try again.");
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
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-8 sm:gap-4 sm:px-6 sm:py-12 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--mc-accent-strong)]">
            MandapCanvas
          </p>
          <h1 className="font-display text-[1.75rem] font-semibold leading-tight tracking-tight text-[var(--mc-ink)] sm:text-4xl md:text-5xl">
            Wedding sketches into realistic decor previews
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-[var(--mc-muted)] sm:text-lg">
            Upload a hand-drawn mandap or backdrop idea. We keep your composition, symmetry, and flow — then render it as
            polished, U.S.-style Indian wedding photography you can share with family or vendors.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:space-y-8 sm:px-6 sm:py-10 lg:px-8">
        {apiError ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900" role="alert">
            {apiError}
          </div>
        ) : null}

        <UploadPanel file={file} previewUrl={previewUrl} error={uploadError} onFile={validateFile} />

        <GenerationOptions settings={settings} onChange={setSettings} />

        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-snug text-[var(--mc-muted)] sm:max-w-[min(100%,28rem)]">
            {!file
              ? "Add a sketch to enable generation."
              : busy
                ? "Rendering previews — your sketch stays the layout blueprint."
                : "Ready when you are — your sketch is the blueprint."}
          </p>
          <button
            type="button"
            disabled={!canGenerate}
            onClick={runGeneration}
            className="min-h-11 w-full shrink-0 rounded-md bg-[var(--mc-ink)] px-6 py-2.5 font-display text-sm font-semibold tracking-wide text-[var(--mc-paper)] shadow-md transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:min-w-[12rem] sm:px-8"
          >
            {busy ? "Generating…" : "Generate previews"}
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

      <footer className="border-t border-[var(--mc-border)] px-4 py-8 text-center text-xs leading-relaxed text-[var(--mc-muted)] sm:px-6">
        MandapCanvas — modern Indian wedding decor visualization for the U.S. No accounts; images are processed for generation
        only.
      </footer>
    </div>
  );
}
