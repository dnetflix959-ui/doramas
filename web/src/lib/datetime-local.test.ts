import { describe, expect, it } from "vitest";
import { datetimeLocalToIso, toDatetimeLocalValue } from "./datetime-local";

describe("toDatetimeLocalValue / datetimeLocalToIso (ida e volta)", () => {
  it("preserva o instante independentemente do fuso da máquina que roda o teste", () => {
    const original = "2026-06-15T12:00:00.000Z";
    const local = toDatetimeLocalValue(original);
    expect(local).toBeDefined();
    // Isto é o que o navegador faria ao reenviar o campo sem alterar nada.
    const roundTripped = datetimeLocalToIso(local);
    expect(roundTripped).toBe(original);
  });

  it("não quebra em outra data/hora qualquer", () => {
    const original = "2027-01-01T00:30:00.000Z";
    const roundTripped = datetimeLocalToIso(toDatetimeLocalValue(original));
    expect(roundTripped).toBe(original);
  });

  it("devolve undefined/null para entrada vazia", () => {
    expect(toDatetimeLocalValue(null)).toBeUndefined();
    expect(toDatetimeLocalValue(undefined)).toBeUndefined();
    expect(datetimeLocalToIso(null)).toBeNull();
    expect(datetimeLocalToIso("")).toBeNull();
  });

  it("devolve undefined/null para data inválida", () => {
    expect(toDatetimeLocalValue("não é data")).toBeUndefined();
    expect(datetimeLocalToIso("não é data")).toBeNull();
  });
});
