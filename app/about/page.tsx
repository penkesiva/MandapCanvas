import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/SiteChrome";

export const metadata: Metadata = { title: "About" };

export default function About() {
  return (
    <PageShell>
      <div className="mx-auto max-w-2xl px-4 pb-24 pt-12 sm:px-6">
        <h1 className="text-[2.6rem]">About MandapCanvas</h1>
        <div className="mt-6 space-y-4 text-lg text-ink-soft">
          <p>
            Desi weddings in the U.S. are planned across group chats, Pinterest boards and three time zones of family opinions. Everyone
            imagines the mandap differently until the day it&apos;s built.
          </p>
          <p>
            MandapCanvas makes the picture shared early: start from a sketch, a photo or a style, and see your decor, outfits and colors
            together for every event — Haldi to reception — before you book anything.
          </p>
          <p>
            We built it in the San Francisco Bay Area for couples, families and the decorators who make these weddings real. Every image is
            an AI concept preview, made to help you decide, not to replace the artisans who build the real thing.
          </p>
        </div>
        <Link href="/create" className="btn btn-primary mt-10">Make a free preview</Link>
      </div>
    </PageShell>
  );
}
