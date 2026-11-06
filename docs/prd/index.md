# PRD — Streaming por assinatura de doramas feitos com IA

> Nome do produto: **provisório ("Dorama")**. Trocar em `web/src/config/site.ts` quando a marca for definida.
> Versão do documento: 0.2 · Responsável: Gustavo · Status: rascunho aprovado, Épicos 1 e 2 em andamento.
> **Mudança de escopo (2026-11-06):** o produto passa a ser **só em português**, com comercialização só no
> Brasil. Inglês e espanhol saem do escopo (interface, legendas automáticas por idioma, landing pages por
> idioma, notificações por idioma). Ver story de remoção de EN/ES em `docs/stories/`.

## 1. Visão
Um serviço de streaming por assinatura, com identidade visual própria (conceito "Folhetim", ver
`docs/front-end-spec.md` — sem copiar a Netflix ou outros serviços), só com doramas (séries e filmes) criados
pelo Gustavo com IA. O acesso ao catálogo é por assinatura. **O público é o Brasil, produto só em português**
(decisão de 2026-11-06 — antes o plano era um público internacional PT/EN/ES). A aquisição vem de anúncios que
levam a landing pages de cada título; a retenção vem de lançamentos frequentes, notificações e uma experiência
de assistir sem atrito.

## 2. Objetivos
| Objetivo | Como medimos |
|---|---|
| Transformar tráfego pago em assinantes | Conversão visita → assinatura por landing page / campanha |
| Manter o assinante assistindo | Horas assistidas por assinante, taxa de conclusão, churn mensal |
| Dar ao Gustavo controle total | Publicar, notificar e analisar sem tocar em código |
| Custo baixo de operação | Vídeo hospedado no YouTube; infraestrutura em planos gratuitos/baixos no início |

## 3. Públicos
- **Visitante**: chega por anúncio ou link direto, quer ver rápido do que se trata e assinar sem fricção.
- **Assinante**: quer continuar de onde parou, saber quando sai episódio novo, assistir no celular e na TV.
- **Admin (Gustavo)**: publica títulos, cria landing pages, envia notificações e acompanha os números.

## 4. Requisitos funcionais
### Conta e acesso
- FR1 Cadastro e login por link mágico no e-mail e por Google.
- FR2 Até 4 perfis por conta, cada um com progresso e lista próprios.
- FR3 Só assinantes ativos reproduzem episódios; visitantes veem catálogo, páginas e trailers.
- ~~FR4 Interface em português, inglês e espanhol; idioma detectado e trocável.~~ **Removido (2026-11-06):**
  produto só em português — ver nota de escopo no topo do documento.

### Catálogo e reprodução
- FR5 Títulos do tipo série (temporadas → episódios) ou filme.
- FR6 Página inicial com destaque e fileiras: continuar assistindo, novidades, top 10, por gênero/clima, filmes, minha lista.
- FR7 Página do título com sinopse, temporadas, episódios com progresso, trailer, minha lista, seguir para notificações.
- FR8 Player próprio sobre vídeo do YouTube: controles próprios, retomar, próximo episódio, pular abertura,
  legendas .vtt em português, velocidade, atalhos e gestos, telas de pausa/fim próprias.
- FR9 Busca por título, gênero, clima e personagens; página "Em breve" com lembrete.

### Assinatura
- FR10 Página de planos com preço em reais (BRL); checkout pela Lowify.
- FR11 Webhook da Lowify ativa, renova, marca atraso e cancela o acesso automaticamente.
- FR12 Página da conta com status, renovação e link para gerenciar/cancelar.

### Landing pages por título
- FR13 Cada título publicado gera landing page em `/assistir/{slug}`.
- FR14 Editor por blocos no admin, variações A/B, imagem de compartilhamento automática.
- FR15 Captura de UTM/origem e pixels (Meta, Google, TikTok) com eventos de conversão, após consentimento.

### Central de notificações
- FR16 Campanhas com texto, imagem, destino, canais (push, aviso no app, e-mail), público segmentado,
  envio imediato ou agendado, envio de teste, modelos.
- FR17 Automações: novo episódio, lançamento de "em breve", continue assistindo, pagamento recusado,
  boas-vindas, reconquista.
- FR18 Caixa de avisos no app (sino) e preferências por tipo de aviso; limite de frequência e horário silencioso.

### Administração e análise
- FR19 CMS de títulos, temporadas, episódios, gêneros, imagens, legendas (português), marcações de
  abertura/créditos, rascunho/publicar/agendar, destaque da home.
- FR20 Gestão de usuários e assinaturas: busca, ficha completa, cortesia, bloqueio, reprocessar pagamentos.
- FR21 Painel: visão geral (assinantes, MRR, churn, LTV, ativos), funil de aquisição, desempenho de conteúdo
  com curva de abandono, comportamento (navegação, buscas, legendas, horários, dispositivos), coortes, notificações.
- FR22 Filtros por período, comparação com período anterior, exportação CSV.

## 5. Requisitos não funcionais
- NFR1 Interface intuitiva e com acabamento próprio, sem aparência de template de IA (ver `docs/front-end-spec.md`).
- NFR2 Celular primeiro; landing pages com LCP < 2,5 s em 4G.
- NFR3 Segurança: RLS em todas as tabelas; ID de vídeo entregue só pelo servidor a assinantes; webhook validado e idempotente.
- NFR4 Privacidade: consentimento separado (essencial, análise, marketing), LGPD/GDPR, exportação e exclusão de dados.
- NFR5 Acessibilidade: contraste AA, foco visível, navegação por teclado/controle remoto, legendas.
- NFR6 Trocar o provedor de vídeo (YouTube → Bunny) ou de pagamento sem reescrever telas.

## 6. Fora do escopo no lançamento
Apps nativos iOS/Android, download offline, comentários/avaliações (em aberto), múltiplos áudios dublados.

## 7. Riscos
Ver "Riscos aceitos com o YouTube" em `docs/architecture/index.md`. Lowify sem documentação pública de webhook
(o Gustavo fornecerá).

## 8. Épicos
| # | Épico | Entrega |
|---|---|---|
| 1 | Fundação | Projeto Next.js, Supabase, autenticação, design system, coleta de eventos (idiomas EN/ES removidos — ver nota de escopo) |
| 2 | Catálogo e admin de conteúdo | CMS completo, cadastro por link do YouTube, publicar/agendar |
| 3 | Player próprio | Player sobre YouTube, progresso, próximo episódio, legendas, eventos de reprodução |
| 4 | Assinaturas | Planos, Lowify, webhook, bloqueio de acesso, conta |
| 5 | Landing pages por título | Geração automática, editor, A/B, pixels, atribuição |
| 6 | Central de notificações | PWA, push, avisos no app, e-mail, campanhas, automações |
| 7 | Painel de análise e administração | Métricas, funil, conteúdo, comportamento, retenção, usuários |
| 8 | Descoberta e acabamento | Fileiras, busca, minha lista, perfis, em breve |
| 9 | Lançamento | Legal, consentimento, SEO, domínio, monitoramento, backups |

## 9. Perguntas em aberto
- Nome e marca; planos e preços; período de teste; cupons.
- Primeiro episódio grátis? Telas simultâneas por conta?
- Tamanho do catálogo no lançamento, duração dos episódios, ritmo de lançamentos.
- Redes de anúncio prioritárias; comentários/avaliações.
