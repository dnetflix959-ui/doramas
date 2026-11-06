// Tipos e constantes compartilhados entre o navegador (track.ts) e o servidor (/api/events).

/** Eventos permitidos sem consentimento de análise. Manter igual a `essential` em ingest_analytics() (SQL). */
export const ESSENTIAL_EVENTS = ["page_view", "client_error"] as const;

export const NAME_PATTERN = /^[a-z][a-z0-9_]{1,39}$/;

export const LIMITS = {
  /** Eventos por lote (igual ao limite da função SQL). */
  maxEventsPerBatch: 50,
  /** Tamanho máximo do corpo da requisição, em bytes. */
  maxBodyBytes: 32 * 1024,
  /** Tamanho máximo de `props` serializado, em bytes (igual à constraint da tabela). */
  maxPropsBytes: 4096,
  maxPathLength: 300,
  /** Fila do navegador: acima disso, descarta os eventos mais antigos. */
  maxQueueSize: 200,
} as const;

export const FLUSH_INTERVAL_MS = 10_000;

export type Device = "mobile" | "tablet" | "desktop" | "tv" | "other";

export type AnalyticsEvent = {
  name: string;
  /** Milissegundos desde 1970, no relógio do navegador. */
  t: number;
  path?: string;
  props?: Record<string, unknown>;
};

export type FirstTouch = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  referrer?: string;
  landing_path?: string;
};

export type EventsPayload = {
  session_id: string;
  locale: string;
  /** Verdadeiro quando a pessoa deu consentimento de análise. */
  consent: boolean;
  first_touch?: FirstTouch;
  landing_path?: string;
  events: AnalyticsEvent[];
};

export function isEssential(name: string): boolean {
  return (ESSENTIAL_EVENTS as readonly string[]).includes(name);
}
