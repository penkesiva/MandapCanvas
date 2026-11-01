import Link from "next/link";
import { ALBUM_PACKS, LOOK_PACKS, PACKS, formatUSD, type PackId } from "@/lib/config";

export function PricingCards({ product = "mandap" }: { product?: "mandap" | "looks" }) {
  const ids: PackId[] = product === "looks" ? LOOK_PACKS : ALBUM_PACKS;
  const unit = product === "looks" ? "portraits" : "images";
  return (
    <div className={`grid gap-5 ${product === "looks" ? "mx-auto max-w-3xl md:grid-cols-2" : "md:grid-cols-3"}`}>
      {ids.map((id) => {
        const p = PACKS[id];
        return (
          <div
            key={id}
            className={`relative flex flex-col rounded-[24px] p-6 sm:p-7 ${
              p.highlight
                ? "bg-white shadow-[0_30px_60px_-30px_rgba(74,13,26,0.6),inset_0_0_0_2px_#b8923a,inset_0_0_0_6px_#fff,inset_0_0_0_7px_rgba(184,146,58,0.5)] md:-my-3 md:py-10"
                : "bg-silk shadow-[inset_0_0_0_1px_rgba(184,146,58,0.45),0_20px_40px_-34px_rgba(74,13,26,0.5)]"
            }`}
          >
            {p.highlight ? (
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-maroon px-4 py-1 text-xs font-semibold text-gold-light shadow-[inset_0_0_0_1px_#ecd08a]">
                {product === "looks" ? "Most popular" : "Most couples choose this"}
              </span>
            ) : null}
            <h3 className="text-[1.9rem] text-maroon">{product === "looks" ? `${p.images} portraits` : p.name}</h3>
            <p className="mt-1 text-ink-soft">{p.blurb}</p>
            <p className="mt-5 flex items-baseline gap-2">
              {p.listCents ? <s className="text-xl text-ink-soft">{formatUSD(p.listCents)}</s> : null}
              <span className="font-display text-5xl text-kumkum">{formatUSD(p.priceCents)}</span>
              <span className="text-sm text-ink-soft">
                one time, {p.images} {unit}
              </span>
            </p>
            <p className="mt-1 text-sm text-ink-soft">
              {p.listCents ? <span className="font-semibold text-mehndi">Launch price. </span> : null}
              About {formatUSD(Math.round(p.priceCents / p.images))} per {product === "looks" ? "portrait" : "image"}
            </p>
            <ul className="mb-7 mt-5 space-y-2 text-[0.97rem]">
              {p.includes.map((i) => (
                <li key={i} className="flex gap-2.5">
                  <span className="mt-2.5 h-1.5 w-1.5 flex-none rotate-45 bg-gold" aria-hidden="true" />
                  {i}
                </li>
              ))}
              <li className="flex gap-2.5">
                <span className="mt-2.5 h-1.5 w-1.5 flex-none rotate-45 bg-gold" aria-hidden="true" />
                {p.freeRegens} free {product === "looks" ? "redos" : "new versions"}
              </li>
            </ul>
            <Link href={product === "looks" ? "/looks" : `/create?pack=${id}`} className={`btn mt-auto ${p.highlight ? "btn-primary" : "btn-ghost"}`}>
              {product === "looks" ? "Try your look free first" : "Start with a free preview"}
            </Link>
          </div>
        );
      })}
    </div>
  );
}
