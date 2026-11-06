import { describe, expect, it, vi } from "vitest";
import { createTracker, type TrackerDeps } from "./track";

function makeDeps(overrides: Partial<TrackerDeps> = {}) {
  const send = vi.fn();
  const deps: TrackerDeps = {
    send,
    now: () => 1000,
    hasConsent: () => true,
    getSessionId: () => "s1",
    getLocale: () => "pt",
    getPath: () => "/pt",
    getLandingPath: () => "/pt",
    getFirstTouch: () => undefined,
    ...overrides,
  };
  return { deps, send };
}

describe("createTracker", () => {
  it("não envia nada antes do flush", () => {
    const { deps, send } = makeDeps();
    const tracker = createTracker(deps);
    tracker.track("play");
    expect(send).not.toHaveBeenCalled();
    expect(tracker.size()).toBe(1);
  });

  it("envia o lote acumulado no flush", () => {
    const { deps, send } = makeDeps();
    const tracker = createTracker(deps);
    tracker.track("play");
    tracker.track("pause");
    tracker.flush();
    expect(send).toHaveBeenCalledTimes(1);
    const [payload, options] = send.mock.calls[0];
    expect(payload.events.map((e: { name: string }) => e.name)).toEqual(["play", "pause"]);
    expect(payload.session_id).toBe("s1");
    expect(options).toEqual({ beacon: false });
    expect(tracker.size()).toBe(0);
  });

  it("descarta eventos não essenciais sem consentimento de análise", () => {
    const { deps, send } = makeDeps({ hasConsent: () => false });
    const tracker = createTracker(deps);
    tracker.track("play");
    tracker.track("page_view");
    tracker.flush();
    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0][0].events).toEqual([{ name: "page_view", t: 1000, path: "/pt" }]);
  });

  it("não envia first_touch sem consentimento, mesmo se getFirstTouch devolver algo", () => {
    const { deps, send } = makeDeps({
      hasConsent: () => false,
      getFirstTouch: () => ({ utm_source: "x" }),
    });
    const tracker = createTracker(deps);
    tracker.track("page_view");
    tracker.flush();
    expect(send.mock.calls[0][0].first_touch).toBeUndefined();
  });

  it("envia first_touch com consentimento", () => {
    const { deps, send } = makeDeps({ getFirstTouch: () => ({ utm_source: "google" }) });
    const tracker = createTracker(deps);
    tracker.track("page_view");
    tracker.flush();
    expect(send.mock.calls[0][0].first_touch).toEqual({ utm_source: "google" });
  });

  it("ignora nomes de evento em formato inválido", () => {
    const { deps, send } = makeDeps();
    const tracker = createTracker(deps);
    tracker.track("Nome Inválido");
    tracker.track("x".repeat(50));
    tracker.flush();
    expect(send).not.toHaveBeenCalled();
    expect(tracker.size()).toBe(0);
  });

  it("envia sozinho quando a fila atinge o tamanho máximo do lote", () => {
    const { deps, send } = makeDeps();
    const tracker = createTracker(deps);
    for (let i = 0; i < 50; i++) tracker.track("heartbeat");
    expect(send).toHaveBeenCalledTimes(1);
    expect(tracker.size()).toBe(0);
  });

  it("passa beacon: true ao fechar/esconder a aba", () => {
    const { deps, send } = makeDeps();
    const tracker = createTracker(deps);
    tracker.track("play");
    tracker.flush({ beacon: true });
    expect(send.mock.calls[0][1]).toEqual({ beacon: true });
  });

  it("não envia nada quando a fila está vazia", () => {
    const { deps, send } = makeDeps();
    const tracker = createTracker(deps);
    tracker.flush();
    expect(send).not.toHaveBeenCalled();
  });
});
