"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Download, Loader2, Sparkles } from "lucide-react";
import { engage as track } from "@/lib/engage";
import { FOUNDING_OFFER } from "@/lib/config";
import { flagField } from "@/lib/flagField";
import { FreeTrySignup } from "./FreeTrySignup";

type Quota = { signedIn: boolean; remaining: number };

/**
 * "See this palette on a mandap": one AI mandap painted in the colors found in the outfit photo.
 * Only the color codes are sent, never the photo.
 */
export function PaletteMandap({
  colors,
  metal,
  palette,
}: {
  colors: { hex: string; name: string }[];
  metal: "gold" | "silver";
  /** The recommended decor palette id, used for flower and fabric details and the album link. */
  palette: string;
}) {
  const [quota, setQuota] = useState<Quota | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ url: string; key: string } | null>(null);
  const [error, setError] = useState<{ msg: string; code?: string } | null>(null);
  const key = colors.map((c) => c.hex).join(",");

  useEffect(() => {
    fetch("/api/tools/palette-mandap")
      .then((r) => r.json())
      .then((d) => d.ok && setQuota({ signedIn: d.signedIn, remaining: d.remaining }))
      .catch(() => {});
  }, []);

  const outOfTries = quota !== null && quota.remaining <= 0;
  const stale = result && result.key !== key;

  async function paint() {
    setBusy(true);
    setError(null);
    track("tool_palette_mandap_create");
    try {
      const res = await fetch("/api/tools/palette-mandap", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ colors, metal, palette }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError({ msg: data.error, code: data.code });
        if (data.code === "signup_for_more" || data.code === "palettemandap_used") setQuota((q) => ({ signedIn: q?.signedIn ?? false, remaining: 0 }));
        flagField(data.code === "signup_for_more" ? "#palette-mandap-signup" : "#palette-mandap-error");
        return;
      }
      setResult({ url: data.url, key });
      setQuota({ signedIn: data.signedIn, remaining: data.remaining });
      track("tool_palette_mandap_done");
    } catch {
      setError({ msg: "Something went wrong. Please try again." });
      flagField("#palette-mandap-error");
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    if (!result) return;
    track("tool_palette_mandap_download");
    try {
      const blob = await (await fetch(result.url)).blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "my-colors-on-a-mandap.jpg";
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    } catch {
      window.open(result.url, "_blank");
    }
  }

  return (
    <div className="mt-6 overflow-hidden rounded-[22px] border border-gold/50 bg-[#fbf1ee]">
      <div className="relative aspect-[4/3] bg-silk">
        {result && !busy ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={result.url} alt="A mandap decorated in your outfit's colors" className={`h-full w-full object-cover ${stale ? "opacity-60" : ""}`} />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
            <span className="flex" aria-hidden="true">
              {colors.map((c) => (
                <span key={c.hex} className={`-ml-2 h-10 w-10 rounded-full ring-4 ring-[#fbf1ee] first:ml-0 ${busy ? "animate-pulse" : ""}`} style={{ background: c.hex }} />
              ))}
            </span>
            <p className="font-display text-xl text-maroon">{busy ? "Painting your mandap…" : "See these colors on a mandap"}</p>
            <p className="max-w-xs text-sm text-ink-soft">{busy ? "This takes about 20 seconds." : "AI paints a mandap in your outfit's exact colors. Only the color codes are sent, not your photo."}</p>
          </div>
        )}
        {busy ? <div className="sheen pointer-events-none absolute inset-0" aria-hidden="true" /> : null}
      </div>
      <div className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          {!result || stale ? (
            <button type="button" className="btn btn-primary btn-sm" onClick={paint} disabled={busy || outOfTries}>
              {busy ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />} {stale ? "Paint it in the new colors" : "Paint my mandap"}
            </button>
          ) : (
            <button type="button" className="btn btn-ghost btn-sm" onClick={save}>
              <Download size={16} /> Save
            </button>
          )}
          <span className="text-sm text-ink-soft">
            {quota === null
              ? "Free to try."
              : quota.remaining > 0
                ? `${quota.remaining} free ${quota.remaining === 1 ? "preview" : "previews"} left.`
                : quota.signedIn
                  ? "You've used your free previews."
                  : "Create a free account for one more."}
          </span>
        </div>
        {error && error.code !== "signup_for_more" ? (
          <p id="palette-mandap-error" role="alert" className="mt-3 rounded-xl bg-[#fbeaea] p-3 text-sm text-kumkum-deep">
            {error.msg}
          </p>
        ) : null}
        {outOfTries && quota && !quota.signedIn ? (
          <FreeTrySignup
            id="palette-mandap-signup"
            next="/tools/outfit-photo-color-palette"
            source="palettemandap"
            title="One more mandap, free"
            text={`Create a free account to paint another outfit's colors. You'll also get ${FOUNDING_OFFER.text}.`}
            cta="Get my free preview"
          />
        ) : null}
        {result || outOfTries ? (
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href={`/create?palette=${palette}`} className="btn btn-gold btn-sm" onClick={() => track("tool_palette_mandap_continue")}>
              Design my mandap in these colors <ArrowRight size={15} />
            </Link>
            <Link href="/looks" className="btn btn-ghost btn-sm" onClick={() => track("tool_palette_mandap_looks")}>
              See myself in this outfit
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
