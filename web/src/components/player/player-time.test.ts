import { describe, expect, it } from "vitest";
import { formatTime, nextPlaybackRate, positionToSeconds, progressPercent } from "./player-time";

describe("formatTime", () => {
  it("formata minutos e segundos", () => {
    expect(formatTime(0)).toBe("0:00");
    expect(formatTime(5)).toBe("0:05");
    expect(formatTime(65)).toBe("1:05");
    expect(formatTime(599)).toBe("9:59");
  });

  it("formata horas quando passa de 1h", () => {
    expect(formatTime(3600)).toBe("1:00:00");
    expect(formatTime(3725)).toBe("1:02:05");
  });

  it("trata entrada inválida como 0:00", () => {
    expect(formatTime(Number.NaN)).toBe("0:00");
    expect(formatTime(-5)).toBe("0:00");
  });
});

describe("progressPercent", () => {
  it("calcula a porcentagem normalmente", () => {
    expect(progressPercent(30, 120)).toBe(25);
    expect(progressPercent(0, 120)).toBe(0);
    expect(progressPercent(120, 120)).toBe(100);
  });

  it("nunca passa de 100 mesmo se currentTime > duration", () => {
    expect(progressPercent(200, 120)).toBe(100);
  });

  it("devolve 0 sem duração válida", () => {
    expect(progressPercent(10, 0)).toBe(0);
    expect(progressPercent(10, Number.NaN)).toBe(0);
  });
});

describe("positionToSeconds", () => {
  it("converte a proporção do clique em segundos", () => {
    expect(positionToSeconds(0.5, 100)).toBe(50);
    expect(positionToSeconds(0, 100)).toBe(0);
    expect(positionToSeconds(1, 100)).toBe(100);
  });

  it("limita entre 0 e 1 mesmo com valores fora da faixa", () => {
    expect(positionToSeconds(-0.5, 100)).toBe(0);
    expect(positionToSeconds(1.5, 100)).toBe(100);
  });

  it("devolve 0 sem duração válida", () => {
    expect(positionToSeconds(0.5, 0)).toBe(0);
  });
});

describe("nextPlaybackRate", () => {
  it("avança para a próxima velocidade da lista", () => {
    expect(nextPlaybackRate(1)).toBe(1.25);
    expect(nextPlaybackRate(0.5)).toBe(0.75);
  });

  it("volta para a primeira depois da última", () => {
    expect(nextPlaybackRate(2)).toBe(0.5);
  });

  it("começa do início se o valor atual não está na lista", () => {
    expect(nextPlaybackRate(3)).toBe(0.5);
  });
});
