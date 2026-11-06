# Arquitetura

## Stack
| Camada | Tecnologia |
|---|---|
| App web | Next.js (App Router) + TypeScript, em `web/` |
| Estilo | Tailwind CSS com tokens próprios (`web/src/app/globals.css`) |
| Idiomas | Suporte nativo do Next.js 16: rotas `app/[lang]`, `next/root-params`, `src/proxy.ts`; dicionários JSON em `src/i18n/` (padrão `pt`) |
| Banco/Auth/Arquivos | Supabase: Postgres + RLS, Auth (link mágico + Google), Storage, Edge Functions, Cron |
| Vídeo | YouTube IFrame Player API (vídeos não listados) com controles próprios; adaptador Bunny Stream para o futuro |
| Pagamentos | Lowify (checkout + webhook), atrás da interface `BillingProvider` |
| Notificações | Web Push (VAPID) via service worker do PWA, avisos no app, e-mail via Resend |
| Gráficos do admin | Recharts |
| Hospedagem | Vercel (projeto com diretório raiz `web/`) |
| Testes | Vitest (unidade), Playwright (e2e) |

## Ambientes
Por enquanto há **um único projeto Supabase**, usado em todos os lugares:

| Ambiente | Supabase | Onde é usado |
|---|---|---|
| **Único (teste por enquanto)** | organização "Doraminha", ref `uktrllgocaxweijgbixm` (us-east-1), `https://uktrllgocaxweijgbixm.supabase.co` | máquina local (`web/.env.local`) e Vercel (previews e Production) |
| **Produção** | **pendente** — a criar na mesma conta/organização antes do lançamento | só o ambiente Production da Vercel |

- **Pendente antes do lançamento:** criar o banco de produção separado (pedido do Gustavo) na conta nova. O plano
  gratuito permite 2 projetos ativos. Ao criar, aplicar todas as migrations de `supabase/migrations/` em ordem e
  apontar só o ambiente Production da Vercel para ele.
- Os projetos antigos da conta "SAAS Gustavo" (`dorama-streaming`, ref `ifcjsfkkotzzztpocfnz`, e
  `dorama-streaming-prod`, ref `ouaxabinmihkuoooozzf`) **ficaram sem uso** e não são mais acessados por este app.
- Toda mudança de banco é uma migration em `supabase/migrations/`, aplicada **primeiro no teste**, testada, e só
  depois em produção. Nunca editar o banco de produção à mão.
- Plano gratuito: projetos ficam pausados após 7 dias sem uso. Antes do lançamento, passar a produção para o plano
  Pro (sem pausa, com backups diários).

## Visão geral
```
Navegador (Next.js, PWA, service worker, player próprio + iframe YouTube)
   └──► Servidor Next.js (Vercel)
          ├─ Supabase: Auth, Postgres (RLS), Storage, Edge Functions, Cron
          ├─ /api/play/{episódio}   → confere assinatura → devolve ID do vídeo ou URL assinada
          ├─ /api/events            ◄── eventos de uso (lotes)
          ├─ /api/webhooks/lowify   ◄── Lowify (pagamentos)
          └─ notificações: Web Push, avisos no app, e-mail
```

## Estrutura de pastas (web/)
```
web/src/
  app/[lang]/(site)/        páginas públicas: início, título, assistir/[slug] (landing), planos, entrar
  app/[lang]/(app)/         área do assinante: navegar, título, player, minha lista, busca, conta, avisos
  app/[lang]/admin/         painel admin
  app/api/                    play, events, webhooks/lowify, push
  components/ui/              componentes base do design system
  components/player/          Player + adaptadores youtube/bunny
  config/site.ts              nome, URLs, idiomas
  i18n/                       idiomas: config.ts, dictionaries.ts, dictionaries/{pt,en,es}.json
  proxy.ts                    redireciona para o idioma certo (cookie ou navegador)
  lib/supabase/               clientes server/browser
  lib/billing/                BillingProvider + lowify
  lib/analytics/track.ts      coleta de eventos
```

## Controle de acesso ao vídeo
1. O player pede `GET /api/play/{episodeId}`.
2. O servidor confere sessão + `subscriptions.status in ('active','trialing')` e `current_period_end > now()`
   (ou cortesia, ou episódio gratuito).
3. Responde `{ provider: 'youtube', ref: '<id>' }` ou `{ provider: 'bunny', url: '<hls assinado 2–4 h>' }`.
4. O ID nunca aparece no HTML público nem na listagem do catálogo.

## Player
`Player` único com interface `VideoSource { load, play, pause, seek, currentTime, duration, on(event) }`.
- `YouTubeSource`: IFrame API com `controls=0, rel=0, iv_load_policy=3, disablekb=1, playsinline=1, modestbranding`,
  host `youtube-nocookie.com`; camada transparente por cima do iframe bloqueia cliques; telas próprias de pausa e fim.
- `BunnySource`: hls.js com URL assinada.
- Legendas .vtt próprias renderizadas pelo nosso componente, sincronizadas com `currentTime`.
- Eventos: play, pause, seek, heartbeat (15 s), complete, skip_intro, subtitle_change, next_episode.

## Riscos aceitos com o YouTube
- Termos da API proíbem cobrir/esconder o player e a marca: risco de aviso ou encerramento do canal.
  Mitigação: canal dedicado; cópia dos vídeos fora do YouTube; troca por título para Bunny via `video_provider`.
- Vídeo não listado é acessível por quem tiver o ID. Mitigação parcial: ID só via `/api/play` para assinantes.
- YouTube pode exibir anúncios e elementos próprios; qualidade escolhida pelo YouTube; sem PiP/offline.

## Cobrança (Lowify)
- Link de checkout por plano com `external_id` do usuário e dados de origem (UTM/landing) quando suportado.
- `POST /api/webhooks/lowify`: valida segredo/assinatura → grava em `billing_events` (único por id do evento)
  → aplica mudança em `subscriptions` → dispara automações (boas-vindas, pagamento recusado).
- Formato exato dos eventos depende da documentação da Lowify (pendente).

## Modelo de dados (resumo — todas as tabelas com RLS)
- **Contas**: `accounts`, `viewer_profiles`
- **Cobrança**: `plans`, `plan_prices`, `subscriptions`, `billing_events`, `coupons`
- **Catálogo**: `titles` (kind: series|movie, slug, status, featured), `title_translations`, `seasons`, `episodes`
  (video_provider, video_ref, duration_s, intro_start_s, intro_end_s, credits_start_s, release_at, is_free),
  `episode_translations`, `subtitles`, `genres`, `title_genres`
- **Landing pages**: `landing_pages` (title_id, locale, blocks jsonb, status), `landing_variants`
- **Uso**: `watch_progress`, `my_list`, `title_follows`, `reminders`
- **Notificações**: `push_subscriptions`, `notification_preferences`, `notification_templates`,
  `notification_campaigns`, `notification_automations`, `notification_deliveries`, `inbox_items`
- **Análise**: `analytics_events` (particionada por mês), `sessions`, `attribution`, `daily_metrics`,
  `daily_title_metrics`, `episode_retention`
- Admin: `auth.users.app_metadata.role = 'admin'`, verificado pela função `is_admin()` nas políticas.

## Coleta de eventos
`track(name, props)` acumula eventos no navegador e envia em lote (a cada 10 s, ao trocar de página e no
`visibilitychange` via `sendBeacon`) para `/api/events`. O servidor anexa usuário, perfil, sessão, país e dispositivo,
e grava em `analytics_events`. Jobs do Supabase Cron consolidam diariamente em `daily_*` e `episode_retention`.
Sem consentimento de análise, só eventos essenciais e anônimos.

## Segurança
- RLS em todas as tabelas; chave `service_role` só no servidor.
- Webhooks validados e idempotentes; rate limit em `/api/events` e `/api/play`.
- Cabeçalhos de segurança (CSP com YouTube e Supabase liberados), cookies `httpOnly`.
- Segredos só em variáveis de ambiente (`web/.env.local` local, Vercel em produção).
