-- Story 1.3 — Contas, perfis de quem assiste e papel de admin.

-- Admin: definido em auth.users.raw_app_meta_data.role = 'admin' (só o servidor/painel do Supabase altera).
create or replace function public.is_admin()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

-- Atualiza updated_at automaticamente.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Conta: 1 por usuário do Auth.
create table public.accounts (
  id uuid primary key references auth.users (id) on delete cascade,
  locale text not null default 'pt' check (locale in ('pt', 'en', 'es')),
  country text,
  first_touch jsonb,          -- UTM / landing de origem na primeira visita
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger accounts_updated_at
  before update on public.accounts
  for each row execute function public.set_updated_at();

alter table public.accounts enable row level security;

create policy "accounts: dono ou admin lê"
  on public.accounts for select
  to authenticated
  using ((select auth.uid()) = id or (select public.is_admin()));

create policy "accounts: dono atualiza"
  on public.accounts for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Perfis de quem assiste (até 4 por conta).
create table public.viewer_profiles (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 30),
  avatar text,
  is_kids boolean not null default false,
  created_at timestamptz not null default now()
);

create index viewer_profiles_account_id_idx on public.viewer_profiles (account_id);

create or replace function public.enforce_profile_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select count(*) from public.viewer_profiles where account_id = new.account_id) >= 4 then
    raise exception 'Limite de 4 perfis por conta' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger viewer_profiles_limit
  before insert on public.viewer_profiles
  for each row execute function public.enforce_profile_limit();

alter table public.viewer_profiles enable row level security;

create policy "perfis: dono ou admin lê"
  on public.viewer_profiles for select
  to authenticated
  using ((select auth.uid()) = account_id or (select public.is_admin()));

create policy "perfis: dono cria"
  on public.viewer_profiles for insert
  to authenticated
  with check ((select auth.uid()) = account_id);

create policy "perfis: dono atualiza"
  on public.viewer_profiles for update
  to authenticated
  using ((select auth.uid()) = account_id)
  with check ((select auth.uid()) = account_id);

create policy "perfis: dono apaga"
  on public.viewer_profiles for delete
  to authenticated
  using ((select auth.uid()) = account_id);

-- Ao cadastrar: cria a conta e o primeiro perfil.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  user_locale text := new.raw_user_meta_data ->> 'locale';
  display_name text := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
    split_part(new.email, '@', 1),
    'Perfil'
  );
begin
  insert into public.accounts (id, locale, first_touch)
  values (
    new.id,
    case when user_locale in ('pt', 'en', 'es') then user_locale else 'pt' end,
    new.raw_user_meta_data -> 'first_touch'
  );

  insert into public.viewer_profiles (account_id, name)
  values (new.id, left(display_name, 30));

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Funções internas não devem ser chamáveis pela API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.enforce_profile_limit() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;
