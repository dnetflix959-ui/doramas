-- Story 2.2 — Fecha o achado REQ-001 do QA gate da story 2.1: impede trocar titles.kind quando o título
-- já tem seasons (caminho série) ou episodes ligados por title_id (caminho filme).

create or replace function public.enforce_title_kind_immutable_with_content()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.kind is distinct from old.kind then
    if exists (select 1 from public.seasons where title_id = old.id)
       or exists (select 1 from public.episodes where title_id = old.id) then
      raise exception 'não é possível trocar o tipo de um título que já tem temporadas ou episódios'
        using errcode = 'check_violation';
    end if;
  end if;
  return new;
end;
$$;

create trigger titles_kind_immutable_with_content
  before update of kind on public.titles
  for each row execute function public.enforce_title_kind_immutable_with_content();

revoke execute on function public.enforce_title_kind_immutable_with_content() from public, anon, authenticated;
