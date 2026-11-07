import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Devolve a referência do vídeo de um episódio (nunca o `video_ref` em nenhum outro lugar — ver
 * docs/architecture/index.md, "Controle de acesso ao vídeo").
 *
 * IMPORTANTE (Épico 4 — Assinaturas, ainda não existe): a decisão de acesso hoje é só "episódio gratuito
 * ou admin" (função `check_play_access` no banco). Quando `subscriptions` existir, `check_play_access` deve
 * ganhar a condição de assinatura ativa — nada muda aqui no endpoint. Ver docs/prd/epic-3-player.md.
 */
export async function GET(request: NextRequest, ctx: RouteContext<"/api/play/[episodeId]">) {
  const { episodeId } = await ctx.params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // check_play_rate_limit() usa auth.uid() internamente — nunca passar o id de outro usuário aqui
  // (achado SEC-003 do QA gate: a versão antiga aceitava um p_user_id arbitrário do chamador).
  const { data: withinLimit, error: rateLimitError } = await supabase.rpc("check_play_rate_limit");
  if (rateLimitError) {
    console.error("Erro ao checar limite de taxa de /api/play:", rateLimitError);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
  if (!withinLimit) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  // A própria leitura já respeita a RLS de "episodes" (story 2.1): se o episódio não existir, não estiver
  // publicado ou estiver agendado para o futuro, a consulta não devolve nada para quem não é admin.
  const { data: episode } = await supabase
    .from("episodes")
    .select("id, video_provider, video_ref")
    .eq("id", episodeId)
    .maybeSingle();

  if (!episode) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const { data: hasAccess, error: accessError } = await supabase.rpc("check_play_access", {
    p_episode_id: episode.id,
  });
  if (accessError) {
    console.error("Erro ao checar acesso de /api/play:", accessError);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
  if (!hasAccess) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  return NextResponse.json({ provider: episode.video_provider, ref: episode.video_ref });
}
