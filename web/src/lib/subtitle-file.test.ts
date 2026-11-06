import { describe, expect, it } from "vitest";
import { MAX_SUBTITLE_BYTES, validateSubtitleFile } from "./subtitle-file";

describe("validateSubtitleFile", () => {
  it("aceita um .vtt dentro do limite", () => {
    expect(validateSubtitleFile({ name: "pt.vtt", size: 1024 })).toBeNull();
  });

  it("rejeita extensão errada", () => {
    expect(validateSubtitleFile({ name: "pt.srt", size: 1024 })).toBe("extension");
  });

  it("aceita .VTT maiúsculo", () => {
    expect(validateSubtitleFile({ name: "PT.VTT", size: 1024 })).toBeNull();
  });

  it("rejeita arquivo maior que o limite", () => {
    expect(validateSubtitleFile({ name: "pt.vtt", size: MAX_SUBTITLE_BYTES + 1 })).toBe("size");
  });

  it("aceita exatamente no limite", () => {
    expect(validateSubtitleFile({ name: "pt.vtt", size: MAX_SUBTITLE_BYTES })).toBeNull();
  });

  it("rejeita arquivo vazio ou sem nome", () => {
    expect(validateSubtitleFile({ name: "pt.vtt", size: 0 })).toBe("empty");
    expect(validateSubtitleFile({ name: "", size: 1024 })).toBe("empty");
  });
});
