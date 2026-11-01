"use client";

import "@fontsource/cinzel/400.css";
import "@fontsource/great-vibes/400.css";
import "@fontsource/unbounded/400.css";
import { useEffect, useState } from "react";
import { Bride, CoupleScene, Family, Groom } from "./Figures";

/**
 * A picture for each free tool's card that shows what the tool does, instead of a generic photo.
 * Always 16:9; the parent sets the width.
 */
export function ToolArt({ slug }: { slug: string }) {
  switch (slug) {
    case "ai-bridal-look":
      return <LookArt />;
    case "wedding-invitation-maker":
      return <InviteArt />;
    case "outfit-photo-color-palette":
      return <PhotoPaletteArt />;
    case "wedding-color-palette-finder":
      return <FinderArt />;
    case "outfit-color-matcher":
      return <MatcherArt />;
    case "wedding-hashtag-generator":
      return <HashtagArt />;
    default:
      return <div className="aspect-[16/9] w-full bg-silk" />;
  }
}

function Frame({ children, bg = "bg-silk" }: { children: React.ReactNode; bg?: string }) {
  return <div className={`relative aspect-[16/9] w-full overflow-hidden ${bg}`}>{children}</div>;
}

function Arrow() {
  return (
    <span className="flex flex-col items-center gap-1 text-gold" aria-hidden="true">
      <svg viewBox="0 0 48 24" className="w-10 sm:w-12">
        <path d="M2 12 H40 M32 4 L42 12 L32 20" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="text-[10px] font-semibold tracking-wide text-kumkum">AI</span>
    </span>
  );
}

/** Casual photo → bridal portrait. Uses the real example pair when it exists, an illustration otherwise. */
function LookArt() {
  // Start with the illustration; switch to the real example pair only once both photos have loaded.
  const [photos, setPhotos] = useState(false);
  useEffect(() => {
    let alive = true;
    const load = (src: string) =>
      new Promise<void>((ok, no) => {
        const img = new Image();
        img.onload = () => ok();
        img.onerror = () => no();
        img.src = src;
      });
    Promise.all([load("/samples/look-before.jpg"), load("/samples/look-after.jpg")])
      .then(() => alive && setPhotos(true))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  return (
    <Frame bg="bg-[linear-gradient(135deg,#fbf1ee,#f6e7c8)]">
      <div className="absolute inset-0 flex items-center justify-center gap-3 px-6 sm:gap-5">
        {photos ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/samples/look-before.jpg" alt="" className="h-[72%] w-auto -rotate-3 rounded-lg border-4 border-white object-cover shadow-lg" />
            <Arrow />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/samples/look-after.jpg" alt="" className="frame-gold h-[88%] w-auto rotate-2 rounded-xl object-cover shadow-xl" />
          </>
        ) : (
          <>
            <div className="flex h-[70%] -rotate-3 flex-col items-center justify-end rounded-lg border-4 border-white bg-[#e9e4dc] px-3 pt-3 shadow-lg">
              <Casual className="h-[85%] w-auto" />
              <span className="pb-1 text-[10px] font-semibold text-ink-soft">your photo</span>
            </div>
            <Arrow />
            <div className="h-[86%] rotate-2 overflow-hidden rounded-xl shadow-xl">
              <CoupleScene className="h-full w-auto" bride="#B3131B" dupatta="#C2185B" groom="#F6EFE2" safa="#B3131B" decor={["#C9A24B", "#F2C4C0", "#FFF8EE"]} show="bride" />
            </div>
          </>
        )}
      </div>
    </Frame>
  );
}

/** A plain everyday figure (t-shirt, ponytail) for the "before" side of the illustration. */
function Casual({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 170" className={className} aria-hidden="true">
      <path d="M30 170 Q30 112 60 106 Q90 112 90 170 Z" fill="#7C8A5A" />
      <rect x="54" y="92" width="12" height="16" rx="4" fill="#C98962" />
      <circle cx="60" cy="58" r="28" fill="#2B1B17" />
      <circle cx="86" cy="50" r="9" fill="#2B1B17" />
      <ellipse cx="60" cy="64" rx="23" ry="23" fill="#E0A47E" />
      <path d="M37 60 Q40 38 60 38 Q80 38 83 60 Q74 46 60 46 Q46 46 37 60 Z" fill="#2B1B17" />
      {[-1, 1].map((s) => (
        <g key={s}>
          <circle cx={60 + s * 9.5} cy={66} r="6" stroke="#5A4036" strokeWidth="1.6" fill="none" />
          <circle cx={60 + s * 9.5} cy={66} r="2.4" fill="#2B1B17" />
        </g>
      ))}
      <path d="M54 66 H66" stroke="#5A4036" strokeWidth="1.4" />
      <path d="M55 77 Q60 80 65 77" stroke="#C2454B" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    </svg>
  );
}

/** A real lehenga photo with its colors pulled out beside it. */
function PhotoPaletteArt() {
  const swatches = [
    ["#0F4D36", "Deep green"],
    ["#C9A24B", "Zari gold"],
    ["#F3E6CF", "Ivory"],
    ["#0A3326", "Bottle green"],
    ["#B8863B", "Antique gold"],
  ];
  return (
    <Frame bg="bg-white">
      <div className="absolute inset-0 grid grid-cols-[1.05fr_1fr]">
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/samples/bride.jpg" alt="" className="h-full w-full object-cover object-[60%_62%]" loading="lazy" />
          <span className="absolute left-[46%] top-[58%] h-9 w-9 rounded-full border-[3px] border-white shadow-[0_0_0_2px_rgba(0,0,0,0.25)]" style={{ background: "#0F4D36" }} aria-hidden="true" />
        </div>
        <ul className="flex flex-col justify-center gap-1.5 bg-[#fbf7f0] px-4 sm:gap-2 sm:px-5">
          {swatches.map(([hex, name], i) => (
            <li key={hex} className="flex items-center gap-2.5">
              <span className={`flex-none rounded-lg ring-1 ring-ink/10 ${i === 0 ? "h-8 w-14 sm:h-9 sm:w-16" : "h-6 w-10 sm:h-7 sm:w-12"}`} style={{ background: hex }} />
              <span className="min-w-0 leading-tight">
                <span className={`block font-semibold text-ink ${i === 0 ? "text-sm" : "text-xs"}`}>{name}</span>
                <span className="block font-mono text-[10px] text-ink-soft">{hex}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Frame>
  );
}

/** Three events, three palettes: the couple under the arch in each. */
function FinderArt() {
  const looks: { label: string; bride: string; groom: string; safa: string; decor: string[] }[] = [
    { label: "Haldi · Spring", bride: "#F2C14E", groom: "#F6EFE2", safa: "#F2A33A", decor: ["#F2A33A", "#7FA650", "#FFF6DA"] },
    { label: "Wedding · Fall", bride: "#B3131B", groom: "#F6EFE2", safa: "#B3131B", decor: ["#8C1C24", "#C9A24B", "#FBEFE0"] },
    { label: "Reception · Winter", bride: "#F4B6C2", groom: "#1E2A44", safa: "#F4B6C2", decor: ["#D7B7C0", "#FFFFFF", "#F4ECEF"] },
  ];
  return (
    <Frame bg="bg-[#fbf3ea]">
      <div className="absolute inset-0 grid grid-cols-3 items-center gap-2 px-3 sm:gap-3 sm:px-4">
        {looks.map((l, i) => (
          <figure key={l.label} className={`overflow-hidden rounded-xl bg-white shadow-md ${i === 1 ? "scale-105 ring-2 ring-kumkum" : ""}`}>
            <CoupleScene className="h-auto w-full" bride={l.bride} groom={l.groom} safa={l.safa} decor={l.decor} confetti={i === 1} />
            <figcaption className="px-1.5 py-1 text-center text-[10px] font-semibold text-ink sm:text-xs">{l.label}</figcaption>
            <div className="flex h-1.5" aria-hidden="true">
              {l.decor.map((c) => (
                <span key={c} className="flex-1" style={{ background: c }} />
              ))}
            </div>
          </figure>
        ))}
      </div>
    </Frame>
  );
}

/** Bride's color sets the groom's and the family's. */
function MatcherArt() {
  const row: { who: string; el: React.ReactNode; colors: string[] }[] = [
    { who: "Bride", el: <Bride outfit="#B3131B" dupatta="#C2185B" className="h-full w-auto" />, colors: ["#B3131B", "#C9A24B"] },
    { who: "Groom", el: <Groom outfit="#F6EFE2" safa="#B3131B" stole="#B3131B" className="h-full w-auto" />, colors: ["#F6EFE2", "#B3131B"] },
    { who: "Family", el: <Family a="#C2185B" b="#F2C14E" className="h-full w-auto" />, colors: ["#C2185B", "#F2C14E"] },
  ];
  return (
    <Frame bg="bg-[radial-gradient(circle_at_50%_30%,#fff8ee,#f6e3d6)]">
      <div className="absolute inset-0 flex items-end justify-center gap-4 px-4 pb-3 sm:gap-8">
        {row.map((r, i) => (
          <div key={r.who} className="flex h-[92%] flex-col items-center">
            <div className={i === 2 ? "h-[66%] pt-2" : "h-[78%]"}>{r.el}</div>
            <div className="mt-auto flex gap-1" aria-hidden="true">
              {r.colors.map((c) => (
                <span key={c} className="h-4 w-4 rounded-full ring-1 ring-ink/15" style={{ background: c }} />
              ))}
            </div>
            <span className="mt-1 text-xs font-semibold text-maroon">{r.who}</span>
          </div>
        ))}
      </div>
    </Frame>
  );
}

/** A welcome sign with the couple's hashtag, plus hashtag chips floating around it. */
function HashtagArt() {
  const chips = [
    ["#PriyaWedsArjun", "left-[4%] top-[6%] -rotate-6"],
    ["#ArjunKiPriya", "right-[4%] top-[7%] rotate-6"],
    ["#PriyArjun", "left-[6%] bottom-[6%] rotate-3"],
    ["#MehndiWithPriya", "right-[4%] bottom-[7%] -rotate-3"],
  ];
  return (
    <Frame bg="bg-[linear-gradient(160deg,#4a0d1a,#320811)]">
      {chips.map(([t, pos]) => (
        <span key={t} className={`absolute ${pos} hidden rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-kumkum shadow sm:inline-block`}>
          {t}
        </span>
      ))}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex h-[60%] items-center gap-2 rounded-2xl border-2 border-gold bg-[#fff8ee] px-3 shadow-2xl sm:px-5">
          <div className="flex h-[88%] items-end" aria-hidden="true">
            <Groom outfit="#F6EFE2" safa="#B3131B" className="-mr-4 h-[92%] w-auto" />
            <Bride outfit="#B3131B" dupatta="#C2185B" className="h-[92%] w-auto" />
          </div>
          <div className="text-center">
            <p className="text-[10px] text-ink-soft">Welcome to the wedding of</p>
            <p className="font-display text-xl leading-tight text-maroon sm:text-2xl">Priya &amp; Arjun</p>
            <p className="mt-1 text-sm font-semibold text-kumkum">#PriyaKiArjun</p>
          </div>
        </div>
      </div>
    </Frame>
  );
}

/** Three invitation styles fanned out like cards on a table. */
function InviteArt() {
  const cards = [
    { cls: "-rotate-[9deg] translate-x-[38%] translate-y-[4%]", bg: "linear-gradient(160deg,#6D1A36,#3d0a1c)", border: "#C9A24B", font: "Cinzel", ink: "#F6E3B4", sub: "#E2C27A", label: "Royal" },
    { cls: "rotate-[8deg] -translate-x-[38%] translate-y-[4%]", bg: "linear-gradient(160deg,#C9B6FF,#FF9AD5 55%,#9EF0FF)", border: "#ffffff", font: "Unbounded", ink: "#2B1650", sub: "#E0388B", label: "Gen Z" },
    { cls: "z-10", bg: "radial-gradient(circle at 50% 30%,#fffdf7,#f4ecdd)", border: "#C9A24B", font: "Great Vibes", ink: "#5B3440", sub: "#B5677A", label: "Watercolor" },
  ];
  return (
    <Frame bg="bg-[radial-gradient(circle_at_50%_40%,#fff8ee,#f1dccb)]">
      <div className="absolute inset-0 flex items-center justify-center">
        {cards.map((c) => (
          <div
            key={c.label}
            className={`absolute flex h-[82%] aspect-[3/4] flex-col items-center justify-center rounded-lg border-2 p-2 text-center shadow-xl ${c.cls}`}
            style={{ background: c.bg, borderColor: c.border }}
          >
            {c.label === "Watercolor" ? (
              <>
                <span className="absolute left-1 top-1 h-8 w-8 rounded-full bg-[#F4C6CF] opacity-80 blur-[2px]" />
                <span className="absolute bottom-2 right-1 h-10 w-10 rounded-full bg-[#9DB89A] opacity-70 blur-[3px]" />
              </>
            ) : null}
            <span className="relative text-[9px] italic" style={{ color: c.sub }}>
              Together with their families
            </span>
            <span className="relative leading-none" style={{ fontFamily: `"${c.font}"`, color: c.ink, fontSize: c.font === "Great Vibes" ? "2rem" : c.font === "Unbounded" ? "0.95rem" : "1.15rem" }}>
              Priya
              <br />
              <span style={{ color: c.sub }}>&amp;</span>
              <br />
              Arjun
            </span>
            <span className="relative mt-1 text-[9px] font-semibold" style={{ color: c.ink }}>
              February 14, 2027
            </span>
          </div>
        ))}
      </div>
    </Frame>
  );
}
