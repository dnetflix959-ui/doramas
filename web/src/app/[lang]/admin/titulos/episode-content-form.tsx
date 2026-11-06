"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { locales, type Locale } from "@/i18n/config";
import { saveEpisodeTranslations, saveSubtitle, type SubtitleFormState, type TranslationFormState } from "./episode-content-actions";

const localeLabel: Record<Locale, string> = { pt: "Português", en: "English", es: "Español" };

function UploadButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="md" variant="ghost" disabled={pending}>
      {pending ? "Enviando…" : "Enviar"}
    </Button>
  );
}

function SubtitleUploadRow({
  lang,
  returnTo,
  episodeId,
  locale,
  hasSubtitle,
}: {
  lang: Locale;
  returnTo: string;
  episodeId: string;
  locale: Locale;
  hasSubtitle: boolean;
}) {
  const [state, formAction] = useActionState<SubtitleFormState, FormData>(saveSubtitle, { status: "idle" });

  return (
    <form action={formAction} className="flex flex-col gap-2 border-l-2 border-line pl-4">
      <input type="hidden" name="lang" value={lang} />
      <input type="hidden" name="return_to" value={returnTo} />
      <input type="hidden" name="episode_id" value={episodeId} />
      <input type="hidden" name="locale" value={locale} />
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-text">{localeLabel[locale]}</span>
          <input type="file" name="file" accept=".vtt" className="text-sm text-muted" />
        </label>
        <UploadButton />
        {hasSubtitle ? <span className="text-xs text-muted">Já tem legenda enviada — enviar de novo substitui.</span> : null}
      </div>
      {state.status === "error" ? (
        <p role="alert" className="text-sm text-seal">
          {state.message}
        </p>
      ) : null}
      {state.status === "saved" ? <p className="text-sm text-muted">Legenda enviada.</p> : null}
    </form>
  );
}

/** Upload de legenda (.vtt) por idioma. Um formulário por idioma, cada um com seu próprio estado. */
export function SubtitleUploadForm({
  lang,
  returnTo,
  episodeId,
  existingLocales,
}: {
  lang: Locale;
  returnTo: string;
  episodeId: string;
  existingLocales: Locale[];
}) {
  return (
    <div className="flex flex-col gap-4">
      {locales.map((locale) => (
        <SubtitleUploadRow
          key={locale}
          lang={lang}
          returnTo={returnTo}
          episodeId={episodeId}
          locale={locale}
          hasSubtitle={existingLocales.includes(locale)}
        />
      ))}
    </div>
  );
}

export type EpisodeTranslation = { locale: Locale; title: string | null; synopsis: string | null };

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Salvando…" : "Salvar tradução"}
    </Button>
  );
}

/** Título/sinopse do episódio por idioma. */
export function EpisodeTranslationForm({
  lang,
  returnTo,
  episodeId,
  translations,
}: {
  lang: Locale;
  returnTo: string;
  episodeId: string;
  translations: EpisodeTranslation[];
}) {
  const [state, formAction] = useActionState<TranslationFormState, FormData>(saveEpisodeTranslations, {
    status: "idle",
  });
  const translationFor = (locale: Locale) => translations.find((t) => t.locale === locale);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="lang" value={lang} />
      <input type="hidden" name="return_to" value={returnTo} />
      <input type="hidden" name="episode_id" value={episodeId} />

      {state.status === "error" ? (
        <p role="alert" className="border-l-2 border-seal bg-surface px-4 py-3 text-sm">
          {state.message}
        </p>
      ) : null}
      {state.status === "saved" ? <p className="text-sm text-muted">Tradução salva.</p> : null}

      {locales.map((locale) => {
        const translation = translationFor(locale);
        return (
          <div key={locale} className="flex flex-col gap-3 border-l-2 border-line pl-4">
            <p className="text-sm font-semibold">{localeLabel[locale]}</p>
            <Input label="Título do episódio" name={`title_${locale}`} defaultValue={translation?.title ?? ""} />
            <div className="flex flex-col gap-1.5">
              <label htmlFor={`ep_synopsis_${locale}`} className="text-sm font-medium text-text">
                Sinopse
              </label>
              <textarea
                id={`ep_synopsis_${locale}`}
                name={`synopsis_${locale}`}
                rows={2}
                defaultValue={translation?.synopsis ?? ""}
                className="rounded-md border border-line bg-surface-2 px-3 py-2 text-base text-text placeholder:text-muted"
              />
            </div>
          </div>
        );
      })}

      <SaveButton />
    </form>
  );
}
