-- Story 2.4 — Bucket de Storage para as legendas (.vtt). Primeira vez que o projeto usa Storage.
--
-- Decisão (registrada para o @architect, ver story 2.4): leitura pública, escrita só admin. Diferente do
-- video_ref (que nunca pode ser público — ver arquitetura, "Controle de acesso ao vídeo"), o arquivo de
-- legenda em si não identifica nem dá acesso ao vídeo; o Épico 3 (player) vai precisar buscá-lo direto do
-- navegador do assinante, então uma URL assinada só adicionaria complexidade sem ganho real de segurança.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('legendas', 'legendas', true, 262144, array['text/vtt', 'text/plain'])
on conflict (id) do nothing;

create policy "legendas: leitura publica"
  on storage.objects for select
  to public
  using (bucket_id = 'legendas');

create policy "legendas: admin envia"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'legendas' and (select public.is_admin()));

create policy "legendas: admin atualiza"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'legendas' and (select public.is_admin()))
  with check (bucket_id = 'legendas' and (select public.is_admin()));

create policy "legendas: admin apaga"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'legendas' and (select public.is_admin()));
