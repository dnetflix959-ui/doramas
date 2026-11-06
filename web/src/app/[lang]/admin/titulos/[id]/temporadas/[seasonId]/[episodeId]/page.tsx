import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale } from "@/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { EpisodeForm } from "../../../../episode-form";

export const metadata: Metadata = { title: "Editar episódio · Admin", robots: { index: false } };

export default async function EditEpisodePage({
  params,
}: PageProps<"/[lang]/admin/titulos/[id]/temporadas/[seasonId]/[episodeId]">) {
  const lang = await getLocale();
  const { id, seasonId, episodeId } = await params;

  const supabase = await createClient();
  const { data: episode } = await supabase
    .from("episodes")
    .select("id, number, video_ref, duration_s, intro_start_s, intro_end_s, credits_start_s, release_at, is_free, status")
    .eq("id", episodeId)
    .eq("season_id", seasonId)
    .maybeSingle();
  if (!episode) notFound();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl font-bold">Editar episódio {episode.number}</h1>
      <EpisodeForm lang={lang} titleId={id} parent={{ kind: "season", seasonId }} episode={episode} />
    </div>
  );
}
