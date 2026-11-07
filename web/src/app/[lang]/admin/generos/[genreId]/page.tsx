import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale } from "@/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { GenreForm } from "../genre-form";

export const metadata: Metadata = { title: "Editar gênero · Admin", robots: { index: false } };

export default async function EditGenrePage({ params }: PageProps<"/[lang]/admin/generos/[genreId]">) {
  const lang = await getLocale();
  const { genreId } = await params;

  const supabase = await createClient();
  const { data: genre } = await supabase
    .from("genres")
    .select("id, slug, name_pt")
    .eq("id", genreId)
    .maybeSingle();
  if (!genre) notFound();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl font-bold">Editar gênero</h1>
      <GenreForm lang={lang} genre={genre} />
    </div>
  );
}
