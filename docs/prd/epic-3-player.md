# Épico 3 — Player próprio

**Status:** Draft · **Depende de:** Épico 1 (Fundação) e Épico 2 (Catálogo) — ambos Concluídos

## Objetivo
Um player sobre o vídeo do YouTube, com controles próprios, progresso salvo, legendas, pular abertura e
avançar para o próximo episódio — entrega do PRD FR8 e da seção "Player" de `docs/architecture/index.md`.

## Contexto do sistema existente
- **Catálogo pronto** (Épico 2): `titles`, `seasons`, `episodes` (com `video_ref`, `intro_start_s`,
  `intro_end_s`, `credits_start_s`), `subtitles` (URL pública no bucket `legendas`).
- **Coleta de eventos pronta** (story 1.4): `track(name, props)` em `src/lib/analytics/track.ts`, grava em
  `analytics_events` via `/api/events`. Os eventos de reprodução (`play`, `pause`, `seek`, `heartbeat`,
  `complete`, `skip_intro`, `subtitle_change`, `next_episode`) já estão documentados na arquitetura — este
  épico só precisa chamar `track()` nos momentos certos, sem schema novo para eventos.
- **Produto só em português** (story 1.5): sem seletor de idioma; legendas só em pt.

## Decisão importante: controle de acesso sem assinatura ainda
A arquitetura descreve `/api/play` conferindo `subscriptions.status in ('active','trialing')` — mas
`subscriptions`/`plans` (Épico 4, Assinaturas) **ainda não existem**. Para não bloquear o player em uma
dependência que ainda não foi construída:
- **Nesta fase, `/api/play` libera** quem está logado **e** o episódio é `is_free = true` **ou** é admin.
- Quando o Épico 4 existir, `/api/play` ganha mais uma condição (assinatura ativa) — sem mudar o contrato do
  endpoint nem o player. Registrar isso como dívida explícita, não just "esquecer" a checagem de assinatura.

## Requisitos funcionais cobertos (PRD)
- FR8 — Player próprio sobre vídeo do YouTube: controles próprios, retomar, próximo episódio, pular
  abertura, legendas .vtt em português, velocidade, atalhos e gestos, telas de pausa/fim próprias.
- FR7 (parcial) — Episódios com progresso (na página do título, fora do escopo aqui — Épico 8).

## Fora do escopo deste épico
- Verificação de assinatura de verdade (Épico 4) — ver decisão acima.
- Páginas públicas do catálogo/título (Épico 8) — o player aqui é testado via uma rota própria, não a
  página final do assinante.
- Pixels/landing pages (Épico 5), notificações (Épico 6), painel de análise (Épico 7 — mas os eventos já
  ficam gravados, prontos para quando o painel existir).
- Adaptador Bunny Stream (`BunnySource`) — todo o catálogo hoje é YouTube; a interface `VideoSource` já
  nasce pronta para o Bunny entrar depois sem reescrever o player (NFR6), mas só `YouTubeSource` é implementado.

## Compatibilidade
- [ ] Nenhuma mudança em tabelas do Épico 1/2; `watch_progress` é tabela nova.
- [ ] `/api/play` é rota nova — não existe conflito com rotas atuais.
- [ ] RLS em `watch_progress` desde a criação (dono só vê o próprio progresso; admin vê tudo, mesmo padrão
  das outras tabelas).

## Stories
1. **3.1 — Esquema de progresso e `/api/play`**
   - `watch_progress` (profile_id, episode_id, position_s, completed, updated_at). `GET /api/play/{episodeId}`:
     confere login + (gratuito ou admin) + devolve `{ provider, ref }`; nunca expõe `video_ref` fora disso.
   - **Executor:** `@data-engineer` (schema) + `@dev` (endpoint) · **Quality gate:** `@architect`
   - **Foco:** RLS de `watch_progress`; `/api/play` não vaza `video_ref` para quem não tem acesso; rate limit
     (mesmo padrão de `/api/events`, já citado na arquitetura "Segurança").

2. **3.2 — Player sobre YouTube**
   - Componente `Player` com a interface `VideoSource` (`load, play, pause, seek, currentTime, duration,
     on(event)`); `YouTubeSource` via IFrame API (`youtube-nocookie.com`, `controls=0, rel=0,
     iv_load_policy=3, disablekb=1, playsinline=1, modestbranding`), camada transparente bloqueando cliques
     diretos no iframe; controles próprios (play/pause, barra de progresso, volume, velocidade, tela cheia).
   - **Executor:** `@dev` · **Quality gate:** `@architect`
   - **Foco:** respeitar os termos da API do YouTube (não esconder marca/player — ver "Riscos aceitos com o
     YouTube" na arquitetura); atalhos de teclado e gestos no touch.

3. **3.3 — Progresso, retomar e próximo episódio**
   - Salva `watch_progress` periodicamente (via `heartbeat`) e ao sair; opção "retomar de onde parou" ao
     abrir um episódio já iniciado; avança para o próximo episódio automaticamente ao terminar (se existir).
   - **Executor:** `@dev` · **Quality gate:** `@architect`
   - **Foco:** não perder progresso se a aba fechar sem aviso (mesmo padrão de `sendBeacon` da story 1.4).

4. **3.4 — Legendas e marcações (abertura/créditos)**
   - Legenda `.vtt` (buscada do bucket `legendas`, já público desde a story 2.4) renderizada pelo componente
     próprio, sincronizada com `currentTime`; botão "pular abertura" usando `intro_start_s`/`intro_end_s`;
     tela de créditos a partir de `credits_start_s`.
   - **Executor:** `@dev` · **Quality gate:** `@architect`
   - **Foco:** funciona sem legenda cadastrada (não quebra se `subtitles` estiver vazio); acessibilidade
     (NFR5 — contraste, navegação por teclado).

5. **3.5 — Eventos de reprodução**
   - Chama `track()` (já existente) nos momentos certos: `play`, `pause`, `seek`, `heartbeat` (15 s),
     `complete`, `skip_intro`, `subtitle_change`, `next_episode` — com `episode_id`/`title_id` em `props`.
   - **Executor:** `@dev` · **Quality gate:** `@architect`
   - **Foco:** não duplicar lógica de consentimento/lote (já pronta em `src/lib/analytics/track.ts`, story 1.4).

## Risco principal e mitigação
- **Risco:** sem a checagem de assinatura real (Épico 4 ainda não existe), qualquer pessoa logada poderia
  tentar acessar `/api/play` de um episódio pago diretamente pela URL.
- **Mitigação:** `/api/play` só libera episódios `is_free = true` (ou admin) nesta fase — nenhum episódio
  pago fica acessível até o Épico 4 existir; a decisão está documentada aqui e deve ser revisitada
  explicitamente quando a story de assinatura for criada.
- **Rollback:** `/api/play` e `watch_progress` são aditivos — desligar o player não afeta nada do catálogo.

## Definição de pronto do épico
- [ ] Stories 3.1–3.5 com critérios de aceite atendidos e QA gate (PASS/CONCERNS/WAIVED).
- [ ] Um episódio gratuito de teste reproduz do início ao fim pelo player, com progresso salvo, legenda (se
  cadastrada) e avanço automático para o próximo episódio.
- [ ] `/api/play` testado: nega quem não está logado; nega episódio pago para não-admin; libera gratuito/admin.

## Handoff para @sm
Desenvolver as 5 stories listadas, em ordem (3.1 antes das demais — o player depende do endpoint e da
tabela de progresso). Cada story segue o padrão das stories dos Épicos 1/2 (Escopo, Dependências,
Complexidade, Riscos, Tarefas, Notas de desenvolvimento, Testes) e referencia este épico e
`docs/architecture/index.md` ("Player", "Controle de acesso ao vídeo", "Riscos aceitos com o YouTube").
