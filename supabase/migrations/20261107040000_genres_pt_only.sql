-- Story 1.5 — Produto só em português: genres.name_en/name_es deixam de ser obrigatórios.
-- As colunas continuam existindo (schema flexível, caso o produto volte a ser multilíngue no futuro);
-- só o formulário do admin para de pedir/enviar esses valores (ver web/src/app/[lang]/admin/generos).

alter table public.genres alter column name_en drop not null;
alter table public.genres alter column name_es drop not null;
