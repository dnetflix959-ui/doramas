import { hasLocale } from "@/i18n/config";
import { LIMITS, NAME_PATTERN, type AnalyticsEvent, type EventsPayload, type FirstTouch } from "./types";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const utmKeys = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "referrer", "landing_path"] as const;

export type ValidationError = { error: string };

/** Valida o formato do lote recebido em /api/events. Não confia em nada que vem do cliente além da forma. */
export function validatePayload(body: unknown): EventsPayload | ValidationError {
  if (typeof body !== "object" || body === null) return { error: "invalid_body" };
  const b = body as Record<string, unknown>;

  if (typeof b.session_id !== "string" || !uuidPattern.test(b.session_id)) return { error: "invalid_session_id" };
  if (typeof b.locale !== "string" || !hasLocale(b.locale)) return { error: "invalid_locale" };
  if (typeof b.consent !== "boolean") return { error: "invalid_consent" };
  if (!Array.isArray(b.events) || b.events.length < 1 || b.events.length > LIMITS.maxEventsPerBatch) {
    return { error: "invalid_events" };
  }

  const events: AnalyticsEvent[] = [];
  for (const raw of b.events) {
    const event = validateEvent(raw);
    if (!event) return { error: "invalid_event" };
    events.push(event);
  }

  const payload: EventsPayload = { session_id: b.session_id, locale: b.locale, consent: b.consent, events };

  if (typeof b.landing_path === "string") payload.landing_path = b.landing_path.slice(0, LIMITS.maxPathLength);
  if (b.consent && typeof b.first_touch === "object" && b.first_touch !== null) {
    payload.first_touch = sanitizeFirstTouch(b.first_touch as Record<string, unknown>);
  }

  return payload;
}

function validateEvent(raw: unknown): AnalyticsEvent | undefined {
  if (typeof raw !== "object" || raw === null) return undefined;
  const e = raw as Record<string, unknown>;
  if (typeof e.name !== "string" || !NAME_PATTERN.test(e.name)) return undefined;
  if (typeof e.t !== "number" || !Number.isFinite(e.t)) return undefined;

  const event: AnalyticsEvent = { name: e.name, t: e.t };
  if (typeof e.path === "string") event.path = e.path.slice(0, LIMITS.maxPathLength);
  if (typeof e.props === "object" && e.props !== null) {
    const json = JSON.stringify(e.props);
    if (json.length <= LIMITS.maxPropsBytes) event.props = e.props as Record<string, unknown>;
  }
  return event;
}

function sanitizeFirstTouch(raw: Record<string, unknown>): FirstTouch {
  const touch: FirstTouch = {};
  for (const key of utmKeys) {
    const value = raw[key];
    if (typeof value === "string" && value.length > 0) touch[key] = value.slice(0, 300);
  }
  return touch;
}
