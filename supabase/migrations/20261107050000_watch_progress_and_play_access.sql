-- Story 3.1 — Esquema de progresso e controle de acesso para o player.
--
-- IMPORTANTE (Épico 4 — Assinaturas, ainda não existe): o acesso ao vídeo aqui só considera episódio
-- gratuito ou admin. Quando `subscriptions` existir, a função check_play_access() abaixo deve ganhar mais
-- uma condição (assinatura ativa) — ver docs/prd/epic-3-player.md, "Decisão importante".

-- Progresso de reprodução por perfil (até 4 perfis por conta, story 1.3).
create table public.watch_progress (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.viewer_profiles (id) on delete cascade,
  episode_id uuid not null references public.episodes (id) on delete cascade,
  position_s integer not null default 0 check (position_s >= 0),
  completed boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (profile_id, episode_id)
);

create index watch_progress_profile_idx on public.watch_progress (profile_id);
create index watch_progress_episode_idx on public.watch_progress (episode_id);

create trigger watch_progress_updated_at
  before update on public.watch_progress
  for each row execute function public.set_updated_at();

alter table public.watch_progress enable row level security;

revoke all on table public.watch_progress from anon, authenticated;
grant select, insert, update, delete on table public.watch_progress to authenticated;

create policy "watch_progress: dono ou admin lê" on public.watch_progress for select
  to authenticated
  using (
    exists (select 1 from public.viewer_profiles vp where vp.id = profile_id and vp.account_id = (select auth.uid()))
    or (select public.is_admin())
  );

create policy "watch_progress: dono grava" on public.watch_progress for all
  to authenticated
  using (exists (select 1 from public.viewer_profiles vp where vp.id = profile_id and vp.account_id = (select auth.uid())))
  with check (exists (select 1 from public.viewer_profiles vp where vp.id = profile_id and vp.account_id = (select auth.uid())));

-- Limite de taxa de /api/play: mesma limitação já aceita desde a story 1.4 (por usuário, não por IP —
-- ver docs/stories/1.4.coleta-de-eventos.md, REL/SEC do gate). 60 pedidos por minuto por usuário.
create table public.play_rate_limits (
  user_id uuid primary key references auth.users (id) on delete cascade,
  window_started_at timestamptz not null default now(),
  count integer not null default 0
);

alter table public.play_rate_limits enable row level security;
revoke all on table public.play_rate_limits from anon, authenticated;
-- Sem policy nenhuma: só a função SECURITY DEFINER abaixo acessa esta tabela.

create or replace function public.check_play_rate_limit(p_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  max_per_minute constant integer := 60;
  current_count integer;
begin
  insert into public.play_rate_limits as l (user_id, window_started_at, count)
  values (p_user_id, now(), 1)
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

revoke execute on function public.check_play_rate_limit(uuid) from public, anon;
grant execute on function public.check_play_rate_limit(uuid) to authenticated;

-- Decide se um usuário pode reproduzir um episódio: gratuito ou admin (ver nota no topo do arquivo).
create or replace function public.check_play_access(p_episode_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.episodes e
    where e.id = p_episode_id
      and (e.is_free or (select public.is_admin()))
  );
$$;

revoke execute on function public.check_play_access(uuid) from public;
grant execute on function public.check_play_access(uuid) to authenticated;
