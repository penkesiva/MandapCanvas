"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AccountMenu } from "./AccountMenu";
import { SignupNudge } from "./SignupNudge";
import type { FOUNDING_OFFER } from "@/lib/config";

type Me = { user: { label: string; email: string; admin: boolean } | null; drafts: number };

// Shared across the header islands and kept between page switches, so the header never flashes.
let cached: Me | null = null;
let inflight: Promise<Me> | null = null;
const listeners = new Set<(m: Me) => void>();

function refresh(): Promise<Me> {
  if (!inflight) {
    inflight = fetch("/api/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => ({ user: d.user ?? null, drafts: Number(d.drafts) || 0 }))
      .catch(() => cached ?? { user: null, drafts: 0 })
      .then((m) => {
        cached = m;
        inflight = null;
        listeners.forEach((l) => l(m));
        return m;
      });
  }
  return inflight;
}

/** Signed-in state for client components: the last known value at once, refreshed in the background. */
export function useMe(): Me | null {
  const [me, setMe] = useState<Me | null>(cached);
  useEffect(() => {
    listeners.add(setMe);
    refresh();
    return () => {
      listeners.delete(setMe);
    };
  }, []);
  return me;
}

/** Right side of the header: Sign in, the Try free button and the account menu. */
export function HeaderAccount() {
  const me = useMe();
  const user = me?.user ?? null;
  return (
    <div className="ml-auto flex items-center gap-3">
      {me && !user ? (
        <Link href="/signin" className="hidden text-[0.95rem] font-medium text-ink-soft hover:text-ink sm:inline">
          Sign in
        </Link>
      ) : null}
      <Link href="/looks" className={`btn btn-primary btn-sm ${user ? "max-sm:hidden" : ""}`}>
        <span className="sm:hidden">Try free</span>
        <span className="hidden sm:inline">Try your look free</span>
      </Link>
      {user ? <AccountMenu label={user.label} email={user.email} drafts={me?.drafts ?? 0} admin={user.admin} /> : null}
    </div>
  );
}

export function MobileSignIn() {
  const me = useMe();
  return me && !me.user ? <Link href="/signin">Sign in</Link> : null;
}

export function HeaderNudge({ offer }: { offer: typeof FOUNDING_OFFER }) {
  const me = useMe();
  // Wait until we know, so signed-in people never see the sign-up nudge.
  return me ? <SignupNudge signedIn={!!me.user} offer={offer} /> : null;
}
