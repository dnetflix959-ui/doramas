import type { Metadata } from "next";
import { getLocale } from "@/i18n/dictionaries";
import { TitleForm } from "../title-form";

export const metadata: Metadata = { title: "Novo título · Admin", robots: { index: false } };

export default async function NewTitlePage() {
  const lang = await getLocale();
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl font-bold">Novo título</h1>
      <TitleForm lang={lang} />
    </div>
  );
}
