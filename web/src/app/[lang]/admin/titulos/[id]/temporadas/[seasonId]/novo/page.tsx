import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale } from "@/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { EpisodeForm } from "../../../../episode-form";

export const metadata: Metadata = { title: "Novo episódio · Admin", robots: { index: false } };

export default async function NewEpisodePage({
  params,
}: PageProps<"/[lang]/admin/titulos/[id]/temporadas/[seasonId]/novo">) {
  const lang = await getLocale();
  const { id, seasonId } = await params;

  const supabase = await createClient();
  const { data: season } = await supabase
    .from("seasons")
    .select("id")
    .eq("id", seasonId)
    .eq("title_id", id)
    .maybeSingle();
  if (!season) notFound();

  const { data: last } = await supabase
    .from("episodes")
    .select("number")
    .eq("season_id", seasonId)
    .order("number", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl font-bold">Novo episódio</h1>
      <EpisodeForm lang={lang} titleId={id} parent={{ kind: "season", seasonId }} nextNumber={(last?.number ?? 0) + 1} />
    </div>
  );
}
