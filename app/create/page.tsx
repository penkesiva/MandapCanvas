import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageShell } from "@/components/SiteChrome";
import { CreateWizard } from "@/components/create/CreateWizard";
import { currentUser } from "@/lib/auth";
import { getCredits } from "@/lib/albums";
import { isOurImageUrl, parsePackId } from "@/lib/validate";
import type { EventId } from "@/lib/types";
import { DECOR_PRESETS, EVENTS, PALETTES } from "@/lib/catalog";

export const metadata: Metadata = {
  alternates: { canonical: "/create" },
  title: "Create your album",
  description: "Sketch, upload or pick a style and see a free photo-real preview of your Desi wedding decor.",
};

export default async function CreatePage(props: { searchParams: Promise<{ pack?: string; mode?: string; style?: string; palette?: string; ref?: string; event?: string }> }) {
  const sp = await props.searchParams;
  const user = await currentUser();
  const mode = sp.mode === "proposal" ? "proposal" : "couple";
  if (mode === "proposal" && !user) redirect("/signin?next=/create?mode=proposal");
  if (mode === "proposal" && !user?.plan) redirect("/pro");
  const style = DECOR_PRESETS.some((p) => p.id === sp.style) ? sp.style : undefined;
  const palette = PALETTES.some((p) => p.id === sp.palette) ? sp.palette : undefined;
  // A decorated venue from the free visualizer becomes the design for that event.
  const ref = typeof sp.ref === "string" && isOurImageUrl(sp.ref) && sp.ref.includes("/venues/") ? sp.ref : undefined;
  const refEvent = ref ? ((sp.event && sp.event in EVENTS ? sp.event : "ceremony") as EventId) : undefined;
  const credits = user ? await getCredits(user.id) : 0;
  return (
    <PageShell>
      <CreateWizard initialPack={parsePackId(sp.pack) ?? "signature"} initialStyle={style} initialPalette={palette} initialRef={ref && refEvent ? { event: refEvent, url: ref } : undefined} mode={mode} credits={credits} plan={user?.plan ?? null} inventory={user?.plan === "studio" ? user.inventory ?? [] : []} />
    </PageShell>
  );
}
