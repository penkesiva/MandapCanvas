"use client";

import { useCallback, useState } from "react";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  ImageIcon,
  Loader2,
  RefreshCw,
} from "lucide-react";
import type { GeneratedImageResult } from "@/lib/types";

type Props = {
  prompt: string | null;
  images: GeneratedImageResult[];
  warnings?: string[];
  busy: boolean;
  onRegenerate: () => void;
  onDownload: (img: GeneratedImageResult) => void;
};

export function ResultsGallery({ prompt, images, warnings, busy, onRegenerate, onDownload }: Props) {
  const [promptOpen, setPromptOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyPrompt = useCallback(async () => {
    if (!prompt?.trim()) return;
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }, [prompt]);

  return (
    <section className="rounded-lg border border-[var(--mc-border)] bg-[var(--mc-surface)] p-4 shadow-sm sm:p-6">
      <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-end sm:justify-between sm:gap-2">
        <div className="flex items-start gap-2">
          <ImageIcon className="mt-0.5 h-6 w-6 shrink-0 text-[var(--mc-accent-strong)] sm:h-7 sm:w-7" strokeWidth={1.85} aria-hidden />
          <div>
            <h2 className="font-display text-lg font-semibold text-[var(--mc-ink)]">Previews</h2>
            <p className="text-xs text-[var(--mc-muted)]">Download or regenerate</p>
          </div>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={onRegenerate}
          className="inline-flex min-h-11 w-full touch-manipulation items-center justify-center gap-2 rounded-md border border-[var(--mc-border)] bg-[var(--mc-paper)] px-4 py-2 text-sm font-medium text-[var(--mc-ink)] transition-colors hover:bg-[var(--mc-accent-soft)] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:min-w-[9rem]"
        >
          <RefreshCw className={`h-5 w-5 ${busy ? "animate-spin" : ""}`} strokeWidth={1.85} aria-hidden />
          {busy ? "Working…" : "Regenerate"}
        </button>
      </div>

      {warnings?.length ? (
        <div className="mb-4 flex gap-2 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={1.85} aria-hidden />
          <div>
            <p className="font-medium">Notice</p>
            <ul className="mt-1 list-inside list-disc text-amber-800">
              {warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      {prompt ? (
        <div className="mb-6 rounded-md border border-[var(--mc-border)] bg-[var(--mc-paper)]">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--mc-border)] px-3 py-2.5 sm:px-4">
            <span className="text-xs font-semibold uppercase tracking-wide text-[var(--mc-muted)]">Prompt</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={copyPrompt}
                className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-[var(--mc-ink)] hover:bg-[var(--mc-accent-soft)]"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-700" strokeWidth={2} aria-hidden />
                ) : (
                  <Copy className="h-4 w-4" strokeWidth={1.85} aria-hidden />
                )}
                {copied ? "Copied" : "Copy"}
              </button>
              <button
                type="button"
                onClick={() => setPromptOpen((o) => !o)}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-[var(--mc-ink)] hover:bg-[var(--mc-accent-soft)]"
                aria-expanded={promptOpen}
              >
                {promptOpen ? (
                  <>
                    <ChevronUp className="h-4 w-4" strokeWidth={2} aria-hidden />
                    Hide
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" strokeWidth={2} aria-hidden />
                    Show
                  </>
                )}
              </button>
            </div>
          </div>
          {promptOpen ? (
            <p className="max-h-[min(50vh,24rem)] overflow-y-auto whitespace-pre-wrap px-3 py-3 font-mono text-xs leading-relaxed text-[var(--mc-ink)] sm:px-4">
              {prompt}
            </p>
          ) : (
            <p className="px-3 py-2.5 text-xs text-[var(--mc-muted)] sm:px-4">Collapsed — use Show to read the full prompt.</p>
          )}
        </div>
      ) : null}

      {images.length === 0 && !busy ? (
        <div className="flex min-h-[120px] flex-col items-center justify-center rounded-md border border-dashed border-[var(--mc-border)] bg-[var(--mc-paper)] px-4 py-8 text-center sm:min-h-[140px]">
          <ImageIcon className="mb-2 h-10 w-10 text-[var(--mc-muted)] sm:h-12 sm:w-12" strokeWidth={1.35} aria-hidden />
          <p className="font-display text-sm font-medium text-[var(--mc-ink)]">No previews yet</p>
          <p className="mt-1 max-w-xs text-xs text-[var(--mc-muted)]">Upload a sketch, then generate.</p>
        </div>
      ) : null}

      {busy ? (
        <div className="flex min-h-[160px] flex-col items-center justify-center gap-3 rounded-md bg-[var(--mc-paper)] sm:min-h-[180px]">
          <Loader2 className="h-12 w-12 animate-spin text-[var(--mc-accent-strong)] sm:h-14 sm:w-14" strokeWidth={1.5} aria-hidden />
          <p className="text-sm text-[var(--mc-muted)]">Rendering…</p>
        </div>
      ) : null}

      {!busy && images.length > 0 ? (
        <ul className="grid gap-4 sm:gap-6 lg:grid-cols-2">
          {images.map((img) => (
            <li
              key={`${img.variationIndex}-${img.data.slice(0, 12)}`}
              className="overflow-hidden rounded-md border border-[var(--mc-border)] bg-[var(--mc-paper)] shadow-md"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`data:${img.mimeType};base64,${img.data}`}
                alt={`Generated variation ${img.variationIndex}`}
                className="aspect-[4/3] w-full object-cover"
              />
              <div className="flex items-center justify-between gap-3 border-t border-[var(--mc-border)] px-3 py-3 sm:px-4">
                <span className="text-xs font-medium text-[var(--mc-muted)]">#{img.variationIndex}</span>
                <button
                  type="button"
                  onClick={() => onDownload(img)}
                  className="inline-flex min-h-9 min-w-[5.5rem] touch-manipulation items-center justify-center gap-1.5 rounded-md bg-[var(--mc-ink)] px-3 py-2 text-xs font-semibold text-[var(--mc-paper)] hover:opacity-90 sm:min-h-0 sm:py-1.5"
                >
                  <Download className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2} aria-hidden />
                  Save
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
