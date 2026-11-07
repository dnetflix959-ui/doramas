"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Locale } from "@/i18n/config";
import { saveEpisodeTranslations, saveSubtitle, type SubtitleFormState, type TranslationFormState } from "./episode-content-actions";

function UploadButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="md" variant="ghost" disabled={pending}>
      {pending ? "Enviando…" : "Enviar"}
    </Button>
  );
}

/** Upload de legenda (.vtt) em português. */
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
  const [state, formAction] = useActionState<SubtitleFormState, FormData>(saveSubtitle, { status: "idle" });
  const hasSubtitle = existingLocales.includes("pt");

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="lang" value={lang} />
      <input type="hidden" name="return_to" value={returnTo} />
      <input type="hidden" name="episode_id" value={episodeId} />
      <input type="hidden" name="locale" value="pt" />
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-text">Legenda (.vtt)</span>
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
  const ptTranslation = translations.find((t) => t.locale === "pt");

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="lang" value={lang} />
      <input type="hidden" name="return_to" value={returnTo} />
      <input type="hidden" name="episode_id" value={episodeId} />

      {state.status === "error" ? (
        <p role="alert" className="border-l-2 border-seal bg-surface px-4 py-3 text-sm">
          {state.message}
        </p>
      ) : null}
      {state.status === "saved" ? <p className="text-sm text-muted">Tradução salva.</p> : null}

      <Input label="Título do episódio" name="title_pt" defaultValue={ptTranslation?.title ?? ""} />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="ep_synopsis_pt" className="text-sm font-medium text-text">
          Sinopse
        </label>
        <textarea
          id="ep_synopsis_pt"
          name="synopsis_pt"
          rows={2}
          defaultValue={ptTranslation?.synopsis ?? ""}
          className="rounded-md border border-line bg-surface-2 px-3 py-2 text-base text-text placeholder:text-muted"
        />
      </div>

      <SaveButton />
    </form>
  );
}
