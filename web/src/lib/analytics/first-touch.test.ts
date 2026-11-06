import { describe, expect, it } from "vitest";
import { buildFirstTouch } from "./first-touch";

describe("buildFirstTouch", () => {
  it("captura UTM e página de entrada", () => {
    const url = new URL("https://dorama.app/pt/assistir/titulo?utm_source=meta&utm_campaign=lancamento");
    const touch = buildFirstTouch(url, "");
    expect(touch).toEqual({
      landing_path: "/pt/assistir/titulo?utm_source=meta&utm_campaign=lancamento",
      utm_source: "meta",
      utm_campaign: "lancamento",
    });
  });

  it("guarda o domínio de referrer externo", () => {
    const url = new URL("https://dorama.app/pt");
    const touch = buildFirstTouch(url, "https://www.google.com/search?q=dorama");
    expect(touch.referrer).toBe("www.google.com");
  });

  it("ignora referrer do mesmo site", () => {
    const url = new URL("https://dorama.app/pt/avisos");
    const touch = buildFirstTouch(url, "https://dorama.app/pt");
    expect(touch.referrer).toBeUndefined();
  });

  it("ignora referrer inválido sem lançar erro", () => {
    const url = new URL("https://dorama.app/pt");
    expect(() => buildFirstTouch(url, "não é url")).not.toThrow();
  });
});
