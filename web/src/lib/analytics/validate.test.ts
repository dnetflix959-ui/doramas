import { describe, expect, it } from "vitest";
import { validatePayload } from "./validate";

const validSession = "11111111-1111-1111-1111-111111111111";

function basePayload(overrides: Record<string, unknown> = {}) {
  return {
    session_id: validSession,
    locale: "pt",
    consent: true,
    events: [{ name: "play", t: 1000 }],
    ...overrides,
  };
}

describe("validatePayload", () => {
  it("aceita um lote válido", () => {
    const result = validatePayload(basePayload());
    expect("error" in result).toBe(false);
  });

  it("rejeita corpo que não é objeto", () => {
    expect(validatePayload(null)).toEqual({ error: "invalid_body" });
    expect(validatePayload("x")).toEqual({ error: "invalid_body" });
  });

  it("rejeita session_id que não é UUID", () => {
    expect(validatePayload(basePayload({ session_id: "abc" }))).toEqual({ error: "invalid_session_id" });
  });

  it("rejeita idioma desconhecido", () => {
    expect(validatePayload(basePayload({ locale: "fr" }))).toEqual({ error: "invalid_locale" });
  });

  it("rejeita consent que não é boolean", () => {
    expect(validatePayload(basePayload({ consent: "sim" }))).toEqual({ error: "invalid_consent" });
  });

  it("rejeita lote vazio e lote maior que o limite", () => {
    expect(validatePayload(basePayload({ events: [] }))).toEqual({ error: "invalid_events" });
    const many = Array.from({ length: 51 }, () => ({ name: "play", t: 1 }));
    expect(validatePayload(basePayload({ events: many }))).toEqual({ error: "invalid_events" });
  });

  it("rejeita evento com nome em formato inválido", () => {
    expect(validatePayload(basePayload({ events: [{ name: "Play Now", t: 1 }] }))).toEqual({
      error: "invalid_event",
    });
  });

  it("rejeita evento sem timestamp numérico", () => {
    expect(validatePayload(basePayload({ events: [{ name: "play" }] }))).toEqual({ error: "invalid_event" });
  });

  it("corta path e props grandes demais", () => {
    const result = validatePayload(
      basePayload({ events: [{ name: "play", t: 1, path: "/".padEnd(400, "a") }] }),
    );
    expect("error" in result).toBe(false);
    if (!("error" in result)) expect(result.events[0].path?.length).toBeLessThanOrEqual(300);
  });

  it("descarta first_touch quando não há consentimento", () => {
    const result = validatePayload(basePayload({ consent: false, first_touch: { utm_source: "x" } }));
    expect("error" in result).toBe(false);
    if (!("error" in result)) expect(result.first_touch).toBeUndefined();
  });

  it("sanitiza first_touch quando há consentimento", () => {
    const result = validatePayload(
      basePayload({ first_touch: { utm_source: "google", evil: "<script>" } }),
    );
    expect("error" in result).toBe(false);
    if (!("error" in result)) {
      expect(result.first_touch).toEqual({ utm_source: "google" });
    }
  });
});
