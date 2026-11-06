-- Story 1.4 — Coleta de eventos de uso: sessões, eventos (particionados por mês) e função de ingestão.
--
-- Segurança:
--  * RLS ligado; só admin lê (via is_admin() da story 1.3). Ninguém grava direto pela API.
--  * A gravação passa por public.ingest_analytics(), SECURITY DEFINER, que valida o lote,
--    descobre o usuário por auth.uid() (não confia no cliente) e limita a taxa por sessão.
--  * Sem consentimento de análise (p_anonymous = true): sem usuário, sem first_touch e só eventos essenciais.

-- Sessões: uma por visita (id gerado no navegador, guardado em sessionStorage).
create table public.sessions (
  id uuid primary key,
  user_id uuid references auth.users (id) on delete set null,
  anonymous boolean not null default true,
  locale text check (locale in ('pt', 'en', 'es')),
  country text check (country ~ '^[A-Z]{2}$'),
  device text check (device in ('mobile', 'tablet', 'desktop', 'tv', 'other')),
  landing_path text check (char_length(landing_path) <= 300),
  first_touch jsonb check (pg_column_size(first_touch) <= 2048),
  started_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  -- Janela fixa de 1 minuto para o limite de taxa (compartilhado entre instâncias do servidor).
  rate_window_started_at timestamptz not null default now(),
  rate_window_count integer not null default 0
);

create index sessions_user_id_idx on public.sessions (user_id) where user_id is not null;
create index sessions_started_at_idx on public.sessions (started_at);

-- Eventos: particionados por mês (occurred_at) para consolidar e apagar por período.
create table public.analytics_events (
  id uuid not null default gen_random_uuid(),
  occurred_at timestamptz not null default now(),
  session_id uuid not null references public.sessions (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  profile_id uuid references public.viewer_profiles (id) on delete set null,
  name text not null check (name ~ '^[a-z][a-z0-9_]{1,39}$'),
  path text check (char_length(path) <= 300),
  props jsonb not null default '{}'::jsonb
    check (jsonb_typeof(props) = 'object' and pg_column_size(props) <= 4096),
  primary key (id, occurred_at)
) partition by range (occurred_at);

create index analytics_events_session_idx on public.analytics_events (session_id, occurred_at);
create index analytics_events_name_idx on public.analytics_events (name, occurred_at);
create index analytics_events_user_idx on public.analytics_events (user_id, occurred_at) where user_id is not null;

-- Cria a partição de um mês (idempotente). Partições não são acessíveis pela API.
create or replace function public.ensure_analytics_partition(p_month date)
returns void
language plpgsql
set search_path = ''
as $$
declare
  start_d date := date_trunc('month', p_month)::date;
  end_d date := (date_trunc('month', p_month) + interval '1 month')::date;
  part_name text := format('analytics_events_%s', to_char(start_d, 'YYYY_MM'));
begin
  execute format(
    'create table if not exists public.%I partition of public.analytics_events for values from (%L) to (%L)',
    part_name,
    start_d::text || ' 00:00:00+00',
    end_d::text || ' 00:00:00+00'
  );
  execute format('revoke all on table public.%I from anon, authenticated', part_name);
end;
$$;

revoke execute on function public.ensure_analytics_partition(date) from public, anon, authenticated;

-- Partição padrão: nunca deixa a gravação falhar se faltar a partição do mês.
create table public.analytics_events_default partition of public.analytics_events default;
revoke all on table public.analytics_events_default from anon, authenticated;

-- Partições do mês atual até 14 meses à frente. (O job que mantém isso em dia vem com o Épico 7.)
do $$
declare
  m date := date '2026-11-01';
begin
  for i in 0..13 loop
    perform public.ensure_analytics_partition((m + (i || ' months')::interval)::date);
  end loop;
end;
$$;

-- RLS: só admin lê. Sem políticas de escrita: ninguém grava direto.
alter table public.sessions enable row level security;
alter table public.analytics_events enable row level security;

revoke all on table public.sessions from anon, authenticated;
revoke all on table public.analytics_events from anon, authenticated;
grant select on table public.sessions to authenticated;
grant select on table public.analytics_events to authenticated;

create policy "sessions: só admin lê"
  on public.sessions for select
  to authenticated
  using ((select public.is_admin()));

create policy "analytics_events: só admin lê"
  on public.analytics_events for select
  to authenticated
  using ((select public.is_admin()));

-- Ingestão de um lote. Chamada pelo endpoint /api/events com a sessão do usuário (se houver).
--   p_session:   { id, locale, country, device, landing_path, first_touch }
--   p_events:    [ { name, t (ms desde 1970), path, props } ] (1 a 50)
--   p_anonymous: true quando não há consentimento de análise.
create or replace function public.ingest_analytics(p_session jsonb, p_events jsonb, p_anonymous boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  -- Eventos permitidos sem consentimento (manter igual a ESSENTIAL_EVENTS em web/src/lib/analytics/types.ts).
  essential constant text[] := array['page_view', 'client_error'];
  max_events_per_minute constant integer := 300;
  uid uuid := case when p_anonymous then null else auth.uid() end;
  sid uuid;
  ev jsonb;
  ev_name text;
  ev_time timestamptz;
  accepted integer := 0;
  window_count integer;
begin
  if p_session is null or jsonb_typeof(p_session) <> 'object'
     or p_events is null or jsonb_typeof(p_events) <> 'array'
     or jsonb_array_length(p_events) not between 1 and 50 then
    raise exception 'invalid_batch' using errcode = '22023';
  end if;

  sid := (p_session ->> 'id')::uuid;

  insert into public.sessions as s (
    id, user_id, anonymous, locale, country, device, landing_path, first_touch,
    rate_window_started_at, rate_window_count
  )
  values (
    sid,
    uid,
    p_anonymous,
    nullif(p_session ->> 'locale', ''),
    nullif(p_session ->> 'country', ''),
    nullif(p_session ->> 'device', ''),
    nullif(left(p_session ->> 'landing_path', 300), ''),
    case when p_anonymous then null else p_session -> 'first_touch' end,
    now(),
    jsonb_array_length(p_events)
  )
  on conflict (id) do update set
    last_seen_at = now(),
    user_id = coalesce(s.user_id, excluded.user_id),
    anonymous = s.anonymous and excluded.anonymous,
    first_touch = coalesce(s.first_touch, excluded.first_touch),
    rate_window_started_at = case
      when s.rate_window_started_at < now() - interval '1 minute' then now()
      else s.rate_window_started_at end,
    rate_window_count = case
      when s.rate_window_started_at < now() - interval '1 minute' then excluded.rate_window_count
      else s.rate_window_count + excluded.rate_window_count end
  returning s.rate_window_count into window_count;

  if window_count > max_events_per_minute then
    raise exception 'rate_limited' using errcode = '54000';
  end if;

  for ev in select * from jsonb_array_elements(p_events) loop
    ev_name := ev ->> 'name';
    if p_anonymous and not (ev_name = any (essential)) then
      continue;
    end if;

    ev_time := least(
      greatest(
        coalesce(to_timestamp((ev ->> 't')::double precision / 1000.0), now()),
        now() - interval '1 day'
      ),
      now() + interval '5 minutes'
    );

    insert into public.analytics_events (occurred_at, session_id, user_id, name, path, props)
    values (
      ev_time,
      sid,
      uid,
      ev_name,
      nullif(left(ev ->> 'path', 300), ''),
      coalesce(ev -> 'props', '{}'::jsonb)
    );
    accepted := accepted + 1;
  end loop;
end;
$$;

revoke execute on function public.ingest_analytics(jsonb, jsonb, boolean) from public;
grant execute on function public.ingest_analytics(jsonb, jsonb, boolean) to anon, authenticated;
