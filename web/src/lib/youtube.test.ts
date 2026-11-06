import { describe, expect, it } from "vitest";
import { parseYoutubeId } from "./youtube";

const id = "dQw4w9WgXcQ";

describe("parseYoutubeId", () => {
  it("aceita o ID puro", () => {
    expect(parseYoutubeId(id)).toBe(id);
  });

  it("aceita watch?v= com e sem www", () => {
    expect(parseYoutubeId(`https://www.youtube.com/watch?v=${id}`)).toBe(id);
    expect(parseYoutubeId(`https://youtube.com/watch?v=${id}`)).toBe(id);
    expect(parseYoutubeId(`https://m.youtube.com/watch?v=${id}`)).toBe(id);
  });

  it("aceita watch?v= com parâmetros extras (ex.: tempo)", () => {
    expect(parseYoutubeId(`https://www.youtube.com/watch?v=${id}&t=30s`)).toBe(id);
  });

  it("aceita youtu.be", () => {
    expect(parseYoutubeId(`https://youtu.be/${id}`)).toBe(id);
    expect(parseYoutubeId(`https://youtu.be/${id}?t=10`)).toBe(id);
  });

  it("aceita embed/", () => {
    expect(parseYoutubeId(`https://www.youtube.com/embed/${id}`)).toBe(id);
  });

  it("aceita shorts/", () => {
    expect(parseYoutubeId(`https://www.youtube.com/shorts/${id}`)).toBe(id);
  });

  it("aceita o domínio sem cookies", () => {
    expect(parseYoutubeId(`https://www.youtube-nocookie.com/embed/${id}`)).toBe(id);
  });

  it("aceita sem protocolo", () => {
    expect(parseYoutubeId(`youtu.be/${id}`)).toBe(id);
  });

  it("rejeita link de outro site", () => {
    expect(parseYoutubeId(`https://vimeo.com/${id}`)).toBeNull();
  });

  it("rejeita texto que não é link nem ID", () => {
    expect(parseYoutubeId("não é um link")).toBeNull();
    expect(parseYoutubeId("")).toBeNull();
  });

  it("rejeita ID com tamanho errado", () => {
    expect(parseYoutubeId("curto")).toBeNull();
    expect(parseYoutubeId(`${id}XXXX`)).toBeNull();
  });

  it("rejeita link do YouTube sem vídeo reconhecível", () => {
    expect(parseYoutubeId("https://www.youtube.com/results?search_query=dorama")).toBeNull();
  });
});
