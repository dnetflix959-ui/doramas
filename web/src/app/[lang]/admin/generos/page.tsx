import type { Metadata } from "next";
import { Button, ButtonLink } from "@/components/ui/button";
import { localePath } from "@/i18n/config";
import { getLocale } from "@/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { deleteGenre } from "./actions";

export const metadata: Metadata = { title: "Gêneros · Admin", robots: { index: false } };

export default async function GenresPage({ searchParams }: PageProps<"/[lang]/admin/generos">) {
  const lang = await getLocale();
  const sp = await searchParams;
  const erro = Array.isArray(sp.erro) ? sp.erro[0] : sp.erro;

  const supabase = await createClient();
  const { data: genres } = await supabase.from("genres").select("id, slug, name_pt").order("name_pt");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold">Gêneros</h1>
        <ButtonLink href={`${localePath(lang, "/admin/generos")}/novo`}>Novo gênero</ButtonLink>
      </div>

      {erro === "genero-em-uso" ? (
        <p role="alert" className="border-l-2 border-seal bg-surface px-4 py-3 text-sm">
          Esse gênero está em uso por algum título — remova a associação antes de apagar.
        </p>
      ) : null}

      {!genres || genres.length === 0 ? (
        <p className="text-muted">Nenhum gênero cadastrado ainda.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {genres.map((genre) => (
            <li key={genre.id} className="flex items-center justify-between border border-line bg-surface px-4 py-3">
              <a href={`${localePath(lang, "/admin/generos")}/${genre.id}`} className="font-semibold hover:text-accent">
                {genre.name_pt}
              </a>
              <form action={deleteGenre}>
                <input type="hidden" name="lang" value={lang} />
                <input type="hidden" name="genre_id" value={genre.id} />
                <Button type="submit" variant="ghost">
                  Apagar
                </Button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
