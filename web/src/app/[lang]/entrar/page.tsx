import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { site } from "@/config/site";
import { localePath, type Dictionary, type Locale } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { safeNext } from "@/lib/safe-next";
import { LoginForm } from "./login-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return { title: t.auth.title, robots: { index: false } };
}

async function LoginPanel({
  searchParams,
  lang,
  t,
}: {
  searchParams: PageProps<"/[lang]/entrar">["searchParams"];
  lang: Locale;
  t: Dictionary["auth"];
}) {
  const params = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const next = safeNext(one(params.next), `/${lang}`);
  return <LoginForm lang={lang} next={next} initialError={one(params.erro)} t={t} />;
}

export default async function LoginPage({ searchParams }: PageProps<"/[lang]/entrar">) {
  const lang = await getLocale();
  const t = await getDictionary();

  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b border-line">
        <div className="mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-8 lg:px-14">
          <Link href={localePath(lang, "/")} className="flex items-baseline gap-2">
            <span className="font-display text-2xl font-bold">{site.name}</span>
            <span className="size-2 rounded-full bg-accent" aria-hidden />
          </Link>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-5xl flex-1 items-center gap-10 px-4 py-12 sm:px-8 md:grid-cols-2 md:gap-16">
        <div>
          <p className="flex items-center gap-3 text-xs font-semibold tracking-[0.25em] text-muted uppercase">
            <span className="h-px w-8 bg-accent" />
            {t.auth.title}
          </p>
          <h1 className="mt-4 font-display text-4xl leading-[1.1] font-bold sm:text-5xl">{t.auth.headline}</h1>
          <p className="mt-4 max-w-md leading-relaxed text-text/85">{t.auth.lede}</p>
        </div>

        <Suspense
          fallback={
            <div className="flex flex-col gap-4">
              <Skeleton className="h-16" />
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
            </div>
          }
        >
          <LoginPanel searchParams={searchParams} lang={lang} t={t.auth} />
        </Suspense>
      </main>
    </div>
  );
}
