import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Player } from "@/components/player/player";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Assistir (teste) · Admin", robots: { index: false } };

export default async function WatchMovieTestPage({ params }: PageProps<"/[lang]/admin/titulos/[id]/assistir">) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: episode } = await supabase.from("episodes").select("id").eq("title_id", id).maybeSingle();
  if (!episode) notFound();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-2xl font-bold">Assistir (teste)</h1>
      <p className="text-sm text-muted">
        Usa `/api/play` como um assinante usaria — sujeito às mesmas regras de acesso (story 3.1).
      </p>
      <Player episodeId={episode.id} />
    </div>
  );
}
