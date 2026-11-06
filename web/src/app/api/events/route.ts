import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { detectCountry, detectDevice } from "@/lib/analytics/device";
import { LIMITS } from "@/lib/analytics/types";
import { validatePayload } from "@/lib/analytics/validate";

/**
 * Recebe um lote de eventos do navegador (src/lib/analytics/track.ts), anexa usuário/sessão/dispositivo/país
 * no servidor e grava via a função `ingest_analytics` (RLS + limite de taxa ficam no banco).
 */
export async function POST(request: NextRequest) {
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > LIMITS.maxBodyBytes) {
    return NextResponse.json({ error: "payload_too_large" }, { status: 413 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const payload = validatePayload(raw);
  if ("error" in payload) {
    return NextResponse.json(payload, { status: 400 });
  }

  const supabase = await createClient();
  const device = detectDevice(request.headers.get("user-agent") ?? "");
  const country = detectCountry(request.headers);

  const { error } = await supabase.rpc("ingest_analytics", {
    p_session: {
      id: payload.session_id,
      locale: payload.locale,
      country,
      device,
      landing_path: payload.landing_path,
      first_touch: payload.first_touch,
    },
    p_events: payload.events,
    // Sem consentimento de análise: a função grava só os eventos essenciais e sem identificar a pessoa.
    p_anonymous: !payload.consent,
  });

  if (error) {
    if (error.message.includes("rate_limited")) {
      return NextResponse.json({ error: "rate_limited" }, { status: 429 });
    }
    if (error.message.includes("invalid_batch")) {
      return NextResponse.json({ error: "invalid_batch" }, { status: 400 });
    }
    console.error("Erro ao gravar eventos de análise:", error);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
