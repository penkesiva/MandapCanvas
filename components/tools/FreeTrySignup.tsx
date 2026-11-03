"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { engage as track } from "@/lib/engage";

/** "One more free try" card: email in, magic link out, and the link brings them back to the tool. */
export function FreeTrySignup({ id, next, source, title, text, cta }: { id?: string; next: string; source: string; title: string; text: string; cta: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [msg, setMsg] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    try {
      const res = await fetch("/api/auth/request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, next, source }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Couldn't send the email.");
      setState("sent");
      track(`tool_${source}_signup`);
      if (data.devLink) console.log("[dev] sign-in link:", data.devLink);
    } catch (err) {
      setState("error");
      setMsg(err instanceof Error ? err.message : "Couldn't send the email.");
    }
  }
  return (
    <div id={id} className="mt-4 rounded-[22px] bg-maroon p-5 text-[#fff8ef]">
      <p className="font-display text-xl text-gold-light">{title}</p>
      {state === "sent" ? (
        <p className="mt-2 flex gap-2 text-sm">
          <Check size={18} className="flex-none text-gold-light" /> Check your inbox. The link brings you back here with another free try.
        </p>
      ) : (
        <>
          <p className="mt-1 text-sm text-[#f3e3d3]">{text}</p>
          <form onSubmit={submit} className="mt-3 flex flex-col gap-2 sm:flex-row">
            <label htmlFor={`${source}-email`} className="sr-only">
              Email
            </label>
            <input id={`${source}-email`} type="email" required className="field min-w-0 flex-1" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            <button type="submit" className="btn btn-gold btn-sm flex-none" disabled={state === "sending"}>
              {state === "sending" ? "Sending…" : cta}
            </button>
          </form>
          {state === "error" ? <p className="mt-2 text-sm text-gold-light">{msg}</p> : null}
        </>
      )}
    </div>
  );
}
