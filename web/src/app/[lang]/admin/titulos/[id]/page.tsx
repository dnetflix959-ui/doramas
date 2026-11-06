import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { localePath } from "@/i18n/config";
import { getLocale } from "@/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { createSeason, deleteSeason } from "../actions";
import { EpisodeForm, type EpisodeData } from "../episode-form";
import { TitleForm } from "../title-form";

export const metadata: Metadata = { title: "Editar título · Admin", robots: { index: false } };

export default async function EditTitlePage({ params, searchParams }: PageProps<"/[lang]/admin/titulos/[id]">) {
  const lang = await getLocale();
  const { id } = await params;
  const sp = await searchParams;
  const erro = Array.isArray(sp.erro) ? sp.erro[0] : sp.erro;

  const supabase = await createClient();
  const { data: title } = await supabase
    .from("titles")
    .select("id, kind, slug, status, featured, release_at")
    .eq("id", id)
    .maybeSingle();

  if (!title) notFound();

  const { data: translations } = await supabase
    .from("title_translations")
    .select("locale, name, synopsis")
    .eq("title_id", id);

  const { data: seasons } =
    title.kind === "series"
      ? await supabase.from("seasons").select("id, number").eq("title_id", id).order("number")
      : { data: null };

  const { data: movieEpisode } =
    title.kind === "movie"
      ? await supabase
          .from("episodes")
          .select(
            "id, number, video_ref, duration_s, intro_start_s, intro_end_s, credits_start_s, release_at, is_free, status",
          )
          .eq("title_id", id)
          .maybeSingle()
      : { data: null };

  return (
    <div className="flex flex-col gap-10">
      <h1 className="font-display text-3xl font-bold">Editar título</h1>
      <TitleForm
        lang={lang}
        title={title as { id: string; kind: "series" | "movie"; slug: string; status: string; featured: boolean; release_at: string | null }}
        translations={translations ?? undefined}
      />

      {title.kind === "series" ? (
        <section className="flex flex-col gap-4 border-t border-line pt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-[0.2em] text-muted uppercase">Temporadas</h2>
            <form action={createSeason}>
              <input type="hidden" name="lang" value={lang} />
              <input type="hidden" name="title_id" value={id} />
              <Button type="submit" variant="ghost">
                Nova temporada
              </Button>
            </form>
          </div>

          {erro === "temporada-com-episodios" ? (
            <p role="alert" className="border-l-2 border-seal bg-surface px-4 py-3 text-sm">
              Essa temporada tem episódios — apague os episódios antes de apagar a temporada.
            </p>
          ) : null}

          {!seasons || seasons.length === 0 ? (
            <p className="text-muted">Nenhuma temporada ainda.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {seasons.map((season) => (
                <li
                  key={season.id}
                  className="flex items-center justify-between border border-line bg-surface px-4 py-3"
                >
                  <a
                    href={`${localePath(lang, "/admin/titulos")}/${id}/temporadas/${season.id}`}
                    className="font-semibold hover:text-accent"
                  >
                    Temporada {season.number}
                  </a>
                  <form action={deleteSeason}>
                    <input type="hidden" name="lang" value={lang} />
                    <input type="hidden" name="title_id" value={id} />
                    <input type="hidden" name="season_id" value={season.id} />
                    <Button type="submit" variant="ghost" size="md">
                      Apagar
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : (
        <section className="flex flex-col gap-4 border-t border-line pt-8">
          <h2 className="text-sm font-semibold tracking-[0.2em] text-muted uppercase">Vídeo</h2>
          <EpisodeForm
            lang={lang}
            titleId={id}
            parent={{ kind: "movie" }}
            episode={(movieEpisode as EpisodeData | null) ?? undefined}
          />
        </section>
      )}
    </div>
  );
}
