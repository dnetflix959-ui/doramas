# Especificação de front-end e design

## Regra de ouro: identidade própria
Não copiar a Netflix nem nenhum outro streaming: nada de fundo preto com vermelho, banner gigante sangrando a tela
com fileiras de pôsteres em carrossel embaixo, logo em caixa alta vermelha. Usamos só padrões universais de interface
(barra de navegação, botão de play, barra de progresso), com forma e organização nossas.

## Conceito: "Folhetim"
Dorama é história contada em capítulos, com estreia em dia marcado. A identidade trata o app como uma
**revista semanal de folhetins coreanos**: capa da semana, grade de estreias, capítulos numerados, estantes por
emoção. Referências visuais: papel hanji, cerâmica celadon e o carimbo vermelho-alaranjado (dojang) das assinaturas
coreanas — usados como cor e detalhe, nunca como enfeite caricato.

### O que torna o app reconhecível
1. **Capa da semana** em vez de banner: moldura com margem, título grande em serifa, número do capítulo gigante
   em contorno ("08"), título vertical na lateral da arte.
2. **Grade da semana**: Seg a Dom com o que estreia em cada dia; hoje destacado. É a "TV guide" do serviço.
3. **Capítulos, não episódios**: "Capítulo 9 — O jantar". O progresso é uma linha fina, como marcador de página.
4. **Estantes por emoção** em grade (não carrossel): Para suspirar, Para chorar, Para rir, Para roer as unhas, Histórico.
5. **Cartão com lombada**: cada título tem uma faixa lateral com o nome na vertical, como a lombada de um livro.
6. **Carimbo**: selos "NOVO" e "AO VIVO" são carimbos redondos cor de caqui.

## Cores (tokens)
| Token | Uso | Valor |
|---|---|---|
| `--bg` | fundo (tinta azulada, não preto puro) | `#13171A` |
| `--surface` | cartões, menus | `#1B2024` |
| `--surface-2` | hover, campos | `#242A2F` |
| `--line` | divisórias, molduras | `#313840` |
| `--text` | texto principal (papel hanji) | `#F1EBDF` |
| `--text-muted` | texto secundário | `#9AA3A6` |
| `--accent` | ação principal, progresso, dia de hoje (celadon) | `#9CC9B4` |
| `--accent-ink` | texto sobre o celadon | `#0F1A15` |
| `--seal` | carimbos NOVO / AO VIVO (caqui) | `#D9774B` |
Vermelho não é cor de marca. O celadon é a cor que as pessoas vão associar ao serviço.

## Tipografia
- **Títulos**: "Gowun Batang" 700 — serifa de origem coreana, com desenho latino próprio. Dá o tom editorial.
- **Interface e texto**: "Instrument Sans" 400/500/600.
- **Numerais de capítulo**: Gowun Batang em contorno (`-webkit-text-stroke`), tamanhos 96–160 px.
- Escala: 12 · 14 · 16 · 18 · 22 · 28 · 36 · 48 · 64 px. Altura de linha 1,55 no texto, 1,1 nos títulos.

## Espaço, forma e movimento
- Grade de 4 px; margens laterais 16 px (celular), 32 px (tablet), 56 px (desktop); conteúdo até 1280 px.
- Molduras finas (1 px `--line`) e margens generosas, como página impressa. Raio 2 px nos cartões, pílula só em chips.
- Movimento curto (150–220 ms): cartão levanta 2 px no hover, troca de dia na grade desliza. Respeitar `prefers-reduced-motion`.

## Navegação
- Seções: **Hoje** · **Grade** · **Explorar** · **Minha lista** · **Perfil**.
- Celular: barra inferior com essas 5 seções. Desktop/TV: barra superior sólida com borda inferior, sino e perfil à direita.
- Landing pages: sem menu, só logo, troca de idioma e um botão "Assinar".

## Componentes
CoverStory (capa da semana), WeekGuide (grade), ContinueList (capítulos em andamento), MoodShelf (estante por emoção
com chips), TitleCard (cartão com lombada), Seal (carimbo), Button/ButtonLink, IconButton, Input, Badge, Skeleton,
Sheet/Dialog, Toast, Tabs, EmptyState. Ícones: Lucide, traço 1,75 px.

## Telas principais
- **Hoje**: capa da semana → continuar lendo/assistindo → grade da semana → estantes por emoção.
- **Título**: arte emoldurada à esquerda com lombada, sinopse e ficha à direita; lista de capítulos numerados com
  título, duração e marcador de progresso; botão "Assistir capítulo 3" ou "Começar".
- **Player**: tela cheia, controles somem após 3 s; título do capítulo no canto; "Pular abertura";
  ao fim, cartão "Próximo capítulo" com o número grande e contagem.
- **Landing do título**: a capa do título como uma capa de revista na primeira dobra (trailer emoldurado),
  headline, botão "Assinar e assistir", capítulos, personagens, preço, FAQ.
- **Admin**: menu lateral, números grandes no topo, gráficos simples, tabelas com filtros.

## Textos (tom de voz)
- Direto e caloroso: "Capítulo novo de *Amor em Seul* hoje às 20h", "Você parou no capítulo 8".
- Evitar: "Descubra", "Explore", "Experiência única", "Mergulhe", e jargão de streaming copiado de outros serviços.
