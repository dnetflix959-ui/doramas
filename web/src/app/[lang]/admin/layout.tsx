import Link from "next/link";
import type { Metadata } from "next";
import { localePath } from "@/i18n/config";
import { getLocale } from "@/i18n/dictionaries";
import { requireAdmin } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

// Painel do admin: ferramenta interna do Gustavo, por isso o texto fica só em português,
// mesmo com a rota levando o prefixo de idioma do visitante (exigido pelo proxy).
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const lang = await getLocale();
  await requireAdmin(lang);

  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b border-line">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-8 px-4 sm:px-8">
          <Link href={localePath(lang, "/admin/titulos")} className="font-display text-xl font-bold">
            Admin
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link href={localePath(lang, "/admin/titulos")} className="text-text hover:text-accent">
              Títulos
            </Link>
            <Link href={localePath(lang, "/admin/generos")} className="text-text hover:text-accent">
              Gêneros
            </Link>
          </nav>
          <Link href={localePath(lang, "/")} className="ml-auto text-sm text-muted hover:text-text">
            Voltar ao site
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-8">{children}</main>
    </div>
  );
}
