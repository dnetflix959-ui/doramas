// Coleta de eventos no navegador: acumula e envia em lote para /api/events.
// Envia a cada 10 s, ao trocar de página (provider) e ao esconder/fechar a aba (sendBeacon).
import { readConsent } from "./consent";
import { captureFirstTouch } from "./first-touch";
import {
  FLUSH_INTERVAL_MS,
  LIMITS,
  NAME_PATTERN,
  isEssential,
  type AnalyticsEvent,
  type EventsPayload,
  type FirstTouch,
} from "./types";

export type TrackerDeps = {
  send: (payload: EventsPayload, options: { beacon: boolean }) => void;
  now: () => number;
  hasConsent: () => boolean;
  getSessionId: () => string;
  getLocale: () => string;
  getPath: () => string;
  getLandingPath: () => string | undefined;
  /** Origem da primeira visita; só deve existir com consentimento. */
  getFirstTouch: () => FirstTouch | undefined;
};

/** Cria um coletor. Separado do navegador para poder testar sem DOM. */
export function createTracker(deps: TrackerDeps) {
  let queue: AnalyticsEvent[] = [];

  function track(name: string, props?: Record<string, unknown>) {
    if (!NAME_PATTERN.test(name)) return;
    const consent = deps.hasConsent();
    // Sem consentimento de análise: só eventos essenciais.
    if (!consent && !isEssential(name)) return;

    const event: AnalyticsEvent = { name, t: deps.now(), path: deps.getPath().slice(0, LIMITS.maxPathLength) };
    if (props && JSON.stringify(props).length <= LIMITS.maxPropsBytes) event.props = props;

    queue.push(event);
    if (queue.length > LIMITS.maxQueueSize) queue = queue.slice(queue.length - LIMITS.maxQueueSize);
    if (queue.length >= LIMITS.maxEventsPerBatch) flush();
  }

  function flush(options: { beacon: boolean } = { beacon: false }) {
    while (queue.length > 0) {
      const events = queue.slice(0, LIMITS.maxEventsPerBatch);
      queue = queue.slice(events.length);

      const consent = deps.hasConsent();
      const payload: EventsPayload = {
        session_id: deps.getSessionId(),
        locale: deps.getLocale(),
        consent,
        landing_path: deps.getLandingPath(),
        first_touch: consent ? deps.getFirstTouch() : undefined,
        events,
      };
      deps.send(payload, options);
    }
  }

  return { track, flush, size: () => queue.length };
}

// ---- Ligação com o navegador ------------------------------------------------

const sessionKey = "analytics_session";
const landingKey = "analytics_landing";

function getSessionId(): string {
  try {
    const saved = window.sessionStorage.getItem(sessionKey);
    if (saved) return saved;
    const id = crypto.randomUUID();
    window.sessionStorage.setItem(sessionKey, id);
    return id;
  } catch {
    // Sem sessionStorage: um id por carregamento de página.
    return fallbackSessionId;
  }
}

const fallbackSessionId = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : "";

function getLandingPath(): string | undefined {
  try {
    const saved = window.sessionStorage.getItem(landingKey);
    if (saved) return saved;
    const path = window.location.pathname.slice(0, LIMITS.maxPathLength);
    window.sessionStorage.setItem(landingKey, path);
    return path;
  } catch {
    return undefined;
  }
}

function send(payload: EventsPayload, { beacon }: { beacon: boolean }) {
  const body = JSON.stringify(payload);
  if (beacon && typeof navigator.sendBeacon === "function") {
    const queued = navigator.sendBeacon("/api/events", new Blob([body], { type: "application/json" }));
    if (queued) return;
  }
  void fetch("/api/events", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {
    // Perder um lote de análise não pode afetar a navegação.
  });
}

let browserTracker: ReturnType<typeof createTracker> | undefined;

function getTracker() {
  browserTracker ??= createTracker({
    send,
    now: () => Date.now(),
    hasConsent: () => readConsent().analytics,
    getSessionId,
    getLocale: () => document.documentElement.lang.split("-")[0] || "pt",
    getPath: () => window.location.pathname,
    getLandingPath,
    getFirstTouch: () => captureFirstTouch(),
  });
  return browserTracker;
}

/** Registra um evento. Seguro para chamar em qualquer lugar do cliente; no servidor não faz nada. */
export function track(name: string, props?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  getTracker().track(name, props);
}

/** Envia o que está na fila agora (usado ao trocar de página). */
export function flush(options?: { beacon: boolean }) {
  if (typeof window === "undefined") return;
  getTracker().flush(options);
}

/** Liga o envio periódico e o envio ao esconder/fechar a aba. Devolve a função para desligar. */
export function startTracking(): () => void {
  const interval = window.setInterval(() => flush(), FLUSH_INTERVAL_MS);
  const onVisibility = () => {
    if (document.visibilityState === "hidden") flush({ beacon: true });
  };
  const onPageHide = () => flush({ beacon: true });

  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("pagehide", onPageHide);

  return () => {
    window.clearInterval(interval);
    document.removeEventListener("visibilitychange", onVisibility);
    window.removeEventListener("pagehide", onPageHide);
  };
}
