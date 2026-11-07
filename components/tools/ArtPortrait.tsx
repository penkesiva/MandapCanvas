"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, Download, ImageUp, Loader2, Paintbrush, RefreshCw, Share2, Sparkles } from "lucide-react";
import { engage as track } from "@/lib/engage";
import { PACKS, formatUSD, offerLine } from "@/lib/config";
import { ART_STYLES, getArtStyle, type ArtGlasses, type ArtOutfit, type ArtStyleId } from "@/lib/artStyles";
import { BeforeAfter } from "../BeforeAfter";
import { FreeTrySignup } from "./FreeTrySignup";
import { flagField } from "@/lib/flagField";

const WAITING = ["Mixing the paints…", "Sketching the outline…", "Laying down color…", "Painting the details…", "Adding the final strokes…"];

const BUNDLED: Record<string, string> = Object.fromEntries(ART_STYLES.map((x) => [x.id, `/samples/art/${x.id}.jpg`]));

type Quota = { signedIn: boolean; remaining: number; admin?: boolean };
type Made = { style: ArtStyleId; url: string; aspect: string };

export function ArtPortrait() {
  const [style, setStyle] = useState<ArtStyleId>("anime");
  const [outfit, setOutfit] = useState<ArtOutfit>("wedding");
  // Follows the style (off for Mughal, Madhubani, Tanjore, classic oil) until they choose for themselves.
  const [glassesChoice, setGlassesChoice] = useState<ArtGlasses | null>(null);
  const [consent, setConsent] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [quota, setQuota] = useState<Quota | null>(null);
  // The example portraits that ship with the site (one AI model, every style); painted ones only fill gaps.
  const [samples, setSamples] = useState<Record<string, string>>(BUNDLED);
  const [seeding, setSeeding] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [tick, setTick] = useState(0);
  const [made, setMade] = useState<Made[]>([]);
  const [showing, setShowing] = useState<number>(-1);
  const [error, setError] = useState<{ msg: string; code?: string; field?: "photo" | "consent" } | null>(null);
  const [ordering, setOrdering] = useState(false);
  const [packError, setPackError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/tools/art-portrait")
      .then((r) => r.json())
      .then((d) => d.ok && setQuota({ signedIn: d.signedIn, remaining: d.remaining, admin: !!d.admin }))
      .catch(() => {});
    fetch("/api/tools/art-portrait/samples")
      .then((r) => r.json())
      .then((d) => d.ok && setSamples({ ...(d.samples ?? {}), ...BUNDLED }))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!busy) return;
    const t = setInterval(() => setTick((n) => n + 1), 3200);
    return () => clearInterval(t);
  }, [busy]);

  const s = getArtStyle(style)!;
  const glasses: ArtGlasses = glassesChoice ?? (s.noGlasses ? "remove" : "keep");
  const outOfTries = quota !== null && quota.remaining <= 0;
  const current = showing >= 0 ? made[showing] : null;
  const currentStyle = current ? getArtStyle(current.style)! : s;

  async function upload(file: File) {
    setError(null);
    setUploading(true);
    try {
      const form = new FormData();
      form.set("kind", "look");
      form.set("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed.");
      setPhoto(data.url);
      setMade([]);
      setShowing(-1);
      track("tool_art_upload");
    } catch (e) {
      setError({ msg: e instanceof Error ? e.message : "Upload failed. Try another photo.", field: "photo" });
      flagField('[data-field="photo"]');
    } finally {
      setUploading(false);
    }
  }

  async function paint() {
    if (!photo) {
      setError({ msg: "Add your photo first.", field: "photo" });
      return flagField('[data-field="photo"]');
    }
    if (!consent) {
      setError({ msg: "Tick the box to confirm the photo is of you, or that everyone in it agreed.", field: "consent" });
      return flagField('[data-field="consent"]');
    }
    setError(null);
    setBusy(true);
    setTick(0);
    track("tool_art_create", { style, outfit, glasses });
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 50);
    try {
      const res = await fetch("/api/tools/art-portrait", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ style, outfit, glasses, consent, photoUrl: photo }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError({ msg: data.error, code: data.code });
        flagField(data.code === "signup_for_more" ? "#art-signup" : "#art-error");
        if (data.code === "signup_for_more" || data.code === "art_used") setQuota((q) => ({ ...q, signedIn: q?.signedIn ?? false, remaining: 0 }));
        return;
      }
      setMade((m) => {
        setShowing(m.length);
        return [...m, { style, url: data.url, aspect: String(data.aspect ?? "3:4").replace(":", " / ") }];
      });
      setQuota((q) => ({ ...q, signedIn: data.signedIn, remaining: data.remaining }));
      track("tool_art_done", { style });
    } catch {
      setError({ msg: "Something went wrong. Please try again." });
      flagField("#art-error");
    } finally {
      setBusy(false);
    }
  }

  /** The paid Art pack: every style at once, then checkout. */
  async function orderPack(free = false) {
    if (!photo) {
      setError({ msg: "Add your photo first.", field: "photo" });
      return flagField('[data-field="photo"]');
    }
    if (!consent) {
      setError({ msg: "Tick the box to confirm the photo is of you, or that everyone in it agreed.", field: "consent" });
      return flagField('[data-field="consent"]');
    }
    setPackError(null);
    setOrdering(true);
    track(free ? "art_pack_admin_free" : "art_pack_checkout", { outfit });
    try {
      const res = await fetch("/api/tools/art-portrait/pack", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ photoUrl: photo, outfit, glasses: glassesChoice ?? "auto", consent, adminFree: free }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      if (data.redirect) {
        window.location.href = data.redirect;
        return;
      }
      const co = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind: "pack", packId: PACKS.art10.id, albumId: data.albumId }),
      });
      const cd = await co.json();
      if (!co.ok || !cd.url) throw new Error(cd.error || "We couldn't start checkout.");
      window.location.href = cd.url;
    } catch (e) {
      setPackError(e instanceof Error ? e.message : "Something went wrong.");
      flagField("#art-pack-error");
      setOrdering(false);
    }
  }

  async function seedSamples() {
    for (const x of ART_STYLES) {
      if (samples[x.id]) continue;
      setSeeding(x.name);
      try {
        const res = await fetch("/api/tools/art-portrait/samples", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ style: x.id }),
        });
        const d = await res.json();
        if (res.ok) setSamples((m) => ({ ...m, [x.id]: d.url }));
      } catch {
        /* keep going */
      }
    }
    setSeeding(null);
  }

  async function save() {
    if (!current) return;
    track("tool_art_download", { style: current.style });
    try {
      const blob = await (await fetch(current.url)).blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `mandapcanvas-${current.style}-portrait.jpg`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    } catch {
      window.open(current.url, "_blank");
    }
  }

  async function share() {
    if (!current) return;
    track("tool_art_share", { style: current.style });
    try {
      const blob = await (await fetch(current.url)).blob();
      const file = new File([blob], `our-${current.style}-portrait.jpg`, { type: "image/jpeg" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "Our art portrait", text: "Made with MandapCanvas" });
      } else {
        await navigator.share({ title: "Turn your photo into art", url: window.location.href });
      }
    } catch {
      /* cancelled or unsupported */
    }
  }

  const missing = ART_STYLES.some((x) => !samples[x.id]);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
      {/* controls */}
      <div className="min-w-0 rounded-[26px] border border-gold/40 bg-white p-4 shadow-[0_30px_60px_-44px_rgba(74,13,26,0.6)] sm:p-7">
        <Step n={1} title="Add a photo">
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
            className="sr-only"
            onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
          />
          <div data-field="photo">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className={`flex w-full items-center gap-4 rounded-2xl border-2 border-dashed border-gold/70 bg-silk p-2 pr-4 text-left transition hover:border-kumkum ${!photo && !uploading ? "mc-attention" : ""}`}
            >
              <span className="relative flex h-28 w-[5.25rem] flex-none items-center justify-center overflow-hidden rounded-xl bg-white text-kumkum">
                {photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photo} alt="Your photo" className="h-full w-full object-cover" />
                ) : uploading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <ImageUp size={28} />
                )}
                {photo && uploading ? (
                  <span className="absolute inset-0 flex items-center justify-center bg-white/70">
                    <Loader2 className="animate-spin" />
                  </span>
                ) : null}
              </span>
              <span>
                <span className="block font-semibold text-kumkum">{uploading ? "Uploading…" : photo ? "Change photo" : "Choose a photo"}</span>
                <span className="mt-0.5 block text-xs text-ink-soft">{photo ? "Tap to use a different one" : "You, or the two of you"}</span>
              </span>
            </button>
            <ul className="mt-3 space-y-0.5 px-1 text-sm text-ink-soft">
              <li>✓ Faces clearly visible, in good light</li>
              <li>✓ An engagement photo or a selfie together works great</li>
            </ul>
          </div>
          {error?.field === "photo" ? (
            <p role="alert" className="mt-2 text-sm font-semibold text-kumkum-deep">
              {error.msg}
            </p>
          ) : null}
        </Step>

        <Step n={2} title="Pick a style">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5" role="radiogroup" aria-label="Art style">
            {ART_STYLES.map((x) => {
              const on = style === x.id;
              return (
                <button
                  key={x.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setStyle(x.id)}
                  className={`group relative overflow-hidden rounded-2xl border-2 text-left transition ${on ? "border-kumkum" : "border-line hover:border-gold"}`}
                >
                  <span className="relative block aspect-[3/4] w-full overflow-hidden" style={{ background: `linear-gradient(150deg, ${x.swatch[0]}, ${x.swatch[1]})` }}>
                    {samples[x.id] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={samples[x.id]} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" loading="lazy" />
                    ) : (
                      <Paintbrush size={22} className="absolute left-1/2 top-[40%] -translate-x-1/2 text-white/90" aria-hidden="true" />
                    )}
                    <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 pb-2 pt-8 text-sm font-semibold leading-tight text-white">
                      {x.name}
                    </span>
                    {x.popular ? (
                      <span className="absolute left-1.5 top-1.5 rounded-full bg-gold px-1.5 py-0.5 text-[10px] font-semibold text-maroon-deep">Popular</span>
                    ) : null}
                    {on ? (
                      <span className="pop-in absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-kumkum text-white">
                        <Check size={13} strokeWidth={3} />
                      </span>
                    ) : null}
                  </span>
                </button>
              );
            })}
          </div>
          {quota?.admin && missing ? (
            <button type="button" className="btn btn-ghost btn-sm mt-3" onClick={seedSamples} disabled={!!seeding}>
              {seeding ? `Painting the ${seeding} example…` : "Admin: paint the missing style examples"}
            </button>
          ) : null}
        </Step>

        <Step n={3} title="Outfits and glasses">
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Outfits">
            <button type="button" className="chip" role="radio" aria-checked={outfit === "wedding"} onClick={() => setOutfit("wedding")}>
              Dress us for the wedding
            </button>
            <button type="button" className="chip" role="radio" aria-checked={outfit === "keep"} onClick={() => setOutfit("keep")}>
              Keep our clothes
            </button>
          </div>
          <p className="mt-4 text-sm font-semibold">Glasses</p>
          <div className="mt-1.5 flex flex-wrap gap-2" role="radiogroup" aria-label="Glasses">
            <button type="button" className="chip" role="radio" aria-checked={glasses === "keep"} onClick={() => setGlassesChoice("keep")}>
              Keep them
            </button>
            <button type="button" className="chip" role="radio" aria-checked={glasses === "remove"} onClick={() => setGlassesChoice("remove")}>
              Remove them
            </button>
          </div>
          {s.noGlasses && glassesChoice === null ? (
            <p className="mt-1.5 text-xs text-ink-soft">Off for {s.name}, since glasses look out of place in this art form. Switch back any time.</p>
          ) : null}
        </Step>

        <label className={`mt-6 flex gap-3 rounded-2xl p-4 text-sm ${error?.field === "consent" ? "bg-[#fbeaea] text-kumkum-deep" : "bg-silk"}`} data-field="consent">
          <input type="checkbox" className="mt-0.5 h-4 w-4 flex-none accent-[#9E1B32]" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
          <span>This is my photo, or everyone in it said yes, and we&apos;re 18 or older. Your photo and portrait are deleted automatically after 7 days.</span>
        </label>

        <div className="mt-5 flex flex-col items-center gap-2 text-center sm:items-start sm:text-left">
          <button
            type="button"
            className="btn btn-primary w-full sm:w-auto"
            onClick={() => {
              if (!outOfTries) return paint();
              track("tool_art_out_click", { signedIn: !!quota?.signedIn });
              flagField(quota?.signedIn ? "#art-next" : "#art-signup");
            }}
            disabled={busy || uploading}
          >
            {busy ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}{" "}
            {busy ? "Painting…" : outOfTries ? (quota?.signedIn ? "See yourself at every event" : "Sign up free for one more") : `Paint my ${s.name} portrait`}
          </button>
          <p className="text-sm text-ink-soft">
            {quota === null
              ? "Free, no sign-up."
              : quota.remaining > 0
                ? quota.admin
                  ? "Admin: unlimited."
                  : `${quota.remaining} free ${quota.remaining === 1 ? "portrait" : "portraits"} left${quota.signedIn ? "" : ". No sign-up needed"}.`
                : quota.signedIn
                  ? "You've used your free portraits."
                  : "You've used your free portrait. Create a free account for one more."}
          </p>
        </div>
      </div>

      {/* result */}
      <div ref={resultRef} className="min-w-0 lg:sticky lg:top-24 lg:self-start">
        <div className="frame-gold overflow-hidden rounded-[26px] bg-white">
          {current && photo && !busy ? (
            <BeforeAfter
              before={photo}
              after={current.url}
              beforeAlt="Your photo"
              afterAlt={`Your ${currentStyle.name} portrait`}
              beforeLabel="Your photo"
              afterLabel={currentStyle.name}
              aspect={current.aspect}
            />
          ) : (
            <div className="relative aspect-[3/4] bg-silk">
              {samples[style] ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={samples[style]} alt={`Example: ${s.name}`} className={`h-full w-full object-cover ${busy ? "opacity-40 blur-[2px]" : ""}`} />
                  {!busy ? <span className="absolute left-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-xs font-semibold text-white">Example: {s.name}</span> : null}
                </>
              ) : (
                <div className="h-full w-full" style={{ background: `linear-gradient(150deg, ${s.swatch[0]}, ${s.swatch[1]})`, opacity: busy ? 0.5 : 0.85 }} />
              )}
              <div className={`absolute inset-x-0 bottom-0 p-5 text-center ${samples[style] && !busy ? "bg-gradient-to-t from-black/70 to-transparent pt-16 text-white" : ""}`}>
                {busy ? (
                  <div className="flex flex-col items-center">
                    <Paintbrush className="animate-bounce text-kumkum" />
                    <p className="mt-2 font-display text-xl text-maroon">{WAITING[tick % WAITING.length]}</p>
                    <p className="text-sm text-ink-soft">About 20 seconds.</p>
                  </div>
                ) : (
                  <>
                    <p className={`font-display text-xl ${samples[style] ? "text-gold-light" : "text-maroon"}`}>Your {s.name} portrait appears here</p>
                    <p className={`mt-1 text-sm ${samples[style] ? "text-white/85" : "text-ink-soft"}`}>Then drag the slider to compare it with your photo.</p>
                  </>
                )}
              </div>
              {busy ? <div className="sheen pointer-events-none absolute inset-0" aria-hidden="true" /> : null}
            </div>
          )}
          {current && !busy ? (
            <div className="flex flex-wrap justify-center gap-2 p-4 sm:justify-start">
              <button type="button" className="btn btn-primary btn-sm" onClick={save}>
                <Download size={16} /> Save
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={share}>
                <Share2 size={16} /> Share
              </button>
              {quota && quota.remaining > 0 ? (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => document.querySelector('[aria-label="Art style"]')?.scrollIntoView({ behavior: "smooth", block: "center" })}
                >
                  <RefreshCw size={16} /> Try another style
                </button>
              ) : null}
            </div>
          ) : null}
        </div>

        {made.length > 1 ? (
          <div className="mt-3">
            <p className="text-sm font-semibold">Your portraits</p>
            <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
              {made.map((m, i) => (
                <button
                  key={m.url}
                  type="button"
                  onClick={() => setShowing(i)}
                  className={`h-20 w-16 flex-none overflow-hidden rounded-lg ring-2 ${i === showing ? "ring-kumkum" : "ring-transparent"}`}
                  aria-label={`Show the ${getArtStyle(m.style)?.name} portrait`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={m.url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {error && !error.field && error.code !== "signup_for_more" ? (
          <p id="art-error" role="alert" className="mt-3 rounded-2xl bg-[#fbeaea] p-4 text-sm text-kumkum-deep">
            {error.msg}
          </p>
        ) : null}
        {outOfTries && quota && !quota.signedIn ? (
          <FreeTrySignup
            id="art-signup"
            next="/tools/wedding-art-portrait"
            source="art"
            title="One more portrait, free"
            text={`Create a free account to try another style.${offerLine()}`}
            cta="Get my free portrait"
          />
        ) : null}
        <section id="art-pack" className="mt-4 overflow-hidden rounded-[22px] border border-gold/60 bg-white" aria-labelledby="art-pack-h">
          <div className="flex items-baseline justify-between gap-3 bg-[#2a0b14] px-5 py-4 text-[#fff8ef]">
            <h2 id="art-pack-h" className="font-display text-xl text-gold-light">
              All {ART_STYLES.length} styles at once
            </h2>
            <span className="flex-none rounded-full bg-[linear-gradient(#f2d98c,#c9a24b)] px-2.5 py-0.5 text-sm font-semibold text-[#3b0a15]">
              {formatUSD(PACKS.art10.priceCents)}
            </span>
          </div>
          <div className="p-5">
            <ul className="grid grid-cols-5 gap-1" aria-label="Every style in the pack">
              {ART_STYLES.map((x) => (
                <li key={x.id} className="overflow-hidden rounded-md">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={samples[x.id]} alt={x.name} className="aspect-[3/4] w-full object-cover" loading="lazy" />
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm text-ink-soft">
              Your photo in every style, painted together, with no watermark. Download them all as a ZIP, or one at a time.
            </p>
            <button type="button" className="btn btn-primary mt-4 w-full" onClick={() => orderPack()} disabled={ordering || uploading}>
              {ordering ? <Loader2 size={18} className="animate-spin" /> : null}
              {photo ? `Get all ${ART_STYLES.length} styles, ${formatUSD(PACKS.art10.priceCents)}` : "Add your photo first"}
            </button>
            <p className="mt-2 text-center text-xs text-ink-soft">Uses your outfit and glasses choices. {PACKS.art10.freeRegens} free redos.</p>
            {quota?.admin && photo ? (
              <button type="button" className="btn btn-ghost btn-sm mt-2" onClick={() => orderPack(true)} disabled={ordering}>
                Admin: make this pack free
              </button>
            ) : null}
            {packError ? (
              <p id="art-pack-error" role="alert" className="mt-3 rounded-2xl bg-[#fbeaea] p-3 text-sm text-kumkum-deep">
                {packError}
              </p>
            ) : null}
          </div>
        </section>

        {current || (outOfTries && quota?.signedIn) ? (
          <div id="art-next" className="mt-4 rounded-[22px] border border-gold/50 bg-white p-5">
            <p className="font-display text-xl text-maroon">Now see it for real</p>
            <p className="mt-1 text-sm text-ink-soft">
              Photo-real portraits of you at the Haldi, Mehndi, Sangeet, wedding and reception, from the same photo. From {formatUSD(PACKS.look12.priceCents)}.
            </p>
            <Link href="/looks" className="btn btn-primary btn-sm mt-3" onClick={() => track("tool_art_cta")}>
              See wedding looks
            </Link>
          </div>
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
