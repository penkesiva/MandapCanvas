"use client";

import type { GeneratedImageResult } from "@/lib/types";

type Props = {
  prompt: string | null;
  images: GeneratedImageResult[];
  warnings?: string[];
  busy: boolean;
  onRegenerate: () => void;
  onDownload: (img: GeneratedImageResult) => void;
};

function summarySnippet(prompt: string, max = 220) {
  const t = prompt.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

export function ResultsGallery({ prompt, images, warnings, busy, onRegenerate, onDownload }: Props) {
  return (
    <section className="rounded-lg border border-[var(--mc-border)] bg-[var(--mc-surface)] p-4 shadow-sm sm:p-6">
      <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-end sm:justify-between sm:gap-2">
        <div>
          <h2 className="font-display text-lg font-semibold text-[var(--mc-ink)]">3. Results</h2>
          <p className="text-sm text-[var(--mc-muted)]">Realistic previews — download or regenerate with the same sketch.</p>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={onRegenerate}
          className="min-h-11 w-full touch-manipulation rounded-md border border-[var(--mc-border)] bg-[var(--mc-paper)] px-4 py-2 text-sm font-medium text-[var(--mc-ink)] transition-colors hover:bg-[var(--mc-accent-soft)] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:min-w-[9rem]"
        >
          {busy ? "Generating…" : "Regenerate"}
        </button>
      </div>

      {warnings?.length ? (
        <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-medium">Partial notice</p>
          <ul className="mt-1 list-inside list-disc text-amber-800">
            {warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {prompt ? (
        <div className="mb-6 rounded-md border border-[var(--mc-border)] bg-[var(--mc-paper)] px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mc-muted)]">Prompt summary</p>
          <p className="mt-2 whitespace-pre-wrap font-mono text-xs leading-relaxed text-[var(--mc-ink)]">
            {summarySnippet(prompt)}
          </p>
        </div>
      ) : null}

      {images.length === 0 && !busy ? (
        <div className="flex min-h-[140px] flex-col items-center justify-center rounded-md border border-dashed border-[var(--mc-border)] bg-[var(--mc-paper)] px-4 py-10 text-center sm:min-h-[160px] sm:px-6 sm:py-12">
          <p className="font-display text-base text-[var(--mc-ink)]">No previews yet</p>
          <p className="mt-2 max-w-md text-sm text-[var(--mc-muted)]">
            Upload a sketch, choose your scene options, then generate. Your drawing stays the blueprint for layout and decor
            structure.
          </p>
        </div>
      ) : null}

      {busy ? (
        <div className="flex min-h-[180px] flex-col items-center justify-center gap-4 rounded-md bg-[var(--mc-paper)] sm:min-h-[200px]">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--mc-accent)] border-t-transparent" aria-hidden />
          <p className="text-sm text-[var(--mc-muted)]">Rendering realistic wedding photography from your sketch…</p>
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
                <span className="text-xs font-medium text-[var(--mc-muted)]">Variation {img.variationIndex}</span>
                <button
                  type="button"
                  onClick={() => onDownload(img)}
                  className="min-h-9 min-w-[5.5rem] touch-manipulation rounded-md bg-[var(--mc-ink)] px-3 py-2 text-xs font-semibold text-[var(--mc-paper)] hover:opacity-90 sm:min-h-0 sm:py-1.5"
                >
                  Download
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
