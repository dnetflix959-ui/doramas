-- =============================================================================
-- Migration: bloqueia a execução de public.rls_auto_enable() pela API
-- =============================================================================
-- Por quê:
--   A função public.rls_auto_enable() vem pronta nos projetos Supabase novos
--   (não foi criada por nós). Ela é SECURITY DEFINER (roda como postgres) e é
--   usada pelo event trigger `ensure_rls` (ddl_command_end) para ligar o RLS
--   automaticamente em toda tabela nova do schema public. Isso é útil e fica.
--
--   O problema: por estar no schema public e ter EXECUTE liberado para
--   PUBLIC, anon e authenticated, qualquer visitante consegue chamá-la via
--   /rest/v1/rpc/rls_auto_enable. O Security Advisor do Supabase aponta isso.
--
-- O que fazemos:
--   Revogamos EXECUTE de PUBLIC, anon e authenticated. O event trigger continua
--   funcionando, porque o Postgres não confere o privilégio EXECUTE da função
--   quando dispara um event trigger.
--
-- Segurança:
--   - Idempotente: REVOKE de um privilégio que já não existe não dá erro.
--   - Só revoga se a função existir (bancos sem ela, ex.: local, não quebram).
--
-- Rollback (se precisar):
--   grant execute on function public.rls_auto_enable() to public, anon, authenticated;
-- =============================================================================

do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke execute on function public.rls_auto_enable() from public;
    revoke execute on function public.rls_auto_enable() from anon;
    revoke execute on function public.rls_auto_enable() from authenticated;
  end if;
end
$$;
