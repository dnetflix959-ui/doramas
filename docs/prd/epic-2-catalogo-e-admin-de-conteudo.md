# Épico 2 — Catálogo e admin de conteúdo

**Status:** Draft · **Depende de:** Épico 1 (Fundação) — Concluído

## Objetivo
Dar ao Gustavo um painel para cadastrar títulos (séries e filmes), temporadas e episódios a partir de um link
do YouTube, com traduções, legendas e controle de rascunho/publicação — sem tocar em código. Entrega do catálogo
no PRD (`docs/prd/index.md`, seção 8).

## Contexto do sistema existente
- **Stack:** Next.js (App Router) + TypeScript em `web/`, Supabase (Postgres + RLS + Auth), conforme
  `docs/architecture/index.md`.
- **Já existe:** contas e perfis (`accounts`, `viewer_profiles`), autenticação com `is_admin()`, coleta de eventos
  (`analytics_events`, `sessions`), área `/admin` protegida pelo proxy (story 1.3) mas sem conteúdo ainda.
- **Modelo de dados previsto** (arquitetura, "Modelo de dados"): `titles` (kind: series|movie, slug, status,
  featured), `title_translations`, `seasons`, `episodes` (video_provider, video_ref, duration_s, intro_start_s,
  intro_end_s, credits_start_s, release_at, is_free), `episode_translations`, `subtitles`, `genres`, `title_genres`.

## Requisitos funcionais cobertos (PRD)
- FR5 — Títulos do tipo série (temporadas → episódios) ou filme.
- FR19 — CMS de títulos, temporadas, episódios, traduções, gêneros, imagens, legendas, marcações de
  abertura/créditos, rascunho/publicar/agendar, destaque da home.

## Fora do escopo deste épico
- Páginas públicas do catálogo (home, página do título) — Épico 8.
- Player e eventos de reprodução — Épico 3.
- Landing pages por título — Épico 5.
- Upload de vídeo: o vídeo continua hospedado no YouTube; o admin só guarda o link/ID (`video_provider: youtube`).

## Compatibilidade
- [ ] RLS em todas as novas tabelas (leitura pública só do que está publicado; escrita só admin).
- [ ] Área `/admin` já protegida pela story 1.3 (login + `is_admin()`); este épico só adiciona páginas dentro dela.
- [ ] Nenhuma mudança nas tabelas de contas/autenticação ou de eventos.

## Stories
1. **2.1 — Esquema do catálogo**
   - `titles`, `title_translations`, `seasons`, `episodes`, `episode_translations`, `subtitles`, `genres`,
     `title_genres`, com RLS (leitura pública só de títulos/episódios publicados; escrita só admin).
   - **Executor:** `@data-engineer` · **Quality gate:** `@dev`
   - **Quality gate tools:** `[schema_validation, migration_review, rls_test]`
   - **Foco:** chaves estrangeiras, enums (`kind`, `status`, `video_provider`), unicidade de slug por idioma.

2. **2.2 — Admin: títulos e temporadas**
   - Lista e formulário de títulos (dados + traduções por idioma), criação de temporadas, rascunho/publicar/agendar,
     marcar destaque na home.
   - **Executor:** `@dev` · **Quality gate:** `@architect`
   - **Quality gate tools:** `[code_review, pattern_validation]`
   - **Foco:** validação de formulário, estados rascunho/agendado/publicado, só admin acessa.

3. **2.3 — Admin: episódios por link do YouTube**
   - Formulário de episódio a partir de um link/ID do YouTube (preenche duração quando possível), marcação de
     início/fim da abertura e dos créditos, episódio gratuito, data de lançamento.
   - **Executor:** `@dev` · **Quality gate:** `@architect`
   - **Quality gate tools:** `[code_review, pattern_validation, security_check]`
   - **Foco:** extrair o ID do YouTube de formatos variados de URL; nunca expor o ID fora do admin/`/api/play`
     (regra já vigente, arquitetura "Controle de acesso ao vídeo").

4. **2.4 — Admin: legendas e traduções**
   - Upload de arquivos `.vtt` por episódio e idioma; edição de traduções de sinopse/título/episódio; gêneros.
   - **Executor:** `@dev` · **Quality gate:** `@architect`
   - **Quality gate tools:** `[code_review, pattern_validation]`
   - **Foco:** um `.vtt` por episódio/idioma, tamanho máximo do arquivo, texto em pt/en/es.

## Risco principal e mitigação
- **Risco:** nenhum dado de catálogo existe ainda; qualquer erro de schema nas stories 2.2–2.4 fica caro de corrigir
  depois (slugs/IDs já em uso em landing pages futuras).
- **Mitigação:** a story 2.1 (schema) passa por quality gate do `@dev` antes de qualquer story de admin começar;
  nenhuma story de UI roda em paralelo com o schema.
- **Rollback:** tabelas novas, sem dados de produção ainda — uma migration de reversão basta se necessário.

## Definição de pronto do épico
- [ ] Stories 2.1–2.4 com critérios de aceite atendidos e QA gate (PASS/CONCERNS/WAIVED).
- [ ] Um título de teste completo (série com 1 temporada e 2 episódios) cadastrado e publicado via admin, sem SQL manual.
- [ ] RLS confirmado: visitante não logado não lê rascunhos; só admin escreve.

## Handoff para @sm
Desenvolver as 4 stories listadas, em ordem (2.1 antes de 2.2–2.4). Cada story deve seguir o padrão das stories do
Épico 1 (Escopo, Dependências, Complexidade, Riscos, Tarefas, Notas de desenvolvimento, Testes) e referenciar este
épico e `docs/architecture/index.md`. Nenhum dado deve ser inventado além do que está aqui e no PRD/arquitetura.
