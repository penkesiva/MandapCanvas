import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageShell } from "@/components/SiteChrome";
import { CreateWizard } from "@/components/create/CreateWizard";
import { currentUser } from "@/lib/auth";
import { getCredits } from "@/lib/albums";
import { parsePackId } from "@/lib/validate";
import { DECOR_PRESETS, PALETTES } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Create your album",
  description: "Sketch, upload or pick a style and see a free photo-real preview of your Desi wedding decor.",
};

export default async function CreatePage(props: { searchParams: Promise<{ pack?: string; mode?: string; style?: string; palette?: string }> }) {
  const sp = await props.searchParams;
  const user = await currentUser();
  const mode = sp.mode === "proposal" ? "proposal" : "couple";
  if (mode === "proposal" && !user) redirect("/signin?next=/create?mode=proposal");
  if (mode === "proposal" && !user?.plan) redirect("/pro");
  const style = DECOR_PRESETS.some((p) => p.id === sp.style) ? sp.style : undefined;
  const palette = PALETTES.some((p) => p.id === sp.palette) ? sp.palette : undefined;
  const credits = user ? await getCredits(user.id) : 0;
  return (
    <PageShell>
      <CreateWizard initialPack={parsePackId(sp.pack) ?? "signature"} initialStyle={style} initialPalette={palette} mode={mode} credits={credits} plan={user?.plan ?? null} inventory={user?.plan === "studio" ? user.inventory ?? [] : []} />
    </PageShell>
  );
}
