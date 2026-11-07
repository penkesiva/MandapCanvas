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
import { Check, Copy, Download, Link2, Loader2, Paintbrush, Share2, Sparkles, Wand2, X } from "lucide-react";
import { engage as track } from "@/lib/engage";
import { offerLine } from "@/lib/config";
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
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [linking, setLinking] = useState(false);
  const [copied, setCopied] = useState<"image" | "link" | null>(null);
  const [tick, setTick] = useState(0);
  const [error, setError] = useState<{ msg: string; code?: string; field?: "names" } | null>(null);
  const [seeding, setSeeding] = useState<string | null>(null);
  const [customOpen, setCustomOpen] = useState(false);
  const [exported, setExported] = useState(false);
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
  // The ready-made background is free for everyone; the story size crops the same painting.
  const sampleUrl = samples[template];
  const artUrl = mine?.url ?? sampleUrl ?? null;
  const hasArt = !!artUrl;

  // draw the preview whenever anything changes
  const draw = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    await loadCardFonts(t);
    let art: HTMLImageElement | null = null;
    if (artUrl) art = await cachedImage(artUrl).catch(() => null);
    drawCard(canvas, { art, template: t, details, format, badge: true });
  }, [t, artUrl, details, format]);

  useEffect(() => {
    const id = setTimeout(draw, 80);
    return () => clearTimeout(id);
  }, [draw]);

  const set = (k: keyof CardDetails) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setDetails((d) => ({ ...d, [k]: e.target.value }));
  const ready = details.name1.trim() && details.name2.trim();
  const outOfTries = quota !== null && quota.remaining <= 0;
  const motifList = motifs
    .split(",")
    .map((m) => m.trim().toLowerCase())
    .filter(Boolean);
  const toggleIdea = (idea: string) => {
    const parts = motifs.split(",").map((m) => m.trim()).filter(Boolean);
    const has = parts.some((m) => m.toLowerCase() === idea.toLowerCase());
    setMotifs((has ? parts.filter((m) => m.toLowerCase() !== idea.toLowerCase()) : [...parts, idea]).join(", ").slice(0, 160));
    track("tool_card_idea", { template, idea });
  };

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
      setCustomOpen(false);
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

  function needNames() {
    if (ready) return false;
    setError({ msg: "Add both names first.", field: "names" });
    flagField(details.name1.trim() ? '[data-field="name2"]' : '[data-field="name1"]');
    return true;
  }

  async function toBlob(): Promise<Blob | null> {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    setExported(true);
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
    if (needNames()) return;
    track("tool_card_download", { template, own: !!mine });
    const blob = await toBlob();
    if (!blob) return setError({ msg: "Your browser blocked the download. Try another browser." });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = fileName("png");
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  async function share() {
    if (needNames()) return;
    track("tool_card_share", { template, own: !!mine });
    const blob = await toBlob();
    try {
      const file = blob ? new File([blob], fileName("png"), { type: "image/png" }) : null;
      if (file && navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], title: "You're invited!" });
      else await navigator.share({ title: "Make your wedding invitation", url: window.location.href });
    } catch {
      /* cancelled or unsupported */
    }
  }

  // A link is made once per painted card and words; editing the words makes a new one.
  const linkKey = artUrl ? `${artUrl}|${format}|${JSON.stringify(details)}` : "";
  useEffect(() => {
    setShareLink(null);
  }, [linkKey]);

  async function copyImage() {
    if (needNames()) return;
    track("tool_card_copy_image", { template, own: !!mine });
    const blob = await toBlob();
    try {
      if (!blob || typeof ClipboardItem === "undefined") throw new Error("unsupported");
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      flash("image");
    } catch {
      setError({ msg: "Your browser can't copy images. Use Download or Share instead." });
    }
  }

  async function copyLink() {
    if (needNames()) return;
    track("tool_card_copy_link", { template, own: !!mine });
    let link = shareLink;
    if (!link) {
      setLinking(true);
      try {
        const blob = await toBlob();
        if (!blob) throw new Error();
        const form = new FormData();
        form.set("file", blob, "card.png");
        form.set("template", template);
        const res = await fetch("/api/tools/wedding-card/share", { method: "POST", body: form });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        link = data.link as string;
        setShareLink(link);
      } catch (e) {
        setError({ msg: e instanceof Error && e.message ? e.message : "Couldn't make a link. Try again." });
        return;
      } finally {
        setLinking(false);
      }
    }
    try {
      await navigator.clipboard.writeText(link);
      flash("link");
    } catch {
      /* the link is shown under the buttons */
    }
  }

  function flash(what: "image" | "link") {
    setCopied(what);
    setTimeout(() => setCopied(null), 1800);
  }

  async function makeSample() {
    if (!mine) return;
    try {
      const res = await fetch("/api/tools/wedding-card/sample", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ template, url: mine.url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSamples((x) => ({ ...x, [template]: mine.url }));
    } catch (e) {
      setError({ msg: e instanceof Error && e.message ? e.message : "Couldn't set the sample. Try again." });
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

  const customPanel = (
    <div className="mt-3 rounded-2xl border border-gold/60 bg-[#fdf6ea] p-3 sm:p-4">
      {hasArt && !customOpen ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm">
            <span className="font-semibold text-maroon">{mine ? `Your own ${t.name} painting` : `${t.name}, ready to use`}</span>
            <span className="block text-ink-soft">{mine ? "Painted just for you." : "Free to download and share."}</span>
          </p>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => {
              setCustomOpen(true);
              track("tool_card_customize_open", { template });
            }}
          >
            <Wand2 size={16} /> {mine ? "Paint another version" : "Customize this background"}
          </button>
        </div>
      ) : (
        <div>
          <div className="flex items-start justify-between gap-2">
            <label htmlFor="card-motifs" className="flex items-center gap-2 font-semibold text-maroon">
              <Sparkles size={16} className="text-gold" /> {hasArt ? `Customize the ${t.name} background` : `Paint the ${t.name} background`}
            </label>
            {hasArt ? (
              <button type="button" aria-label="Close" className="rounded-full p-1 text-ink-soft hover:bg-white" onClick={() => setCustomOpen(false)}>
                <X size={16} />
              </button>
            ) : null}
          </div>
          <p className="mt-0.5 text-sm text-ink-soft">We paint a new version just for you, with anything you add. Tap an idea or type your own.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {t.ideas.map((idea) => {
              const on = motifList.includes(idea.toLowerCase());
              return (
                <button
                  key={idea}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleIdea(idea)}
                  className={`rounded-full border px-3 py-1 text-sm transition ${on ? "border-kumkum bg-kumkum text-white" : "border-gold/60 bg-white hover:border-kumkum"}`}
                >
                  {on ? "✓ " : "+ "}
                  {idea}
                </button>
              );
            })}
          </div>
          <input
            id="card-motifs"
            className="field mt-3"
            value={motifs}
            onChange={(e) => setMotifs(e.target.value)}
            placeholder={`e.g. ${t.ideas.slice(0, 2).join(", ")}`}
            maxLength={160}
          />
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => {
                if (!outOfTries) return paint();
                track("tool_card_out_click", { signedIn: !!quota?.signedIn });
                flagField(quota?.signedIn ? "#card-next" : "#card-signup");
              }}
              disabled={busy}
            >
              {busy ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}{" "}
              {busy ? "Painting…" : outOfTries ? (quota?.signedIn ? "See your mandap next" : "Sign up free for one more") : `Paint my ${t.name} version`}
            </button>
            <span className="text-xs text-ink-soft">
              {quota === null
                ? "One free painting, no sign-up."
                : quota.remaining > 0
                  ? quota.admin
                    ? "Admin: unlimited."
                    : `${quota.remaining} free ${quota.remaining === 1 ? "painting" : "paintings"} left.`
                  : quota.signedIn
                    ? "You've used your free paintings. Ready-made backgrounds stay free."
                    : "Create a free account for one more. Ready-made backgrounds stay free."}
            </span>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
      <div className="min-w-0 rounded-[26px] border border-gold/40 bg-white p-4 shadow-[0_30px_60px_-44px_rgba(74,13,26,0.6)] sm:p-7">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-ink-soft">Pick a painted background, add your words, download free.</p>
          <button type="button" className="text-sm font-semibold text-kumkum underline underline-offset-4" onClick={() => setDetails(EXAMPLE_DETAILS)}>
            Fill in an example
          </button>
        </div>

        <Step n={1} title="Pick a background">
          <StyleGallery template={template} setTemplate={(id) => { setTemplate(id); setCustomOpen(false); }} samples={samples} arts={arts} below={customPanel} />
          {quota?.admin && CARD_TEMPLATES.some((x) => !samples[x.id]) ? (
            <button type="button" className="btn btn-ghost btn-sm mt-3" onClick={seedSamples} disabled={!!seeding}>
              {seeding ? `Painting the ${seeding} sample…` : "Admin: paint the missing style samples"}
            </button>
          ) : null}
        </Step>

        <Step n={2} title="The couple and the event">
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

        <Step n={3} title="When and where">
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

        <Step n={4} title="Extras, all optional">
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

        <Step n={5} title="Size">
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
        </Step>

        <div className="mt-5 flex flex-col items-start gap-2">
          <button
            type="button"
            className="btn btn-primary w-full sm:w-auto"
            onClick={() => {
              if (needNames()) return;
              previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
              if (hasArt) download();
            }}
            disabled={busy || !hasArt}
          >
            <Download size={18} /> Download my card
          </button>
          <p className="text-sm text-ink-soft">Free, no sign-up. Change the words any time and download again.</p>
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
            {hasArt ? (
              <>
                <button type="button" className="btn btn-primary btn-sm" onClick={download}>
                  <Download size={16} /> Download
                </button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={copyImage}>
                  {copied === "image" ? <Check size={16} /> : <Copy size={16} />} {copied === "image" ? "Copied" : "Copy image"}
                </button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={copyLink} disabled={linking}>
                  {linking ? <Loader2 size={16} className="animate-spin" /> : copied === "link" ? <Check size={16} /> : <Link2 size={16} />}{" "}
                  {copied === "link" ? "Link copied" : "Copy link"}
                </button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={share}>
                  <Share2 size={16} /> Share
                </button>
                {quota?.admin && format === "card" && mine ? (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={makeSample}
                    disabled={samples[template] === mine.url}
                    title="Shown to every visitor in the style list and behind their words before they paint"
                  >
                    {samples[template] === mine.url ? <Check size={16} /> : <Sparkles size={16} />}{" "}
                    {samples[template] === mine.url ? `The ${t.name} sample` : `Admin: use as the ${t.name} sample`}
                  </button>
                ) : null}
                {shareLink ? (
                  <p className="w-full truncate text-xs text-ink-soft">
                    Anyone with this link can see the card: <a href={shareLink} target="_blank" rel="noopener" className="text-kumkum underline">{shareLink.replace(/^https?:\/\//, "")}</a>
                  </p>
                ) : null}
              </>
            ) : (
              <p className="text-sm text-ink-soft">
                <Sparkles size={14} className="mr-1 inline text-gold" />
                Paint this background to download it, or pick a style with a ready-made one.
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
            text={`Create a free account to paint one more style, for another event or to compare.${offerLine()}`}
            cta="Get my free card"
          />
        ) : null}
        {mine || exported || (outOfTries && quota?.signedIn) ? (
          <div id="card-next" className="mt-4 rounded-[22px] border border-gold/50 bg-white p-5">
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
  below,
}: {
  template: string;
  setTemplate: (id: string) => void;
  samples: Record<string, string>;
  arts: Art[];
  /** Shown right under the row that holds the chosen style. */
  below?: React.ReactNode;
}) {
  const groups = ["Traditional", "Modern", "Fun"] as const;
  const chosenGroup = CARD_TEMPLATES.find((x) => x.id === template)?.group;
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
                      className="flex aspect-[3/4] w-full flex-col items-center justify-center gap-1.5 text-center"
                      style={{ background: `radial-gradient(circle at 50% 38%, ${x.swatch[2]}, ${x.swatch[0]} 75%)` }}
                      aria-hidden="true"
                    >
                      <Paintbrush size={22} style={{ color: x.ink }} />
                      <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-semibold text-maroon">Paint to see</span>
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
          {g === chosenGroup ? below : null}
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
