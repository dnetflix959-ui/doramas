import { describe, expect, it } from "vitest";
import { noConsent, parseConsent, serializeConsent } from "./consent";

describe("consent", () => {
  it("sem cookie é 'sem consentimento'", () => {
    expect(parseConsent(undefined)).toEqual(noConsent);
    expect(parseConsent(null)).toEqual(noConsent);
  });

  it("lê analytics e marketing do cookie", () => {
    expect(parseConsent("a=1&m=0")).toEqual({ analytics: true, marketing: false });
    expect(parseConsent("a=0&m=1")).toEqual({ analytics: false, marketing: true });
  });

  it("serializa e lê de volta (ida e volta)", () => {
    const consent = { analytics: true, marketing: false };
    expect(parseConsent(serializeConsent(consent))).toEqual(consent);
  });

  it("valor inesperado vira 'sem consentimento'", () => {
    expect(parseConsent("lixo")).toEqual(noConsent);
  });
});
