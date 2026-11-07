-- Story 3.1 — Corrige o achado SEC-003 do QA gate: check_play_rate_limit(p_user_id) aceitava qualquer uuid
-- do chamador, não só o próprio, permitindo que um usuário autenticado esgotasse o limite de taxa de outro
-- via RPC direto. A função passa a usar auth.uid() internamente, como todo o resto do projeto já faz
-- (ingest_analytics, is_admin etc.) — nunca confiar num id recebido do cliente para decidir de quem é o quê.

drop function if exists public.check_play_rate_limit(uuid);

create or replace function public.check_play_rate_limit()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  max_per_minute constant integer := 60;
  current_count integer;
  uid uuid := auth.uid();
begin
  if uid is null then
    return false;
  end if;

  insert into public.play_rate_limits as l (user_id, window_started_at, count)
  values (uid, now(), 1)
  on conflict (user_id) do update set
    window_started_at = case
      when l.window_started_at < now() - interval '1 minute' then now()
      else l.window_started_at end,
    count = case
      when l.window_started_at < now() - interval '1 minute' then 1
      else l.count + 1 end
  returning count into current_count;

  return current_count <= max_per_minute;
end;
$$;

revoke execute on function public.check_play_rate_limit() from public, anon;
grant execute on function public.check_play_rate_limit() to authenticated;
