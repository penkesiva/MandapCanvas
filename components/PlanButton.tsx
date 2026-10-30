"use client";

import { readJson } from "@/lib/readJson";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { track } from "@vercel/analytics";
import { Loader2 } from "lucide-react";
import type { PlanId } from "@/lib/config";

export function PlanButton({ planId, interval, signedIn, current, primary }: { planId: PlanId; interval: "month" | "year"; signedIn: boolean; current: boolean; primary?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (current) return <span className="btn btn-ghost mt-7 cursor-default">Your current plan</span>;
  const go = async () => {
    if (!signedIn) return router.push(`/signin?next=/pro`);
    setBusy(true);
    setError(null);
    track("plan_checkout_started", { planId, interval });
    const res = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "plan", planId, interval }) });
    const data = await readJson(res);
    if (!res.ok || !data.ok) {
      setBusy(false);
      return setError(data.error || "Checkout failed.");
    }
    window.location.href = data.url;
  };
  return (
    <div className="mt-7">
      <button type="button" className={`btn w-full ${primary ? "btn-primary" : "btn-ghost"}`} onClick={go} disabled={busy}>
        {busy ? <Loader2 size={18} className="animate-spin" /> : null}
        {signedIn ? "Start" : "Sign in to start"}
      </button>
      {error ? <p className="mt-2 text-sm text-kumkum-deep">{error}</p> : null}
    </div>
  );
}
