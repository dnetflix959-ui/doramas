import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { UserRound } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button, ButtonLink } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { localePath, type Dictionary, type Locale } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "../entrar/actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return { title: t.account.title, robots: { index: false } };
}

async function AccountDetails({ lang, t }: { lang: Locale; t: Dictionary["account"] }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // O proxy já protege a rota; isto cobre o caso de a sessão expirar no meio do caminho.
  if (!user) redirect(`${localePath(lang, "/entrar")}?next=${encodeURIComponent(localePath(lang, "/conta"))}`);

  const { data: profiles } = await supabase
    .from("viewer_profiles")
    .select("id, name")
    .order("created_at", { ascending: true });

  const { data: isAdmin } = await supabase.rpc("is_admin");

  return (
    <div className="flex flex-col gap-10">
      <section>
        <h2 className="text-sm font-semibold tracking-[0.2em] text-muted uppercase">{t.email}</h2>
        <p className="mt-2 text-lg">{user.email}</p>
      </section>

      {isAdmin ? (
        <section>
          <ButtonLink href={`${localePath(lang, "/admin/titulos")}`} variant="secondary">
            Painel admin
          </ButtonLink>
        </section>
      ) : null}

      <section>
        <h2 className="text-sm font-semibold tracking-[0.2em] text-muted uppercase">{t.profiles}</h2>
        <ul className="mt-3 flex flex-wrap gap-3">
          {(profiles ?? []).map((p) => (
            <li key={p.id} className="flex items-center gap-3 border border-line bg-surface px-4 py-3">
              <span className="flex size-9 items-center justify-center rounded-full bg-accent text-accent-ink">
                <UserRound className="size-5" strokeWidth={1.75} />
              </span>
              <span className="font-semibold">{p.name}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-muted">{t.profilesNote}</p>
      </section>

      <section>
        <h2 className="text-sm font-semibold tracking-[0.2em] text-muted uppercase">{t.subscription}</h2>
        <p className="mt-2 text-text/85">{t.noSubscription}</p>
      </section>

      <form action={signOut}>
        <input type="hidden" name="lang" value={lang} />
        <Button type="submit" variant="ghost">
          {t.signOut}
        </Button>
      </form>
    </div>
  );
}

export default async function AccountPage() {
  const lang = await getLocale();
  const t = await getDictionary();

  return (
    <AppShell locale={lang} nav={t.nav} footer={t.footer}>
      <div className="mx-auto w-full max-w-3xl px-4 pt-24 pb-16 sm:px-8">
        <h1 className="font-display text-4xl font-bold">{t.account.title}</h1>
        <div className="mt-8">
          <Suspense
            fallback={
              <div className="flex flex-col gap-4" aria-label={t.account.loading}>
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-10 w-40" />
              </div>
            }
          >
            <AccountDetails lang={lang} t={t.account} />
          </Suspense>
        </div>
      </div>
    </AppShell>
  );
}
