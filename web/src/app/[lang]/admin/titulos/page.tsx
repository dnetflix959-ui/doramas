import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { localePath } from "@/i18n/config";
import { getLocale } from "@/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Títulos · Admin", robots: { index: false } };

const statusLabel: Record<string, string> = { draft: "Rascunho", scheduled: "Agendado", published: "Publicado" };
const kindLabel: Record<string, string> = { series: "Série", movie: "Filme" };

export default async function AdminTitlesPage() {
  const lang = await getLocale();
  const supabase = await createClient();

  const { data: titles } = await supabase
    .from("titles")
    .select("id, kind, slug, status, featured, title_translations(name, locale)")
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold">Títulos</h1>
        <ButtonLink href={`${localePath(lang, "/admin/titulos")}/novo`}>Novo título</ButtonLink>
      </div>

      {!titles || titles.length === 0 ? (
        <p className="text-muted">Nenhum título cadastrado ainda.</p>
      ) : (
        <div className="overflow-x-auto border border-line">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-line bg-surface text-xs tracking-[0.15em] text-muted uppercase">
              <tr>
                <th className="px-4 py-3 font-semibold">Nome (pt)</th>
                <th className="px-4 py-3 font-semibold">Tipo</th>
                <th className="px-4 py-3 font-semibold">Link</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Destaque</th>
              </tr>
            </thead>
            <tbody>
              {titles.map((title) => {
                const ptName =
                  (title.title_translations as { name: string; locale: string }[] | null)?.find(
                    (t) => t.locale === "pt",
                  )?.name ?? "(sem tradução)";
                return (
                  <tr key={title.id} className="border-b border-line last:border-0 hover:bg-surface">
                    <td className="px-4 py-3">
                      <a href={`${localePath(lang, "/admin/titulos")}/${title.id}`} className="font-semibold hover:text-accent">
                        {ptName}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-muted">{kindLabel[title.kind] ?? title.kind}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted">{title.slug}</td>
                    <td className="px-4 py-3">
                      <Badge tone={title.status === "published" ? "accent" : "outline"}>
                        {statusLabel[title.status] ?? title.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">{title.featured ? "★" : ""}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
