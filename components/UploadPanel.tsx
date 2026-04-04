"use client";

import { useCallback, useRef, useState } from "react";

const ACCEPT = "image/jpeg,image/jpg,image/png,image/webp";

type Props = {
  file: File | null;
  previewUrl: string | null;
  error: string | null;
  onFile: (file: File | null) => void;
};

export function UploadPanel({ file, previewUrl, error, onFile }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const pick = useCallback(() => inputRef.current?.click(), []);

  const handleFiles = useCallback(
    (list: FileList | null) => {
      const f = list?.[0];
      if (!f) return;
      onFile(f);
    },
    [onFile],
  );

  return (
    <section className="rounded-lg border border-[var(--mc-border)] bg-[var(--mc-surface)] p-4 shadow-sm sm:p-6">
      <div className="mb-3 flex flex-col gap-1 sm:mb-4">
        <h2 className="font-display text-lg font-semibold text-[var(--mc-ink)]">1. Upload your sketch</h2>
        <p className="text-sm text-[var(--mc-muted)]">
          JPG, PNG, or WEBP — your drawing stays visible as you adjust options below.
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            pick();
          }
        }}
        onClick={pick}
        onDragEnter={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragOver(false);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={[
          "flex min-h-[min(220px,50svh)] cursor-pointer touch-manipulation flex-col items-center justify-center rounded-md border-2 border-dashed px-3 py-6 text-center transition-colors sm:min-h-[200px] sm:px-4 sm:py-8",
          dragOver ? "border-[var(--mc-accent)] bg-[var(--mc-accent-soft)]" : "border-[var(--mc-border)] bg-[var(--mc-paper)]",
        ].join(" ")}
      >
        {previewUrl ? (
          <div className="flex w-full max-w-md flex-col items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Sketch preview"
              className="max-h-48 w-auto max-w-full rounded-md object-contain shadow-md sm:max-h-56"
            />
            <p className="text-sm text-[var(--mc-muted)]">{file?.name}</p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onFile(null);
              }}
              className="text-sm font-medium text-[var(--mc-accent-strong)] underline-offset-4 hover:underline"
            >
              Remove and choose another
            </button>
          </div>
        ) : (
          <>
            <span className="font-display text-base font-medium text-[var(--mc-ink)]">
              Drop your sketch here or click to browse
            </span>
            <span className="mt-2 text-sm text-[var(--mc-muted)]">Up to 12 MB</span>
          </>
        )}
      </div>

      {error ? (
        <p className="mt-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
