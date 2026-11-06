import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { localePath } from "@/i18n/config";
import { getLocale } from "@/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Episódios · Admin", robots: { index: false } };

const statusLabel: Record<string, string> = { draft: "Rascunho", scheduled: "Agendado", published: "Publicado" };

export default async function SeasonEpisodesPage({
  params,
}: PageProps<"/[lang]/admin/titulos/[id]/temporadas/[seasonId]">) {
  const lang = await getLocale();
  const { id, seasonId } = await params;

  const supabase = await createClient();
  const { data: season } = await supabase
    .from("seasons")
    .select("id, number, title_id")
    .eq("id", seasonId)
    .eq("title_id", id)
    .maybeSingle();
  if (!season) notFound();

  const { data: episodes } = await supabase
    .from("episodes")
    .select("id, number, status, duration_s, is_free")
    .eq("season_id", seasonId)
    .order("number");

  const basePath = `${localePath(lang, "/admin/titulos")}/${id}/temporadas/${seasonId}`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold">Temporada {season.number} — Episódios</h1>
        <ButtonLink href={`${basePath}/novo`}>Novo episódio</ButtonLink>
      </div>

      {!episodes || episodes.length === 0 ? (
        <p className="text-muted">Nenhum episódio ainda.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {episodes.map((ep) => (
            <li key={ep.id} className="flex items-center justify-between border border-line bg-surface px-4 py-3">
              <a href={`${basePath}/${ep.id}`} className="font-semibold hover:text-accent">
                Episódio {ep.number}
              </a>
              <div className="flex items-center gap-3 text-sm text-muted">
                {ep.is_free ? <Badge tone="outline">Gratuito</Badge> : null}
                {ep.duration_s ? <span>{Math.round(ep.duration_s / 60)} min</span> : null}
                <Badge tone={ep.status === "published" ? "accent" : "outline"}>
                  {statusLabel[ep.status] ?? ep.status}
                </Badge>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
