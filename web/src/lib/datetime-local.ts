// Conversão entre um timestamp UTC (ISO, como vem do banco) e o valor de um <input type="datetime-local">.
// Tudo aqui roda no navegador (dentro de componentes "use client"): os getters/setters locais do `Date`
// (getFullYear, getHours, etc., sem o prefixo UTC) usam o fuso do navegador — é assim que convertemos
// certo. Ver docs/qa/gates/2.2-admin-titulos-e-temporadas.yml (REL-001) para o bug que isto corrige:
// antes, um corte cru do ISO (`.slice(0, 16)`) era mostrado como se já fosse hora local, e o servidor
// reinterpretava o texto no fuso dele (não no do navegador) — deslocando o horário a cada edição.

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** UTC (ISO) → valor local para o campo (`YYYY-MM-DDTHH:mm`). `undefined` se não houver data. */
export function toDatetimeLocalValue(iso: string | null | undefined): string | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return undefined;
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Valor do campo (hora local do navegador) → UTC (ISO). Chamar isto no navegador, nunca no servidor —
 * só o navegador sabe o próprio fuso. `null` se vazio ou inválido.
 */
export function datetimeLocalToIso(value: string | null | undefined): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}
