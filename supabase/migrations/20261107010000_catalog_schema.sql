-- Story 2.1 — Esquema do catálogo: títulos, temporadas, episódios, traduções, legendas e gêneros.
--
-- Decisão de schema (não estava nos critérios de aceite, registrada para o @architect no quality gate):
-- um filme é um título com um único "episódio" ligado direto por title_id (sem season). Mantém video_provider/
-- video_ref/duração só na tabela episodes, em vez de duplicar essas colunas em titles para o caso filme.
-- episodes.season_id (série) e episodes.title_id (filme) são mutuamente exclusivos; um trigger garante isso
-- e que o tipo do título bate com o caminho usado.

-- Títulos (séries ou filmes).
create table public.titles (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('series', 'movie')),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'published')),
  featured boolean not null default false,
  release_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index titles_status_idx on public.titles (status);

create trigger titles_updated_at
  before update on public.titles
  for each row execute function public.set_updated_at();

-- Tradução de título e sinopse por idioma.
create table public.title_translations (
  id uuid primary key default gen_random_uuid(),
  title_id uuid not null references public.titles (id) on delete cascade,
  locale text not null check (locale in ('pt', 'en', 'es')),
  name text not null check (char_length(name) between 1 and 200),
  synopsis text check (synopsis is null or char_length(synopsis) <= 2000),
  created_at timestamptz not null default now(),
  unique (title_id, locale)
);

create index title_translations_title_id_idx on public.title_translations (title_id);

-- Temporadas: só para títulos do tipo "series".
create table public.seasons (
  id uuid primary key default gen_random_uuid(),
  title_id uuid not null references public.titles (id) on delete cascade,
  number integer not null check (number > 0),
  created_at timestamptz not null default now(),
  unique (title_id, number)
);

create index seasons_title_id_idx on public.seasons (title_id);

create or replace function public.enforce_season_requires_series()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_kind text;
begin
  select kind into v_kind from public.titles where id = new.title_id;
  if v_kind is distinct from 'series' then
    raise exception 'seasons só podem pertencer a títulos do tipo series' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger seasons_require_series
  before insert or update of title_id on public.seasons
  for each row execute function public.enforce_season_requires_series();

revoke execute on function public.enforce_season_requires_series() from public, anon, authenticated;

-- Episódios: pertencem a uma temporada (série) OU direto a um título (filme) — nunca os dois.
create table public.episodes (
  id uuid primary key default gen_random_uuid(),
  season_id uuid references public.seasons (id) on delete cascade,
  title_id uuid references public.titles (id) on delete cascade,
  number integer not null default 1 check (number > 0),
  video_provider text not null default 'youtube' check (video_provider in ('youtube', 'bunny')),
  video_ref text not null check (char_length(video_ref) between 1 and 200),
  duration_s integer check (duration_s is null or duration_s > 0),
  intro_start_s integer check (intro_start_s is null or intro_start_s >= 0),
  intro_end_s integer check (intro_end_s is null or intro_end_s >= 0),
  credits_start_s integer check (credits_start_s is null or credits_start_s >= 0),
  release_at timestamptz,
  is_free boolean not null default false,
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Exatamente um responsável: temporada (série) ou título (filme).
  check ((season_id is not null) <> (title_id is not null))
);

create unique index episodes_season_number_uidx on public.episodes (season_id, number) where season_id is not null;
create unique index episodes_title_uidx on public.episodes (title_id) where title_id is not null;
create index episodes_status_idx on public.episodes (status);

create trigger episodes_updated_at
  before update on public.episodes
  for each row execute function public.set_updated_at();

create or replace function public.enforce_episode_parent()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_kind text;
begin
  if new.season_id is not null then
    select t.kind into v_kind
    from public.seasons s join public.titles t on t.id = s.title_id
    where s.id = new.season_id;
    if v_kind is distinct from 'series' then
      raise exception 'episode com season_id deve pertencer a um título do tipo series' using errcode = 'check_violation';
    end if;
  else
    select kind into v_kind from public.titles where id = new.title_id;
    if v_kind is distinct from 'movie' then
      raise exception 'episode com title_id deve pertencer a um título do tipo movie' using errcode = 'check_violation';
    end if;
  end if;
  return new;
end;
$$;

create trigger episodes_require_consistent_parent
  before insert or update of season_id, title_id on public.episodes
  for each row execute function public.enforce_episode_parent();

revoke execute on function public.enforce_episode_parent() from public, anon, authenticated;

-- Tradução de título e sinopse do episódio por idioma.
create table public.episode_translations (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references public.episodes (id) on delete cascade,
  locale text not null check (locale in ('pt', 'en', 'es')),
  title text check (title is null or char_length(title) <= 200),
  synopsis text check (synopsis is null or char_length(synopsis) <= 2000),
  created_at timestamptz not null default now(),
  unique (episode_id, locale)
);

create index episode_translations_episode_id_idx on public.episode_translations (episode_id);

-- Legendas: um arquivo .vtt por episódio e idioma.
create table public.subtitles (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references public.episodes (id) on delete cascade,
  locale text not null check (locale in ('pt', 'en', 'es')),
  url text not null check (char_length(url) <= 500),
  created_at timestamptz not null default now(),
  unique (episode_id, locale)
);

create index subtitles_episode_id_idx on public.subtitles (episode_id);

-- Gêneros: lista fixa, com nome em cada idioma (sem tabela de tradução separada — só 3 colunas de nome).
create table public.genres (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 50),
  name_pt text not null check (char_length(name_pt) between 1 and 60),
  name_en text not null check (char_length(name_en) between 1 and 60),
  name_es text not null check (char_length(name_es) between 1 and 60),
  created_at timestamptz not null default now()
);

create table public.title_genres (
  title_id uuid not null references public.titles (id) on delete cascade,
  genre_id uuid not null references public.genres (id) on delete cascade,
  primary key (title_id, genre_id)
);

create index title_genres_genre_id_idx on public.title_genres (genre_id);

-- Visibilidade pública: só o que está publicado (e, se agendado, já passou do horário).
-- SECURITY DEFINER é necessário aqui: a política de SELECT de "episodes" chama is_episode_visible(),
-- que por sua vez faz SELECT em "episodes" — sem SECURITY DEFINER essa segunda leitura reaplicaria a
-- mesma política, chamando a função de novo, numa recursão infinita (erro "stack depth limit exceeded").
-- Com SECURITY DEFINER a função roda como o dono (postgres) e não é sujeita à RLS que ela mesma alimenta.
create or replace function public.is_title_visible(p_title_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.titles t
    where t.id = p_title_id and t.status = 'published'
  );
$$;

create or replace function public.is_episode_visible(p_episode_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.episodes e
    left join public.seasons s on s.id = e.season_id
    join public.titles t on t.id = coalesce(s.title_id, e.title_id)
    where e.id = p_episode_id
      and e.status = 'published'
      and (e.release_at is null or e.release_at <= now())
      and t.status = 'published'
  );
$$;

revoke execute on function public.is_title_visible(uuid) from public;
grant execute on function public.is_title_visible(uuid) to anon, authenticated;
revoke execute on function public.is_episode_visible(uuid) from public;
grant execute on function public.is_episode_visible(uuid) to anon, authenticated;

-- RLS: leitura pública só do que está publicado e visível; escrita só admin (todas as 8 tabelas).
alter table public.titles enable row level security;
alter table public.title_translations enable row level security;
alter table public.seasons enable row level security;
alter table public.episodes enable row level security;
alter table public.episode_translations enable row level security;
alter table public.subtitles enable row level security;
alter table public.genres enable row level security;
alter table public.title_genres enable row level security;

revoke all on table
  public.titles, public.title_translations, public.seasons, public.episodes,
  public.episode_translations, public.subtitles, public.genres, public.title_genres
  from anon, authenticated;
grant select on table
  public.titles, public.title_translations, public.seasons, public.episodes,
  public.episode_translations, public.subtitles, public.genres, public.title_genres
  to anon, authenticated;
grant insert, update, delete on table
  public.titles, public.title_translations, public.seasons, public.episodes,
  public.episode_translations, public.subtitles, public.genres, public.title_genres
  to authenticated;

create policy "titles: publicado ou admin lê" on public.titles for select
  to anon, authenticated using (status = 'published' or (select public.is_admin()));
create policy "titles: admin escreve" on public.titles for all
  to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "title_translations: visível ou admin lê" on public.title_translations for select
  to anon, authenticated using ((select public.is_title_visible(title_id)) or (select public.is_admin()));
create policy "title_translations: admin escreve" on public.title_translations for all
  to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "seasons: visível ou admin lê" on public.seasons for select
  to anon, authenticated using ((select public.is_title_visible(title_id)) or (select public.is_admin()));
create policy "seasons: admin escreve" on public.seasons for all
  to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "episodes: visível ou admin lê" on public.episodes for select
  to anon, authenticated using ((select public.is_episode_visible(id)) or (select public.is_admin()));
create policy "episodes: admin escreve" on public.episodes for all
  to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "episode_translations: visível ou admin lê" on public.episode_translations for select
  to anon, authenticated using ((select public.is_episode_visible(episode_id)) or (select public.is_admin()));
create policy "episode_translations: admin escreve" on public.episode_translations for all
  to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "subtitles: visível ou admin lê" on public.subtitles for select
  to anon, authenticated using ((select public.is_episode_visible(episode_id)) or (select public.is_admin()));
create policy "subtitles: admin escreve" on public.subtitles for all
  to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- Gêneros são referência pública (nomes para filtro de catálogo) — qualquer um lê, só admin escreve.
create policy "genres: todos leem" on public.genres for select
  to anon, authenticated using (true);
create policy "genres: admin escreve" on public.genres for all
  to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "title_genres: visível ou admin lê" on public.title_genres for select
  to anon, authenticated using ((select public.is_title_visible(title_id)) or (select public.is_admin()));
create policy "title_genres: admin escreve" on public.title_genres for all
  to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
