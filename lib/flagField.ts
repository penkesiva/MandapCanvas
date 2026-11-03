"use client";

/**
 * Brings a field with a problem into view and nudges it: a short shake plus a soft red glow.
 * Runs after the next paint, so it works right after a state change that renders the field.
 * `target` is an element or a CSS selector, e.g. '[data-field="photo"]'.
 */
export function flagField(target: string | Element | null | undefined) {
  if (typeof window === "undefined" || !target) return;
  const run = () => {
    const el = typeof target === "string" ? document.querySelector(target) : target;
    if (!(el instanceof HTMLElement)) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
    el.classList.remove("mc-flag");
    void el.offsetWidth; // restart the animation
    el.classList.add("mc-flag");
    window.setTimeout(() => el.classList.remove("mc-flag"), 1800);
    const focusable = el.matches("input,select,textarea,button") ? el : el.querySelector<HTMLElement>("input,select,textarea,button");
    focusable?.focus({ preventScroll: true });
  };
  requestAnimationFrame(() => requestAnimationFrame(run));
}

/** Scrolls so `el` sits just below the sticky header, after the next paint. */
export function scrollToTopOf(el: HTMLElement | null, offset = 96) {
  if (typeof window === "undefined" || !el) return;
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      const y = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: Math.max(0, y), behavior: reduce ? "auto" : "smooth" });
    }),
  );
}
