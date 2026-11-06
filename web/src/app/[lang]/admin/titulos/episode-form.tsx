"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/i18n/config";
import { datetimeLocalToIso, toDatetimeLocalValue } from "@/lib/datetime-local";
import { saveEpisode, type EpisodeFormState } from "./episode-actions";

export type EpisodeData = {
  id: string;
  number: number;
  video_ref: string;
  duration_s: number | null;
  intro_start_s: number | null;
  intro_end_s: number | null;
  credits_start_s: number | null;
  release_at: string | null;
  is_free: boolean;
  status: string;
};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending}>
      {pending ? "Salvando…" : label}
    </Button>
  );
}

/**
 * Formulário de criar/editar episódio. `parent` é uma temporada (série, com número editável) ou o
 * título de um filme (número fixo em 1, no máximo um episódio — garantido pelo banco desde a story 2.1).
 */
export function EpisodeForm({
  lang,
  titleId,
  parent,
  episode,
  nextNumber,
}: {
  lang: Locale;
  titleId: string;
  parent: { kind: "season"; seasonId: string } | { kind: "movie" };
  episode?: EpisodeData;
  nextNumber?: number;
}) {
  const [state, formAction] = useActionState<EpisodeFormState, FormData>(saveEpisode, { status: "idle" });
  const isEdit = Boolean(episode);

  function withUtcReleaseAt(formData: FormData) {
    const raw = formData.get("release_at");
    formData.set("release_at", datetimeLocalToIso(typeof raw === "string" ? raw : null) ?? "");
    return formAction(formData);
  }

  const fieldError = (field: "video_ref" | "number") => (state.status === "error" ? state.fields?.[field] : undefined);
  const youtubeDefault = episode ? `https://youtu.be/${episode.video_ref}` : "";

  return (
    <form action={withUtcReleaseAt} className="flex flex-col gap-6">
      <input type="hidden" name="lang" value={lang} />
      <input type="hidden" name="title_id" value={titleId} />
      {parent.kind === "season" ? <input type="hidden" name="season_id" value={parent.seasonId} /> : null}
      {episode ? <input type="hidden" name="episode_id" value={episode.id} /> : null}

      {state.status === "error" ? (
        <p role="alert" className="border-l-2 border-seal bg-surface px-4 py-3 text-sm">
          {state.message}
        </p>
      ) : null}

      <Input
        label="Link do YouTube"
        name="youtube_link"
        required
        defaultValue={youtubeDefault}
        placeholder="https://youtu.be/XXXXXXXXXXX"
        error={fieldError("video_ref")}
        hint="Cole o link do vídeo (não listado) ou só o ID."
      />

      <section className="grid gap-4 sm:grid-cols-2">
        {parent.kind === "season" ? (
          <Input
            label="Número do episódio"
            name="number"
            type="number"
            min={1}
            required
            defaultValue={episode?.number ?? nextNumber ?? 1}
            error={fieldError("number")}
          />
        ) : null}

        <Input
          label="Duração (segundos)"
          name="duration_s"
          type="number"
          min={1}
          defaultValue={episode?.duration_s ?? undefined}
          hint="Preencha manualmente — sem busca automática por enquanto."
        />

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-text">Status</span>
          <select
            name="status"
            defaultValue={episode?.status ?? "draft"}
            className="h-11 rounded-md border border-line bg-surface-2 px-3 text-base text-text"
          >
            <option value="draft">Rascunho</option>
            <option value="scheduled">Agendado</option>
            <option value="published">Publicado</option>
          </select>
        </div>

        <Input
          label="Agendar para (opcional)"
          name="release_at"
          type="datetime-local"
          defaultValue={toDatetimeLocalValue(episode?.release_at)}
          hint="Hora do seu navegador."
        />

        <Input
          label="Abertura — início (segundos)"
          name="intro_start_s"
          type="number"
          min={0}
          defaultValue={episode?.intro_start_s ?? undefined}
        />
        <Input
          label="Abertura — fim (segundos)"
          name="intro_end_s"
          type="number"
          min={0}
          defaultValue={episode?.intro_end_s ?? undefined}
        />
        <Input
          label="Créditos — início (segundos)"
          name="credits_start_s"
          type="number"
          min={0}
          defaultValue={episode?.credits_start_s ?? undefined}
        />

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_free" defaultChecked={episode?.is_free} className="size-4" />
          Episódio gratuito
        </label>
      </section>

      <SubmitButton label={isEdit ? "Salvar" : "Criar episódio"} />
    </form>
  );
}
