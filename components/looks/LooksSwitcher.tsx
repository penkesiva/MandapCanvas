"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { PRODUCTS, fromPrice, type ProductPath } from "@/lib/products";

/**
 * All six products as compact picture tiles, so visitors on any product page see everything MandapCanvas makes.
 * One row on wide screens, a swipeable strip on phones.
 */
export function LooksSwitcher({ current }: { current: ProductPath }) {
  const list = useRef<HTMLUListElement>(null);
  // On phones the strip scrolls sideways: bring "You're here" into view without moving the page.
  useEffect(() => {
    const ul = list.current;
    const on = ul?.querySelector<HTMLElement>('[aria-current="page"]')?.parentElement;
    if (!ul || !on || ul.scrollWidth <= ul.clientWidth) return;
    ul.scrollLeft = on.offsetLeft - ul.offsetLeft - 16;
  }, [current]);
  return (
    <nav aria-label="Everything you can make">
      <ul ref={list} className="-mx-4 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:-mx-6 sm:px-6 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0 xl:grid-cols-6 [&::-webkit-scrollbar]:hidden">
        {PRODUCTS.map((p) => {
          const on = p.href === current;
          return (
            <li key={p.href} className="w-[40%] max-w-[200px] flex-none snap-start sm:w-[30%] md:w-auto md:max-w-none">
              <Link
                href={p.href}
                aria-current={on ? "page" : undefined}
                className={`group relative block h-36 overflow-hidden rounded-[18px] bg-[#2a0b14] transition ${
                  on ? "ring-[3px] ring-gold" : "ring-1 ring-black/5 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_-18px_rgba(42,11,20,0.8)]"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.img} alt="" className="absolute inset-0 h-full w-full object-cover object-[50%_20%] transition duration-500 group-hover:scale-[1.04]" loading="lazy" />
                <span className="absolute inset-0 bg-[linear-gradient(180deg,rgba(42,11,20,0)_30%,rgba(42,11,20,0.92)_100%)]" aria-hidden="true" />
                <span className="absolute inset-x-0 bottom-0 flex flex-col gap-1 p-3">
                  <span className="font-display text-[1.15rem] leading-tight text-[#fff8ef]">{p.short}</span>
                  <span className="w-max rounded-full bg-[linear-gradient(#f2d98c,#c9a24b)] px-2 py-0.5 text-[11px] font-semibold text-[#3b0a15]">Try free · from {fromPrice(p)}</span>
                </span>
                {on ? (
                  <span className="absolute left-2.5 top-2.5 rounded-full bg-gold px-2 py-0.5 text-[10px] font-semibold leading-tight text-maroon-deep">You&apos;re here</span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
