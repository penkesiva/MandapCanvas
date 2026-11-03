"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Download, ImageUp, Loader2, RefreshCw, Share2, Sparkles } from "lucide-react";
import { engage as track } from "@/lib/engage";
import { FOUNDING_OFFER, PACKS, formatUSD } from "@/lib/config";
import { OUTFIT_COLORS } from "@/lib/outfitColors";
import { LOOK_JEWELRY, LOOK_SETTINGS, LOOK_TRADITIONS, getTradition, type LookGlasses, type LookJewelry, type LookSetting, type LookWho } from "@/lib/bridalLooks";
import { Bride, CoupleScene, Groom } from "./Figures";
import { FreeTrySignup } from "./FreeTrySignup";
import { flagField } from "@/lib/flagField";
import { LookPack } from "./LookPack";

const WHO: { id: LookWho; label: string }[] = [
  { id: "bride", label: "Me as a bride" },
  { id: "groom", label: "Me as a groom" },
  { id: "couple", label: "Us as a couple" },
];

const WAITING = ["Draping the dupatta…", "Pinning the safa…", "Choosing the jewelry…", "Setting up the light…", "Adding the finishing touches…"];

type Quota = { signedIn: boolean; remaining: number };

export function BridalLook() {
  const [who, setWho] = useState<LookWho>("bride");
  const [tradition, setTradition] = useState("north");
  const [color, setColor] = useState("");
  const [jewelry, setJewelry] = useState<LookJewelry>("classic");
  const [setting, setSetting] = useState<LookSetting>("mandap");
  const [glasses, setGlasses] = useState<LookGlasses>("remove");
  const [consent, setConsent] = useState(false);

  const [photo, setPhoto] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [quota, setQuota] = useState<Quota | null>(null);
  const [busy, setBusy] = useState(false);
  const [tick, setTick] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<{ msg: string; code?: string; field?: "photo" | "consent" } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/tools/bridal-look")
      .then((r) => r.json())
      .then((d) => d.ok && setQuota({ signedIn: d.signedIn, remaining: d.remaining }))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!busy) return;
    const t = setInterval(() => setTick((n) => n + 1), 3200);
    return () => clearInterval(t);
  }, [busy]);

  const t = getTradition(tradition);
  const outfit = OUTFIT_COLORS.find((o) => o.id === color);
  const brideHex = outfit?.hex ?? t.brideHex;
  const groomHex = who === "groom" && outfit ? outfit.hex : t.groomHex;
  const safaHex = outfit && who !== "groom" ? outfit.groom[0]?.hex ?? t.safaHex : t.safaHex;
  const outOfTries = quota !== null && quota.remaining <= 0;
  const cta = who === "bride" ? "Create my bridal look" : who === "groom" ? "Create my groom look" : "Create our couple look";

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
      track("tool_look_upload");
    } catch (e) {
      setError({ msg: e instanceof Error ? e.message : "Upload failed. Try another photo.", field: "photo" });
      flagField('[data-field="photo"]');
    } finally {
      setUploading(false);
    }
  }

  async function create() {
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
    track("tool_look_create", { who, tradition });
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 50);
    try {
      const res = await fetch("/api/tools/bridal-look", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ who, tradition, color, jewelry, setting, glasses, consent, photoUrl: photo }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError({ msg: data.error, code: data.code });
        flagField(data.code === "signup_for_more" ? "#look-signup" : "#look-error");
        if (data.code === "signup_for_more" || data.code === "looks_used") setQuota((q) => ({ signedIn: q?.signedIn ?? false, remaining: 0 }));
        return;
      }
      setResult(data.url);
      setQuota({ signedIn: data.signedIn, remaining: data.remaining });
      track("tool_look_done", { who, tradition });
    } catch {
      setError({ msg: "Something went wrong. Please try again." });
      flagField("#look-error");
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    if (!result) return;
    track("tool_look_download");
    try {
      const blob = await (await fetch(result)).blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `mandapcanvas-${who}-look.jpg`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    } catch {
      window.open(result, "_blank");
    }
  }

  async function share() {
    if (!result) return;
    track("tool_look_share");
    try {
      const blob = await (await fetch(result)).blob();
      const file = new File([blob], `my-${who}-look.jpg`, { type: "image/jpeg" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "My wedding look", text: "Made with MandapCanvas" });
      } else {
        await navigator.share({ title: "Try your wedding look", url: window.location.href });
      }
    } catch {
      /* cancelled or unsupported */
    }
  }

  return (
    <>
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
      {/* controls */}
      <div className="min-w-0 rounded-[26px] border border-gold/40 bg-white p-4 shadow-[0_30px_60px_-44px_rgba(74,13,26,0.6)] sm:p-7">
        <Step n={1} title="Who's getting the look?">
          <div className="grid grid-cols-3 gap-2 sm:gap-3" role="radiogroup" aria-label="Who">
            {WHO.map((w) => (
              <button
                key={w.id}
                type="button"
                role="radio"
                aria-checked={who === w.id}
                onClick={() => setWho(w.id)}
                className={`flex flex-col items-center rounded-2xl border-2 px-1 pb-2.5 pt-2 text-center text-sm font-semibold transition ${
                  who === w.id ? "border-kumkum bg-[#fbf1ee] text-maroon" : "border-line hover:border-gold"
                }`}
              >
                <span className="flex h-20 items-end" aria-hidden="true">
                  {w.id !== "bride" ? <Groom outfit={t.groomHex} safa={t.safaHex} className={`h-20 w-10 ${w.id === "couple" ? "-mr-3" : ""}`} /> : null}
                  {w.id !== "groom" ? <Bride outfit={t.brideHex} className="h-20 w-10" /> : null}
                </span>
                {w.label}
              </button>
            ))}
          </div>
        </Step>

        <Step n={2} title={who === "couple" ? "Add a photo of you both" : "Add your photo"}>
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
              className="relative flex h-36 w-28 flex-none items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-gold/70 bg-silk text-kumkum hover:border-kumkum"
              aria-label={photo ? "Change photo" : "Upload photo"}
            >
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo} alt="Your photo" className="h-full w-full object-cover" />
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
                <li>✓ Face clearly visible, looking at the camera</li>
                <li>✓ Good light, no sunglasses or filters</li>
                <li>✓ {who === "couple" ? "Both of you in one photo" : "Just you, or you in front"}</li>
              </ul>
            </div>
          </div>
          {error?.field === "photo" ? (
            <p role="alert" className="mt-2 text-sm font-semibold text-kumkum-deep">
              {error.msg}
            </p>
          ) : null}
        </Step>

        <Step n={3} title="Pick a wedding look">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="radiogroup" aria-label="Wedding look">
            {LOOK_TRADITIONS.map((x) => (
              <button
                key={x.id}
                type="button"
                role="radio"
                aria-checked={tradition === x.id}
                onClick={() => setTradition(x.id)}
                className={`relative flex items-center gap-1 rounded-2xl border-2 p-2 text-left transition ${
                  tradition === x.id ? "border-kumkum bg-[#fbf1ee]" : "border-line hover:border-gold"
                }`}
              >
                <span className="flex flex-none items-end" aria-hidden="true">
                  {who === "groom" ? (
                    <Groom outfit={x.groomHex} safa={x.safaHex} className="h-14 w-7" />
                  ) : (
                    <Bride outfit={x.brideHex} className="h-14 w-7" />
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold leading-tight">{x.name}</span>
                  <span className="block text-xs leading-tight text-ink-soft">{x.hint}</span>
                </span>
                {tradition === x.id ? (
                  <span className="pop-in absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-kumkum text-white">
                    <Check size={13} strokeWidth={3} />
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </Step>

        <Step n={4} title={who === "groom" ? "Outfit color" : "Bride's outfit color"}>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Outfit color">
            <button
              type="button"
              role="radio"
              aria-checked={color === ""}
              onClick={() => setColor("")}
              className={`rounded-full border-2 px-3 py-1.5 text-sm font-medium ${color === "" ? "border-kumkum bg-[#fbf1ee] text-maroon" : "border-line"}`}
            >
              Traditional
            </button>
            {OUTFIT_COLORS.map((o) => (
              <button
                key={o.id}
                type="button"
                role="radio"
                aria-checked={color === o.id}
                title={o.name}
                aria-label={o.name}
                onClick={() => setColor(o.id)}
                className={`h-9 w-9 rounded-full ring-1 ring-ink/15 transition ${color === o.id ? "scale-110 outline outline-2 outline-offset-2 outline-kumkum" : ""}`}
                style={{ background: o.hex }}
              />
            ))}
          </div>
          <p className="mt-2 text-sm text-ink-soft">{outfit ? outfit.name : `The usual colors for a ${t.name} ${who === "groom" ? "groom" : "bride"}`}</p>
        </Step>

        <Step n={5} title="Finishing touches">
          {who !== "groom" ? (
            <>
              <p className="text-sm font-semibold">Jewelry</p>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {LOOK_JEWELRY.map((j) => (
                  <button key={j.id} type="button" className="chip" aria-checked={jewelry === j.id} role="radio" onClick={() => setJewelry(j.id)}>
                    {j.name}
                  </button>
                ))}
              </div>
            </>
          ) : null}
          <p className={`text-sm font-semibold ${who !== "groom" ? "mt-4" : ""}`}>Glasses</p>
          <div className="mt-1.5 flex flex-wrap gap-2" role="radiogroup" aria-label="Glasses">
            <button type="button" className="chip" role="radio" aria-checked={glasses === "remove"} onClick={() => setGlasses("remove")}>
              Remove glasses
            </button>
            <button type="button" className="chip" role="radio" aria-checked={glasses === "keep"} onClick={() => setGlasses("keep")}>
              Keep my glasses
            </button>
          </div>
          <p className="mt-4 text-sm font-semibold">Setting</p>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {LOOK_SETTINGS.map((s) => (
              <button key={s.id} type="button" className="chip" role="radio" aria-checked={setting === s.id} onClick={() => setSetting(s.id)}>
                {s.name}
              </button>
            ))}
          </div>
        </Step>

        <label className={`mt-6 flex gap-3 rounded-2xl p-4 text-sm ${error?.field === "consent" ? "bg-[#fbeaea] text-kumkum-deep" : "bg-silk"}`} data-field="consent">
          <input type="checkbox" className="mt-0.5 h-4 w-4 flex-none accent-[#9E1B32]" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
          <span>
            This is my photo, or everyone in it said yes, and we&apos;re 18 or older. Your photo and your look are deleted automatically after 7 days.
          </span>
        </label>

        <div className="mt-5 flex flex-col items-start gap-2">
          <button
            type="button"
            className="btn btn-primary w-full sm:w-auto"
            onClick={() => {
              if (!outOfTries) return create();
              track("tool_look_out_click", { signedIn: !!quota?.signedIn });
              if (quota?.signedIn) document.getElementById("look-pack")?.scrollIntoView({ behavior: "smooth", block: "start" });
              else flagField("#look-signup");
            }}
            disabled={busy || uploading}
          >
            {busy ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}{" "}
            {busy ? "Creating your look…" : outOfTries ? (quota?.signedIn ? "See yourself at every event" : "Sign up free for one more look") : cta}
          </button>
          <p className="text-sm text-ink-soft">
            {quota === null
              ? "Free, no sign-up for your first look."
              : quota.remaining > 0
                ? `${quota.remaining} free ${quota.remaining === 1 ? "look" : "looks"} left${quota.signedIn ? "" : ". No sign-up needed"}.`
                : quota.signedIn
                  ? "You've used your free looks."
                  : "You've used your free look. Create a free account for one more."}
          </p>
        </div>
      </div>

      {/* result */}
      <div ref={resultRef} className="min-w-0 lg:sticky lg:top-24 lg:self-start">
        <div className="frame-gold overflow-hidden rounded-[26px] bg-white">
          <div className="relative aspect-[3/4] bg-silk">
            {result && !busy ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={result} alt={`Your ${who} look`} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full flex-col items-center justify-center p-6 text-center">
                <CoupleScene
                  className={`h-auto w-full max-w-[300px] ${busy ? "animate-pulse" : ""}`}
                  bride={brideHex}
                  groom={groomHex}
                  safa={safaHex}
                  decor={["#C9A24B", outfit?.family[0]?.hex ?? "#F2C4C0", "#FFF8EE"]}
                  show={who === "couple" ? "both" : who}
                />
                <p className="mt-4 font-display text-xl text-maroon">{busy ? WAITING[tick % WAITING.length] : "Your portrait appears here"}</p>
                <p className="mt-1 text-sm text-ink-soft">{busy ? "This takes about 20 seconds." : "A photo-real wedding portrait of you, in the look you choose."}</p>
              </div>
            )}
            {busy ? <div className="sheen pointer-events-none absolute inset-0" aria-hidden="true" /> : null}
          </div>
          {result && !busy ? (
            <div className="flex flex-wrap gap-2 p-4">
              <button type="button" className="btn btn-primary btn-sm" onClick={save}>
                <Download size={16} /> Save
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={share}>
                <Share2 size={16} /> Share
              </button>
              {quota && quota.remaining > 0 ? (
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
                  <RefreshCw size={16} /> Try another look
                </button>
              ) : null}
            </div>
          ) : null}
        </div>

        {error && !error.field && error.code !== "signup_for_more" ? (
          <p id="look-error" role="alert" className="mt-3 rounded-2xl bg-[#fbeaea] p-4 text-sm text-kumkum-deep">
            {error.msg}
          </p>
        ) : null}
        {outOfTries && quota && !quota.signedIn ? <FreeTrySignup
            id="look-signup"
            next="/looks"
            source="looks"
            title="One more look, free"
            text={`Create a free account to try another tradition or color. You'll also get ${FOUNDING_OFFER.text}.`}
            cta="Get my free look"
          /> : null}
        {(outOfTries && quota?.signedIn) || (result && !busy) ? <AlbumUpsell who={who} /> : null}
      </div>
    </div>
    <LookPack who={who} tradition={tradition} color={color} jewelry={jewelry} glasses={glasses} firstPhoto={photo} consented={consent} />
    </>
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

function AlbumUpsell({ who }: { who: LookWho }) {
  return (
    <div className="mt-4 rounded-[22px] border border-gold/50 bg-white p-5">
      <p className="font-display text-xl text-maroon">Love it? Get every event</p>
      <p className="mt-1 text-sm text-ink-soft">
        Turn the same photo into a full set: {who === "couple" ? "the two of you" : "you"} at the Haldi, Mehndi, Sangeet, the wedding and the reception, in outfits made
        for each. From {formatUSD(PACKS.look12.priceCents)}.
      </p>
      <a href="#look-pack" className="btn btn-primary btn-sm mt-3" onClick={() => track("tool_look_cta")}>
        See the Look Pack
      </a>
    </div>
  );
}
