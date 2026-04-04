"use client";

import { FLORAL_PALETTES, PALETTE_DISCLAIMER } from "@/lib/palettes";

type Props = {
  selectedId: string | null;
  onSelect: (id: string) => void;
};

export function PalettePicker({ selectedId, onSelect }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-display text-base font-semibold text-[var(--mc-ink)]">U.S.-practical floral palettes</h3>
        <p className="mt-1 text-sm text-[var(--mc-muted)]">{PALETTE_DISCLAIMER}</p>
      </div>
      <ul className="grid gap-2 sm:grid-cols-2 sm:gap-3">
        {FLORAL_PALETTES.map((p) => {
          const active = selectedId === p.id;
          return (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => onSelect(p.id)}
                className={[
                  "w-full touch-manipulation rounded-md border px-3 py-3 text-left transition-all sm:px-4",
                  active
                    ? "border-[var(--mc-accent-strong)] bg-[var(--mc-accent-soft)] ring-1 ring-[var(--mc-accent)]/40"
                    : "border-[var(--mc-border)] bg-[var(--mc-paper)] active:bg-[var(--mc-accent-soft)] sm:hover:border-[var(--mc-accent)]",
                ].join(" ")}
              >
                <span className="font-display font-semibold text-[var(--mc-ink)]">{p.name}</span>
                <p className="mt-1 text-xs text-[var(--mc-muted)]">{p.description}</p>
                <p className="mt-2 text-xs text-[var(--mc-ink)]">
                  <span className="text-[var(--mc-muted)]">Likely blooms: </span>
                  {p.flowers.join(" · ")}
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {p.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded bg-[var(--mc-chip)] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[var(--mc-muted)]"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
