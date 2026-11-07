import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ButtonLink } from "@/components/ui/button";
import { localePath, type Locale } from "@/i18n/config";
import { getLocale } from "@/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { EpisodeTranslationForm, SubtitleUploadForm } from "../../../../episode-content-form";
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

  const { data: translations } = await supabase
    .from("episode_translations")
    .select("locale, title, synopsis")
    .eq("episode_id", episodeId);
  const { data: subtitles } = await supabase.from("subtitles").select("locale").eq("episode_id", episodeId);

  const returnTo = `${localePath(lang, "/admin/titulos")}/${id}/temporadas/${seasonId}/${episodeId}`;

  return (
    <div className="flex flex-col gap-10">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold">Editar episódio {episode.number}</h1>
        <ButtonLink href={`${returnTo}/assistir`} variant="ghost">
          Assistir (teste)
        </ButtonLink>
      </div>
      <EpisodeForm lang={lang} titleId={id} parent={{ kind: "season", seasonId }} episode={episode} />

      <section className="flex flex-col gap-4 border-t border-line pt-8">
        <h2 className="text-sm font-semibold tracking-[0.2em] text-muted uppercase">Tradução</h2>
        <EpisodeTranslationForm lang={lang} returnTo={returnTo} episodeId={episodeId} translations={translations ?? []} />
      </section>

      <section className="flex flex-col gap-4 border-t border-line pt-8">
        <h2 className="text-sm font-semibold tracking-[0.2em] text-muted uppercase">Legendas (.vtt)</h2>
        <SubtitleUploadForm
          lang={lang}
          returnTo={returnTo}
          episodeId={episodeId}
          existingLocales={(subtitles ?? []).map((s) => s.locale as Locale)}
        />
      </section>
    </div>
  );
}
