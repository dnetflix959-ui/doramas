import type { Metadata } from "next";
import { getLocale } from "@/i18n/dictionaries";
import { GenreForm } from "../genre-form";

export const metadata: Metadata = { title: "Novo gênero · Admin", robots: { index: false } };

export default async function NewGenrePage() {
  const lang = await getLocale();
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl font-bold">Novo gênero</h1>
      <GenreForm lang={lang} />
    </div>
  );
}
