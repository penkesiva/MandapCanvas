"use client";

import type { AudienceMode, ColorMode, CoupleMode, GenerationSettings, VenueMode } from "@/lib/types";
import { PalettePicker } from "./PalettePicker";

type Props = {
  settings: GenerationSettings;
  onChange: (next: GenerationSettings) => void;
};

function Segmented<T extends string>({
  label,
  helper,
  value,
  options,
  onChange,
}: {
  label: string;
  helper: string;
  value: T;
  options: { id: T; title: string; hint: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <div className="mb-2">
        <p className="font-display text-sm font-semibold text-[var(--mc-ink)]">{label}</p>
        <p className="text-xs text-[var(--mc-muted)]">{helper}</p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            className={[
              "min-h-11 w-full touch-manipulation rounded-md border px-3 py-2.5 text-left text-sm transition-colors sm:min-h-0 sm:w-auto sm:max-w-full sm:py-2",
              value === o.id
                ? "border-[var(--mc-accent-strong)] bg-[var(--mc-accent-soft)] text-[var(--mc-ink)]"
                : "border-[var(--mc-border)] bg-[var(--mc-paper)] text-[var(--mc-muted)] hover:border-[var(--mc-accent)]",
            ].join(" ")}
          >
            <span className="font-medium text-[var(--mc-ink)]">{o.title}</span>
            <span className="mt-0.5 block text-xs text-[var(--mc-muted)]">{o.hint}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function GenerationOptions({ settings, onChange }: Props) {
  const patch = (partial: Partial<GenerationSettings>) => onChange({ ...settings, ...partial });

  return (
    <section className="rounded-lg border border-[var(--mc-border)] bg-[var(--mc-surface)] p-4 shadow-sm sm:p-6">
      <div className="mb-5 flex flex-col gap-1 sm:mb-6">
        <h2 className="font-display text-lg font-semibold text-[var(--mc-ink)]">2. Scene options</h2>
        <p className="text-sm text-[var(--mc-muted)]">
          We promise to treat your sketch as the layout blueprint — symmetry, focal structure, and flow stay intact.
        </p>
      </div>

      <div className="space-y-6 sm:space-y-8">
        <Segmented<CoupleMode>
          label="Couple in the scene"
          helper="Who appears in front of the decor (if anyone)."
          value={settings.coupleMode}
          onChange={(coupleMode) => patch({ coupleMode })}
          options={[
            { id: "none", title: "None", hint: "Backdrop and venue only." },
            { id: "bride_only", title: "Bride only", hint: "Single subject, modern Indian attire." },
            { id: "groom_only", title: "Groom only", hint: "Single subject, modern Indian attire." },
            { id: "bride_and_groom", title: "Bride & groom", hint: "Couple, positioned to show the mandap." },
          ]}
        />

        <Segmented<AudienceMode>
          label="Audience"
          helper="Whether guest seating appears in the frame."
          value={settings.audienceMode}
          onChange={(audienceMode) => patch({ audienceMode })}
          options={[
            { id: "no_audience", title: "No audience", hint: "Clean, stage-focused shot." },
            { id: "audience", title: "Audience included", hint: "Subtle rows in the background." },
          ]}
        />

        <Segmented<VenueMode>
          label="Venue"
          helper="Indoor ballroom vs outdoor garden or tent feel."
          value={settings.venueMode}
          onChange={(venueMode) => patch({ venueMode })}
          options={[
            { id: "indoor", title: "Indoor", hint: "Ballroom or hall lighting." },
            { id: "outdoor", title: "Outdoor", hint: "Garden, lawn, or tent." },
          ]}
        />

        <Segmented<ColorMode>
          label="Color approach"
          helper="Keep your sketch hues or lean on realistic U.S.-sourced floral combos."
          value={settings.colorMode}
          onChange={(colorMode) => {
            if (colorMode === "suggested_palette") {
              patch({ colorMode, paletteId: settings.paletteId ?? "blush-ivory-sage" });
            } else {
              patch({ colorMode, paletteId: null });
            }
          }}
          options={[
            {
              id: "preserve_sketch",
              title: "Preserve sketch colors",
              hint: "Honor the hues and accents from your drawing.",
            },
            {
              id: "suggested_palette",
              title: "Suggest U.S. floral palette",
              hint: "Pick a practical combo below.",
            },
          ]}
        />

        {settings.colorMode === "suggested_palette" ? (
          <PalettePicker
            selectedId={settings.paletteId}
            onSelect={(paletteId) => patch({ paletteId })}
          />
        ) : null}

        <div>
          <label className="mb-2 block font-display text-sm font-semibold text-[var(--mc-ink)]">
            Extra styling notes <span className="font-normal text-[var(--mc-muted)]">(optional)</span>
          </label>
          <textarea
            value={settings.customNotes}
            onChange={(e) => patch({ customNotes: e.target.value })}
            placeholder="e.g. softer lighting, more greenery on the sides, minimalist mandap…"
            rows={3}
            className="w-full resize-y rounded-md border border-[var(--mc-border)] bg-[var(--mc-paper)] px-3 py-2.5 text-base text-[var(--mc-ink)] placeholder:text-[var(--mc-muted)] focus:border-[var(--mc-accent-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--mc-accent)]/25 sm:text-sm"
          />
        </div>

        <div>
          <label className="mb-2 block font-display text-sm font-semibold text-[var(--mc-ink)]">
            Number of variations
          </label>
          <p className="mb-2 text-xs text-[var(--mc-muted)]">Generate 1–4 previews per run to compare options.</p>
          <div className="grid grid-cols-4 gap-2 sm:flex sm:flex-wrap">
            {[1, 2, 3, 4].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => patch({ variationCount: n })}
                className={[
                  "min-h-11 min-w-0 touch-manipulation rounded-md border px-2 py-2.5 text-sm font-medium sm:min-h-0 sm:min-w-[2.5rem] sm:px-3 sm:py-2",
                  settings.variationCount === n
                    ? "border-[var(--mc-accent-strong)] bg-[var(--mc-accent-soft)] text-[var(--mc-ink)]"
                    : "border-[var(--mc-border)] bg-[var(--mc-paper)] text-[var(--mc-muted)] hover:border-[var(--mc-accent)]",
                ].join(" ")}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
