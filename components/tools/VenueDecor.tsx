"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Download, ImageUp, Loader2, RefreshCw, Share2, Sparkles } from "lucide-react";
import { engage as track } from "@/lib/engage";
import { FOUNDING_OFFER } from "@/lib/config";
import { VENUE_EVENTS, VENUE_PALETTES, VENUE_STYLES } from "@/lib/venueDecor";
import type { EventId } from "@/lib/types";
import { BeforeAfter } from "../BeforeAfter";
import { FreeTrySignup } from "./FreeTrySignup";
import { flagField } from "@/lib/flagField";

const WAITING = ["Measuring the space…", "Placing the mandap…", "Hanging the flowers…", "Draping the fabric…", "Lighting the room…"];

type Quota = { signedIn: boolean; remaining: number };
type Result = { url: string; refUrl: string; aspect: string };

export function VenueDecor() {
  const [event, setEvent] = useState<EventId>("ceremony");
  const [style, setStyle] = useState("royal");
  const [palette, setPalette] = useState("");

  const [photo, setPhoto] = useState<string | null>(null);
  const [photoAspect, setPhotoAspect] = useState("4 / 3");
  const [uploading, setUploading] = useState(false);
  const [quota, setQuota] = useState<Quota | null>(null);
  const [busy, setBusy] = useState(false);
  const [tick, setTick] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<{ msg: string; code?: string; field?: "photo" } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/tools/venue-decor")
      .then((r) => r.json())
      .then((d) => d.ok && setQuota({ signedIn: d.signedIn, remaining: d.remaining }))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!busy) return;
    const t = setInterval(() => setTick((n) => n + 1), 3200);
    return () => clearInterval(t);
  }, [busy]);

  const outOfTries = quota !== null && quota.remaining <= 0;
  const ev = VENUE_EVENTS.find((e) => e.id === event)!;

  async function upload(file: File) {
    setError(null);
    setUploading(true);
    try {
      const form = new FormData();
      form.set("kind", "venue");
      form.set("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed.");
      setPhoto(data.url);
      setResult(null);
      const img = new Image();
      img.onload = () => img.naturalWidth && setPhotoAspect(`${img.naturalWidth} / ${img.naturalHeight}`);
      img.src = data.url;
      track("tool_venue_upload");
    } catch (e) {
      setError({ msg: e instanceof Error ? e.message : "Upload failed. Try another photo.", field: "photo" });
      flagField('[data-field="photo"]');
    } finally {
      setUploading(false);
    }
  }

  async function create() {
    if (!photo) {
      setError({ msg: "Add a photo of your venue first.", field: "photo" });
      return flagField('[data-field="photo"]');
    }
    setError(null);
    setBusy(true);
    setTick(0);
    track("tool_venue_create", { event, style });
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 50);
    try {
      const res = await fetch("/api/tools/venue-decor", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ event, style, palette, photoUrl: photo }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError({ msg: data.error, code: data.code });
        flagField(data.code === "signup_for_more" ? "#venue-signup" : "#venue-error");
        if (data.code === "signup_for_more" || data.code === "venue_used") setQuota((q) => ({ signedIn: q?.signedIn ?? false, remaining: 0 }));
        return;
      }
      setResult({ url: data.url, refUrl: data.refUrl, aspect: data.aspect.replace(":", " / ") });
      setQuota({ signedIn: data.signedIn, remaining: data.remaining });
      track("tool_venue_done", { event, style });
    } catch {
      setError({ msg: "Something went wrong. Please try again." });
      flagField("#venue-error");
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    if (!result) return;
    track("tool_venue_download");
    try {
      const blob = await (await fetch(result.url)).blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `mandapcanvas-venue-${event}.jpg`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    } catch {
      window.open(result.url, "_blank");
    }
  }

  async function share() {
    if (!result) return;
    track("tool_venue_share");
    try {
      const blob = await (await fetch(result.url)).blob();
      const file = new File([blob], `our-venue-${event}.jpg`, { type: "image/jpeg" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "Our venue, decorated", text: "Made with MandapCanvas" });
      } else {
        await navigator.share({ title: "See your venue decorated", url: window.location.href });
      }
    } catch {
      /* cancelled or unsupported */
    }
  }

  const continueHref = result
    ? `/create?ref=${encodeURIComponent(result.refUrl)}&event=${event}${palette ? `&palette=${palette}` : ""}`
    : "/create";

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      {/* controls */}
      <div className="min-w-0 rounded-[26px] border border-gold/40 bg-white p-4 shadow-[0_30px_60px_-44px_rgba(74,13,26,0.6)] sm:p-7">
        <Step n={1} title="Add a photo of your venue">
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
            className="sr-only"
            onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
          />
          <div className="flex flex-col gap-4 p-1 sm:flex-row sm:items-center" data-field="photo">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="relative flex h-28 w-40 flex-none items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-gold/70 bg-silk text-kumkum hover:border-kumkum"
              aria-label={photo ? "Change photo" : "Upload photo"}
            >
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo} alt="Your venue" className="h-full w-full object-cover" />
              ) : uploading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <ImageUp size={30} />
              )}
              {photo && uploading ? (
                <span className="absolute inset-0 flex items-center justify-center bg-white/70">
                  <Loader2 className="animate-spin" />
                </span>
              ) : null}
            </button>
            <div className="text-sm text-ink-soft">
              <button type="button" className="btn btn-ghost btn-sm mb-2" onClick={() => fileRef.current?.click()}>
                {photo ? "Change photo" : "Choose a photo"}
              </button>
              <ul className="space-y-0.5">
                <li>✓ A hall, backyard, lawn or temple</li>
                <li>✓ Wide shot from the back, in daylight</li>
                <li>✓ Empty is best; a venue&apos;s own photo works</li>
              </ul>
            </div>
          </div>
          {error?.field === "photo" ? (
            <p role="alert" className="mt-2 text-sm font-semibold text-kumkum-deep">
              {error.msg}
            </p>
          ) : null}
        </Step>

        <Step n={2} title="Which event?">
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Event">
            {VENUE_EVENTS.map((e) => (
              <button key={e.id} type="button" role="radio" aria-checked={event === e.id} className="chip" onClick={() => setEvent(e.id)}>
                {e.name}
              </button>
            ))}
          </div>
        </Step>

        <Step n={3} title="Pick a style">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Style">
            {VENUE_STYLES.map((s) => (
              <button
                key={s.id}
                type="button"
                role="radio"
                aria-checked={style === s.id}
                onClick={() => setStyle(s.id)}
                className={`relative overflow-hidden rounded-2xl border-2 text-left transition ${
                  style === s.id ? "border-kumkum" : "border-line hover:border-gold"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.image} alt="" className="aspect-[4/3] w-full object-cover" loading="lazy" />
                <span className={`block px-2.5 py-2 ${style === s.id ? "bg-[#fbf1ee]" : "bg-white"}`}>
                  <span className="block text-sm font-semibold leading-tight">{s.name}</span>
                  <span className="block text-xs leading-tight text-ink-soft">{s.hint}</span>
                </span>
                {style === s.id ? (
                  <span className="pop-in absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-kumkum text-white">
                    <Check size={14} strokeWidth={3} />
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </Step>

        <Step n={4} title="Colors (optional)">
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Colors">
            <button type="button" role="radio" aria-checked={palette === ""} className="chip" onClick={() => setPalette("")}>
              The style&apos;s own
            </button>
            {VENUE_PALETTES.map((p) => (
              <button
                key={p.id}
                type="button"
                role="radio"
                aria-checked={palette === p.id}
                onClick={() => setPalette(p.id)}
                title={p.name}
                className={`flex items-center gap-1.5 rounded-full border-2 py-1 pl-1 pr-2.5 text-sm ${palette === p.id ? "border-kumkum bg-[#fbf1ee] text-maroon" : "border-line"}`}
              >
                <span className="flex" aria-hidden="true">
                  {p.swatches.map((h, i) => (
                    <span key={i} className="-ml-1 h-5 w-5 rounded-full ring-2 ring-white first:ml-0" style={{ background: h }} />
                  ))}
                </span>
                {p.name}
              </button>
            ))}
          </div>
        </Step>

        <div className="mt-5 flex flex-col items-start gap-2">
          <button type="button" className="btn btn-primary w-full sm:w-auto" onClick={create} disabled={busy || uploading || outOfTries}>
            {busy ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />} {busy ? "Decorating…" : "Decorate my venue"}
          </button>
          <p className="text-sm text-ink-soft">
            {quota === null
              ? "Free, no sign-up for your first try."
              : quota.remaining > 0
                ? `${quota.remaining} free ${quota.remaining === 1 ? "try" : "tries"} left${quota.signedIn ? "" : ". No sign-up needed"}.`
                : quota.signedIn
                  ? "You've used your free tries."
                  : "You've used your free try. Create a free account for one more."}
          </p>
        </div>
      </div>

      {/* result */}
      <div ref={resultRef} className="min-w-0 lg:sticky lg:top-24 lg:self-start">
        <div className="frame-gold overflow-hidden rounded-[26px] bg-white p-2">
          {result && photo && !busy ? (
            <BeforeAfter
              before={photo}
              after={result.url}
              beforeAlt="Your venue as it is"
              afterAlt={`Your venue decorated for the ${ev.name.toLowerCase()}`}
              beforeLabel="Your venue"
              afterLabel="Decorated"
              aspect={result.aspect}
            />
          ) : (
            <div className="relative overflow-hidden rounded-[20px] bg-silk" style={{ aspectRatio: photo ? photoAspect : "4 / 3" }}>
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo} alt="" className={`absolute inset-0 h-full w-full object-cover ${busy ? "opacity-60" : "opacity-35"}`} />
              ) : null}
              <div className="relative flex h-full flex-col items-center justify-center p-6 text-center">
                <p className="font-display text-xl text-maroon">{busy ? WAITING[tick % WAITING.length] : photo ? "Ready to decorate" : "Your decorated venue appears here"}</p>
                <p className="mt-1 max-w-xs text-sm text-ink-soft">
                  {busy ? "This takes about 20 seconds." : "Same room, same walls. Drag the slider to compare before and after."}
                </p>
              </div>
              {busy ? <div className="sheen pointer-events-none absolute inset-0" aria-hidden="true" /> : null}
            </div>
          )}
          {result && !busy ? (
            <div className="flex flex-wrap gap-2 p-2 pt-3">
              <button type="button" className="btn btn-ghost btn-sm" onClick={save}>
                <Download size={16} /> Save
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={share}>
                <Share2 size={16} /> Share
              </button>
              {quota && quota.remaining > 0 ? (
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
                  <RefreshCw size={16} /> Try another style
                </button>
              ) : null}
            </div>
          ) : null}
        </div>

        {error && !error.field && error.code !== "signup_for_more" ? (
          <p id="venue-error" role="alert" className="mt-3 rounded-2xl bg-[#fbeaea] p-4 text-sm text-kumkum-deep">
            {error.msg}
          </p>
        ) : null}

        {result && !busy ? (
          <div className="mt-4 rounded-[22px] bg-maroon p-5 text-white">
            <p className="font-display text-xl text-gold-light">Design every event in this venue</p>
            <p className="mt-1 text-sm text-white/85">
              A full album of your mandap, stage, entrance and details, from this look, for each event you pick.
            </p>
            <Link href={continueHref} className="btn btn-gold mt-3" onClick={() => track("tool_venue_continue", { event })}>
              Design my events <ArrowRight size={16} />
            </Link>
          </div>
        ) : outOfTries && quota?.signedIn ? (
          <div className="mt-4 rounded-[22px] bg-maroon p-5 text-white">
            <p className="font-display text-xl text-gold-light">See every event, decorated</p>
            <p className="mt-1 text-sm text-white/85">Design the mandap, stage and details for each of your events.</p>
            <Link href="/create" className="btn btn-gold mt-3">
              Design my events <ArrowRight size={16} />
            </Link>
          </div>
        ) : null}
        {outOfTries && quota && !quota.signedIn ? (
          <FreeTrySignup
            id="venue-signup"
            next="/tools/ai-venue-decor-visualizer"
            source="venue"
            title="One more try, free"
            text={`Create a free account to try another style or event. You'll also get ${FOUNDING_OFFER.text}.`}
            cta="Get my free try"
          />
        ) : null}
      </div>
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-line py-5 first:pt-0 last:border-0">
      <h2 className="mb-3 flex items-center gap-2.5 text-xl">
        <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-maroon font-sans text-sm font-semibold text-gold-light">{n}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}
