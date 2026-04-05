"use client";

import type { LucideIcon } from "lucide-react";
import { Armchair, Building2, Palette, SlidersHorizontal, Users } from "lucide-react";
import type { AudienceMode, ColorMode, CoupleMode, GenerationSettings, VenueMode } from "@/lib/types";
import { PalettePicker } from "./PalettePicker";

type Props = {
  settings: GenerationSettings;
  onChange: (next: GenerationSettings) => void;
};

function Segmented<T extends string>({
  label,
  helper,
  icon: Icon,
  value,
  options,
  onChange,
}: {
  label: string;
  helper?: string;
  icon: LucideIcon;
  value: T;
  options: { id: T; title: string; hint: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-start gap-2">
        <Icon className="mt-0.5 h-5 w-5 shrink-0 text-[var(--mc-accent-strong)] sm:h-6 sm:w-6" strokeWidth={1.85} aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="font-display text-sm font-semibold text-[var(--mc-ink)]">{label}</p>
          {helper ? <p className="text-xs text-[var(--mc-muted)]">{helper}</p> : null}
        </div>
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
      <div className="mb-5 flex items-center gap-2 sm:mb-6">
        <SlidersHorizontal className="h-6 w-6 shrink-0 text-[var(--mc-accent-strong)] sm:h-7 sm:w-7" strokeWidth={1.85} aria-hidden />
        <div>
          <h2 className="font-display text-lg font-semibold text-[var(--mc-ink)]">Scene</h2>
          <p className="text-xs text-[var(--mc-muted)]">Layout follows your sketch</p>
        </div>
      </div>

      <div className="space-y-6 sm:space-y-8">
        <Segmented<CoupleMode>
          icon={Users}
          label="Couple"
          value={settings.coupleMode}
          onChange={(coupleMode) => patch({ coupleMode })}
          options={[
            { id: "none", title: "None", hint: "Decor only" },
            { id: "bride_only", title: "Bride", hint: "Solo" },
            { id: "groom_only", title: "Groom", hint: "Solo" },
            { id: "bride_and_groom", title: "Both", hint: "Couple" },
          ]}
        />

        <Segmented<AudienceMode>
          icon={Armchair}
          label="Audience"
          value={settings.audienceMode}
          onChange={(audienceMode) => patch({ audienceMode })}
          options={[
            { id: "no_audience", title: "No audience", hint: "Stage focus" },
            { id: "audience", title: "Audience", hint: "Seating in frame" },
          ]}
        />

        <Segmented<VenueMode>
          icon={Building2}
          label="Venue"
          value={settings.venueMode}
          onChange={(venueMode) => patch({ venueMode })}
          options={[
            { id: "indoor", title: "Indoor", hint: "Hall / ballroom" },
            { id: "outdoor", title: "Outdoor", hint: "Garden / tent" },
          ]}
        />

        <Segmented<ColorMode>
          icon={Palette}
          label="Color"
          value={settings.colorMode}
          onChange={(colorMode) => {
            if (colorMode === "suggested_palette") {
              patch({ colorMode, paletteId: settings.paletteId ?? "blush-ivory-sage" });
            } else {
              patch({ colorMode, paletteId: null });
            }
          }}
          options={[
            { id: "preserve_sketch", title: "Keep sketch colors", hint: "Match your drawing" },
            { id: "suggested_palette", title: "U.S. floral palette", hint: "Pick below" },
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
            Notes <span className="font-normal text-[var(--mc-muted)]">(optional)</span>
          </label>
          <textarea
            value={settings.customNotes}
            onChange={(e) => patch({ customNotes: e.target.value })}
            placeholder="Lighting, style tweaks…"
            rows={2}
            className="w-full resize-y rounded-md border border-[var(--mc-border)] bg-[var(--mc-paper)] px-3 py-2.5 text-base text-[var(--mc-ink)] placeholder:text-[var(--mc-muted)] focus:border-[var(--mc-accent-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--mc-accent)]/25 sm:text-sm"
          />
        </div>

        <div>
          <label className="mb-2 block font-display text-sm font-semibold text-[var(--mc-ink)]">Variations</label>
          <p className="mb-2 text-xs text-[var(--mc-muted)]">1–4 images per run</p>
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
