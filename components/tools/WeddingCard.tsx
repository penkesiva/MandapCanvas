"use client";

import "@fontsource/cinzel/400.css";
import "@fontsource/great-vibes/400.css";
import "@fontsource/playfair-display/400.css";
import "@fontsource/yatra-one/400.css";
import "@fontsource/unbounded/400.css";
import "@fontsource/fredoka/400.css";
import "@fontsource/fredoka/500.css";
import "@fontsource/fredoka/600.css";
import "@fontsource/bungee/400.css";
import "@fontsource/m-plus-rounded-1c/400.css";
import "@fontsource/m-plus-rounded-1c/500.css";
import "@fontsource/m-plus-rounded-1c/700.css";
import "@fontsource/cormorant-garamond/500.css";
import "@fontsource/cormorant-garamond/600.css";
import "@fontsource/cormorant-garamond/700.css";
import "@fontsource/cormorant-garamond/500-italic.css";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Download, Loader2, Paintbrush, Share2, Sparkles, Wand2 } from "lucide-react";
import { engage as track } from "@/lib/engage";
import { FOUNDING_OFFER } from "@/lib/config";
import {
  CARD_EVENTS,
  CARD_TEMPLATES,
  DRESS_CODES,
  EMPTY_DETAILS,
  EXAMPLE_DETAILS,
  getCardTemplate,
  type CardDetails,
  type CardFormat,
} from "@/lib/weddingCards";
import { drawCard, loadCardFonts, loadImage } from "@/lib/cardRender";
import { FreeTrySignup } from "./FreeTrySignup";
import { flagField } from "@/lib/flagField";

const STORE = "mc:card:v1";
const WAITING = ["Mixing the colors…", "Painting the border…", "Adding the marigolds…", "Gilding the details…", "Almost ready…"];

type Art = { template: string; format: CardFormat; url: string };
type Saved = { details: CardDetails; template: string; format: CardFormat; motifs: string; arts: Art[] };

const imageCache = new Map<string, Promise<HTMLImageElement>>();
function cachedImage(url: string) {
  if (!imageCache.has(url)) imageCache.set(url, loadImage(url));
  return imageCache.get(url)!;
}

export function WeddingCard() {
  const [details, setDetails] = useState<CardDetails>(EMPTY_DETAILS);
  const [template, setTemplate] = useState("royal");
  const [format, setFormat] = useState<CardFormat>("card");
  const [motifs, setMotifs] = useState("");
  const [arts, setArts] = useState<Art[]>([]);
  const [samples, setSamples] = useState<Record<string, string>>({});
  const [quota, setQuota] = useState<{ signedIn: boolean; remaining: number; admin: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const [tick, setTick] = useState(0);
  const [error, setError] = useState<{ msg: string; code?: string; field?: "names" } | null>(null);
  const [seeding, setSeeding] = useState<string | null>(null);
  const loaded = useRef(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // restore + quota + samples
  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem(STORE) || "null") as Saved | null;
      if (s) {
        setDetails({ ...EMPTY_DETAILS, ...s.details });
        if (s.template) setTemplate(s.template);
        if (s.format) setFormat(s.format);
        setMotifs(s.motifs ?? "");
        setArts(Array.isArray(s.arts) ? s.arts : []);
      }
    } catch {
      /* storage blocked */
    }
    loaded.current = true;
    fetch("/api/tools/wedding-card")
      .then((r) => r.json())
      .then((d) => {
        if (!d.ok) return;
        setQuota({ signedIn: d.signedIn, remaining: d.remaining, admin: d.admin });
        setSamples(d.samples ?? {});
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    try {
      localStorage.setItem(STORE, JSON.stringify({ details, template, format, motifs, arts } satisfies Saved));
    } catch {
      /* storage blocked */
    }
  }, [details, template, format, motifs, arts]);

  useEffect(() => {
    if (!busy) return;
    const t = setInterval(() => setTick((n) => n + 1), 3000);
    return () => clearInterval(t);
  }, [busy]);

  const t = getCardTemplate(template);
  const mine = [...arts].reverse().find((a) => a.template === template && a.format === format) ?? null;
  const sampleUrl = format === "card" ? samples[template] : undefined;
  const artUrl = mine?.url ?? sampleUrl ?? null;
  const isSample = !mine;

  // draw the preview whenever anything changes
  const draw = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    await loadCardFonts(t);
    let art: HTMLImageElement | null = null;
    if (artUrl) art = await cachedImage(artUrl).catch(() => null);
    drawCard(canvas, { art, template: t, details, format, sample: isSample && !!art, badge: true });
  }, [t, artUrl, details, format, isSample]);

  useEffect(() => {
    const id = setTimeout(draw, 80);
    return () => clearTimeout(id);
  }, [draw]);

  const set = (k: keyof CardDetails) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setDetails((d) => ({ ...d, [k]: e.target.value }));
  const ready = details.name1.trim() && details.name2.trim();
  const outOfTries = quota !== null && quota.remaining <= 0;

  async function paint() {
    if (!ready) {
      setError({ msg: "Add both names first.", field: "names" });
      return flagField(details.name1.trim() ? '[data-field="name2"]' : '[data-field="name1"]');
    }
    setError(null);
    setBusy(true);
    setTick(0);
    track("tool_card_create", { template, format, event: details.event });
    previewRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    try {
      const res = await fetch("/api/tools/wedding-card", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ template, format, event: details.event, motifs }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError({ msg: data.error, code: data.code });
        flagField(data.code === "signup_for_more" ? "#card-signup" : "#card-error");
        if (data.code === "signup_for_more" || data.code === "cards_used") setQuota((q) => (q ? { ...q, remaining: 0 } : q));
        return;
      }
      setArts((a) => [...a, { template, format, url: data.url }].slice(-12));
      setQuota((q) => ({ signedIn: data.signedIn, remaining: data.remaining, admin: q?.admin ?? false }));
      track("tool_card_done", { template, format });
    } catch {
      setError({ msg: "Something went wrong. Please try again." });
      flagField("#card-error");
    } finally {
      setBusy(false);
    }
  }

  function fileName(ext: string) {
    const n = [details.name1, details.name2].map((s) => s.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-")).filter(Boolean).join("-and-");
    return `${n || "our"}-${details.event.replace(/_/g, "-")}-invitation.${ext}`;
  }

  async function toBlob(): Promise<Blob | null> {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    await draw();
    return new Promise((ok) => {
      try {
        canvas.toBlob((b) => ok(b), "image/png");
      } catch {
        ok(null);
      }
    });
  }

  async function download() {
    track("tool_card_download", { template });
    const blob = await toBlob();
    if (!blob) return setError({ msg: "Your browser blocked the download. Try another browser." });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = fileName("png");
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  async function share() {
    track("tool_card_share", { template });
    const blob = await toBlob();
    try {
      const file = blob ? new File([blob], fileName("png"), { type: "image/png" }) : null;
      if (file && navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], title: "You're invited!" });
      else await navigator.share({ title: "Make your wedding invitation", url: window.location.href });
    } catch {
      /* cancelled or unsupported */
    }
  }

  async function seedSamples() {
    for (const tpl of CARD_TEMPLATES) {
      if (samples[tpl.id]) continue;
      setSeeding(tpl.name);
      const res = await fetch("/api/tools/wedding-card", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ template: tpl.id, format: "card", event: "wedding", motifs: "", sample: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.url) setSamples((s) => ({ ...s, [tpl.id]: data.url }));
    }
    setSeeding(null);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
      <div className="min-w-0 rounded-[26px] border border-gold/40 bg-white p-4 shadow-[0_30px_60px_-44px_rgba(74,13,26,0.6)] sm:p-7">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-ink-soft">Type your details. The card updates as you type.</p>
          <button type="button" className="text-sm font-semibold text-kumkum underline underline-offset-4" onClick={() => setDetails(EXAMPLE_DETAILS)}>
            Fill in an example
          </button>
        </div>

        <Step n={1} title="The couple and the event">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="First name" hint="As it should appear">
              <input className="field" value={details.name1} onChange={set("name1")} placeholder="Priya" maxLength={28} data-field="name1" />
            </Field>
            <Field label="Partner's first name">
              <input className="field" value={details.name2} onChange={set("name2")} placeholder="Arjun" maxLength={28} data-field="name2" />
            </Field>
          </div>
          {error?.field === "names" ? (
            <p role="alert" className="mt-2 text-sm font-semibold text-kumkum-deep">
              {error.msg}
            </p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2" role="radiogroup" aria-label="Event">
            {CARD_EVENTS.map((e) => (
              <button key={e.id} type="button" role="radio" aria-checked={details.event === e.id} className="chip" onClick={() => setDetails((d) => ({ ...d, event: e.id }))}>
                {e.name}
              </button>
            ))}
          </div>
        </Step>

        <Step n={2} title="When and where">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Date">
              <input className="field" type="date" value={details.date} onChange={set("date")} />
            </Field>
            <Field label="Time" hint="Optional">
              <input className="field" type="time" value={details.time} onChange={set("time")} />
            </Field>
            {details.event !== "save_the_date" ? (
              <Field label="Venue" hint="Hall, hotel, temple or home">
                <input className="field" value={details.venue} onChange={set("venue")} placeholder="The Ritz-Carlton, Half Moon Bay" maxLength={60} />
              </Field>
            ) : null}
            <Field label="City" hint={details.event === "save_the_date" ? "Where you're getting married" : "Optional"}>
              <input className="field" value={details.city} onChange={set("city")} placeholder="San Jose, California" maxLength={40} />
            </Field>
          </div>
        </Step>

        <Step n={3} title="Extras, all optional">
          <div className="grid gap-3">
            {details.event !== "save_the_date" && details.event !== "haldi" && details.event !== "mehndi" && details.event !== "sangeet" ? (
              <Field label="Hosts line" hint="Replaces “Together with their families”">
                <input className="field" value={details.hosts} onChange={set("hosts")} placeholder="Mr & Mrs Rajesh Sharma and Mr & Mrs Anil Rao invite you" maxLength={90} />
              </Field>
            ) : null}
            <Field label="Dress code">
              <input className="field" value={details.dressCode} onChange={set("dressCode")} placeholder="Indian festive" maxLength={40} />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {DRESS_CODES.map((d) => (
                  <button key={d} type="button" className="rounded-full border border-line px-2.5 py-1 text-xs hover:border-gold" onClick={() => setDetails((x) => ({ ...x, dressCode: d }))}>
                    {d}
                  </button>
                ))}
              </div>
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="RSVP" hint="By when, and how">
                <input className="field" value={details.rsvp} onChange={set("rsvp")} placeholder="RSVP by Jan 10 · (408) 555-0142" maxLength={60} />
              </Field>
              <Field label="Hashtag" hint={<Link href="/tools/wedding-hashtag-generator" className="text-kumkum underline">Need one?</Link>}>
                <input className="field" value={details.hashtag} onChange={set("hashtag")} placeholder="#PriyaWedsArjun" maxLength={32} />
              </Field>
            </div>
          </div>
        </Step>

        <Step n={4} title="Pick a style">
          <StyleGallery template={template} setTemplate={setTemplate} samples={samples} arts={arts} />
          {quota?.admin && CARD_TEMPLATES.some((x) => !samples[x.id]) ? (
            <button type="button" className="btn btn-ghost btn-sm mt-3" onClick={seedSamples} disabled={!!seeding}>
              {seeding ? `Painting the ${seeding} sample…` : "Admin: paint the missing style samples"}
            </button>
          ) : null}
        </Step>

        <Step n={5} title="Size and personal touches">
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Size">
            {(
              [
                ["card", "Card · 3:4", "Print or email"],
                ["story", "Phone · 9:16", "WhatsApp and Instagram stories"],
              ] as [CardFormat, string, string][]
            ).map(([v, l, h]) => (
              <button
                key={v}
                type="button"
                role="radio"
                aria-checked={format === v}
                onClick={() => setFormat(v)}
                className={`rounded-2xl border-2 px-4 py-2 text-left ${format === v ? "border-kumkum bg-[#fbf1ee]" : "border-line hover:border-gold"}`}
              >
                <span className="block text-sm font-semibold">{l}</span>
                <span className="block text-xs text-ink-soft">{h}</span>
              </button>
            ))}
          </div>
          <div className="mt-4">
            <Field label="Add something personal to the artwork" hint="Optional">
              <input className="field" value={motifs} onChange={(e) => setMotifs(e.target.value)} placeholder="Peacocks, our golden retriever, the Golden Gate Bridge" maxLength={160} />
            </Field>
          </div>
        </Step>

        <div className="mt-5 flex flex-col items-start gap-2">
          <button type="button" className="btn btn-primary w-full sm:w-auto" onClick={paint} disabled={busy || outOfTries}>
            {busy ? <Loader2 size={18} className="animate-spin" /> : <Wand2 size={18} />} {busy ? "Painting your card…" : `Paint my ${t.name} card`}
          </button>
          <p className="text-sm text-ink-soft">
            {quota === null
              ? "Try for free, no sign-up."
              : quota.remaining > 0
                ? `${quota.admin ? "Admin: unlimited" : `${quota.remaining} free ${quota.remaining === 1 ? "card" : "cards"} left`}. Words stay editable for free after painting.`
                : quota.signedIn
                  ? "You've used your free cards. You can still edit the words on cards you've made."
                  : "You've used your free card. Create a free account for one more."}
          </p>
        </div>
      </div>

      {/* preview */}
      <div ref={previewRef} className="min-w-0 lg:sticky lg:top-24 lg:self-start">
        <div className="frame-gold overflow-hidden rounded-[26px] bg-white p-3">
          <div className={`relative mx-auto overflow-hidden rounded-xl ${format === "story" ? "max-w-[300px]" : ""}`}>
            <canvas ref={canvasRef} className="block h-auto w-full" aria-label="Invitation preview" />
            {busy ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 text-center backdrop-blur-[2px]">
                <Paintbrush className="animate-bounce text-kumkum" />
                <p className="mt-2 font-display text-xl text-maroon">{WAITING[tick % WAITING.length]}</p>
                <p className="text-sm text-ink-soft">About 15 seconds.</p>
              </div>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2 px-1 pt-3">
            {mine ? (
              <>
                <button type="button" className="btn btn-primary btn-sm" onClick={download}>
                  <Download size={16} /> Download
                </button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={share}>
                  <Share2 size={16} /> Share
                </button>
              </>
            ) : (
              <p className="text-sm text-ink-soft">
                <Sparkles size={14} className="mr-1 inline text-gold" />
                {sampleUrl ? "Your words on a sample artwork. Paint your own to download it." : "Your words, ready for the artwork. Paint it to download."}
              </p>
            )}
          </div>
        </div>

        {arts.length ? (
          <div className="mt-4 rounded-[22px] border border-line bg-white p-4">
            <p className="text-sm font-semibold">Your cards</p>
            <ul className="mt-2 flex gap-2 overflow-x-auto pb-1">
              {arts
                .slice()
                .reverse()
                .map((a) => (
                  <li key={a.url} className="flex-none">
                    <button
                      type="button"
                      onClick={() => {
                        setTemplate(a.template);
                        setFormat(a.format);
                      }}
                      className={`block overflow-hidden rounded-lg ring-2 ${a.url === mine?.url ? "ring-kumkum" : "ring-transparent"}`}
                      title={getCardTemplate(a.template).name}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={a.url} alt={getCardTemplate(a.template).name} className="h-24 w-auto" />
                    </button>
                  </li>
                ))}
            </ul>
          </div>
        ) : null}

        {error && !error.field && error.code !== "signup_for_more" ? (
          <p id="card-error" role="alert" className="mt-3 rounded-2xl bg-[#fbeaea] p-4 text-sm text-kumkum-deep">
            {error.msg}
          </p>
        ) : null}
        {outOfTries && quota && !quota.signedIn ? (
          <FreeTrySignup
            id="card-signup"
            next="/tools/wedding-invitation-maker"
            source="cards"
            title="One more card, free"
            text={`Create a free account to paint one more style, for another event or to compare. You'll also get ${FOUNDING_OFFER.text}.`}
            cta="Get my free card"
          />
        ) : null}
        {mine ? (
          <div className="mt-4 rounded-[22px] border border-gold/50 bg-white p-5">
            <p className="font-display text-xl text-maroon">Now picture the mandap</p>
            <p className="mt-1 text-sm text-ink-soft">See your decor and outfits photo-real, for every event on your card. Two previews are free.</p>
            <Link href="/create" className="btn btn-primary btn-sm mt-3" onClick={() => track("tool_card_cta")}>
              Make a free preview
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function StyleGallery({
  template,
  setTemplate,
  samples,
  arts,
}: {
  template: string;
  setTemplate: (id: string) => void;
  samples: Record<string, string>;
  arts: Art[];
}) {
  const groups = ["Traditional", "Modern", "Fun"] as const;
  return (
    <div className="space-y-4">
      {groups.map((g) => (
        <div key={g}>
          <p className="mb-2 text-sm font-semibold text-ink-soft">{g}</p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4" role="radiogroup" aria-label={`${g} styles`}>
            {CARD_TEMPLATES.filter((x) => x.group === g).map((x) => {
              const own = [...arts].reverse().find((a) => a.template === x.id && a.format === "card")?.url;
              const img = own ?? samples[x.id];
              const on = template === x.id;
              return (
                <button
                  key={x.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setTemplate(x.id)}
                  className={`relative overflow-hidden rounded-xl border-2 text-left transition ${on ? "border-kumkum" : "border-line hover:border-gold"}`}
                >
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img} alt="" className="aspect-[3/4] w-full object-cover" loading="lazy" />
                  ) : (
                    <span
                      className="flex aspect-[3/4] w-full items-center justify-center text-3xl"
                      style={{ background: `linear-gradient(160deg, ${x.swatch[2]}, ${x.swatch[0]} 70%, ${x.swatch[1]})`, fontFamily: `"${x.display}"`, color: x.ink }}
                      aria-hidden="true"
                    >
                      <span className="rounded-lg bg-white/75 px-2 py-0.5">P&amp;A</span>
                    </span>
                  )}
                  <span className="block bg-white px-2 py-1.5">
                    <span className="block text-xs font-semibold leading-tight">{x.name}</span>
                    <span className="block text-[11px] leading-tight text-ink-soft">{x.hint}</span>
                  </span>
                  {on ? (
                    <span className="pop-in absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-kumkum text-white">
                      <Check size={13} strokeWidth={3} />
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-line py-5 last:border-0">
      <h2 className="mb-3 flex items-center gap-2.5 text-xl">
        <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-maroon font-sans text-sm font-semibold text-gold-light">{n}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Field({ label, hint, children }: { label: string; hint?: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="font-semibold">{label}</span>
        {hint ? <span className="text-xs text-ink-soft">{hint}</span> : null}
      </span>
      {children}
    </label>
  );
}
