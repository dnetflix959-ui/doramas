import { describe, expect, it } from "vitest";
import { detectCountry, detectDevice } from "./device";

describe("detectDevice", () => {
  it("identifica celular", () => {
    expect(detectDevice("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)")).toBe("mobile");
    expect(detectDevice("Mozilla/5.0 (Linux; Android 14; Pixel 8) Mobile")).toBe("mobile");
  });

  it("identifica tablet", () => {
    expect(detectDevice("Mozilla/5.0 (iPad; CPU OS 17_0)")).toBe("tablet");
  });

  it("identifica TV", () => {
    expect(detectDevice("Mozilla/5.0 (SMART-TV; Linux; Tizen)")).toBe("tv");
  });

  it("identifica desktop", () => {
    expect(detectDevice("Mozilla/5.0 (Windows NT 10.0; Win64; x64)")).toBe("desktop");
  });

  it("usa 'other' quando não reconhece", () => {
    expect(detectDevice("curl/8.0")).toBe("other");
  });
});

describe("detectCountry", () => {
  it("lê o cabeçalho da Vercel", () => {
    expect(detectCountry(new Headers({ "x-vercel-ip-country": "BR" }))).toBe("BR");
  });

  it("usa o cabeçalho da Cloudflare como alternativa", () => {
    expect(detectCountry(new Headers({ "cf-ipcountry": "US" }))).toBe("US");
  });

  it("ignora valor em formato inesperado", () => {
    expect(detectCountry(new Headers({ "x-vercel-ip-country": "unknown" }))).toBeUndefined();
  });

  it("devolve undefined sem cabeçalho", () => {
    expect(detectCountry(new Headers())).toBeUndefined();
  });
});
