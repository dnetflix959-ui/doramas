// Dados de exemplo só para a página de demonstração do design system.
// Serão substituídos pelo catálogo do Supabase no Épico 2.

export type Mood = "suspirar" | "chorar" | "rir" | "tensao" | "historico";

export const moods: { id: Mood; label: string }[] = [
  { id: "suspirar", label: "Para suspirar" },
  { id: "chorar", label: "Para chorar" },
  { id: "rir", label: "Para rir" },
  { id: "tensao", label: "Para roer as unhas" },
  { id: "historico", label: "Histórico" },
];

export const weekdays = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"] as const;

export interface DemoTitle {
  slug: string;
  name: string;
  kind: "series" | "movie";
  year: number;
  genres: string[];
  moods: Mood[];
  chapters?: number;
  synopsis: string;
  /** Cor da arte provisória enquanto não há imagem real. */
  tone: string;
  /** Dia de estreia dos capítulos (0 = segunda). Ausente em filmes e séries completas. */
  releaseDay?: number;
  releaseTime?: string;
  /** Capítulo em andamento e progresso dele (0 a 1). */
  watching?: { chapter: number; chapterTitle: string; progress: number };
  /** Próximo capítulo a estrear. */
  nextChapter?: { number: number; title: string };
  isNew?: boolean;
}

export const demoTitles: DemoTitle[] = [
  {
    slug: "amor-em-seul",
    name: "Amor em Seul",
    kind: "series",
    year: 2026,
    genres: ["Romance", "Comédia"],
    moods: ["suspirar", "rir"],
    chapters: 12,
    synopsis:
      "Uma tradutora brasileira aceita um trabalho temporário em Seul e divide o apartamento com o chef que ela mais criticou na internet.",
    tone: "#6E3B34",
    releaseDay: 4,
    releaseTime: "20h",
    watching: { chapter: 7, chapterTitle: "O jantar de quinta", progress: 0.62 },
    nextChapter: { number: 8, title: "A receita da avó" },
    isNew: true,
  },
  {
    slug: "a-ultima-estacao",
    name: "A Última Estação",
    kind: "series",
    year: 2026,
    genres: ["Mistério", "Drama"],
    moods: ["tensao"],
    chapters: 8,
    synopsis: "Toda noite, às 23h47, o último trem de Busan para numa estação que não existe no mapa.",
    tone: "#25343B",
    releaseDay: 1,
    releaseTime: "21h",
    watching: { chapter: 3, chapterTitle: "Plataforma 0", progress: 0.18 },
    nextChapter: { number: 5, title: "Quem desceu primeiro" },
  },
  {
    slug: "flores-de-inverno",
    name: "Flores de Inverno",
    kind: "movie",
    year: 2026,
    genres: ["Drama", "Família"],
    moods: ["chorar"],
    synopsis: "Três irmãs voltam à casa da avó em Jeonju para decidir o destino da floricultura da família.",
    tone: "#4D4232",
  },
  {
    slug: "o-herdeiro-do-palacio",
    name: "O Herdeiro do Palácio",
    kind: "series",
    year: 2026,
    genres: ["Histórico", "Romance"],
    moods: ["historico", "suspirar"],
    chapters: 16,
    synopsis:
      "Na dinastia Joseon, uma criada descobre que o príncipe herdeiro é um impostor — e decide guardar o segredo.",
    tone: "#3D2E45",
    releaseDay: 2,
    releaseTime: "20h",
    nextChapter: { number: 4, title: "O selo do rei" },
    isNew: true,
  },
  {
    slug: "chuva-em-jeju",
    name: "Chuva em Jeju",
    kind: "series",
    year: 2025,
    genres: ["Romance"],
    moods: ["suspirar", "chorar"],
    chapters: 10,
    synopsis: "Um fotógrafo e uma mergulhadora haenyeo ficam presos na ilha durante a temporada de tufões.",
    tone: "#2B4039",
  },
  {
    slug: "codigo-gangnam",
    name: "Código Gangnam",
    kind: "series",
    year: 2025,
    genres: ["Suspense", "Ação"],
    moods: ["tensao"],
    chapters: 10,
    synopsis: "Uma programadora encontra uma falha que pode derrubar o maior banco da Coreia em 72 horas.",
    tone: "#22304A",
    releaseDay: 5,
    releaseTime: "22h",
    nextChapter: { number: 6, title: "Senha mestra" },
  },
  {
    slug: "cafe-das-sete",
    name: "Café das Sete",
    kind: "movie",
    year: 2025,
    genres: ["Comédia", "Romance"],
    moods: ["rir", "suspirar"],
    synopsis: "Um café só abre às sete da manhã, e só para quem está prestes a desistir de alguma coisa.",
    tone: "#5B4026",
  },
  {
    slug: "irmaos-de-sangue",
    name: "Irmãos de Sangue",
    kind: "series",
    year: 2025,
    genres: ["Drama", "Ação"],
    moods: ["chorar", "tensao"],
    chapters: 14,
    synopsis: "Dois irmãos separados na infância se reencontram em lados opostos de uma investigação.",
    tone: "#43262A",
    releaseDay: 0,
    releaseTime: "21h",
    nextChapter: { number: 11, title: "O nome verdadeiro" },
  },
];

export const coverStory = demoTitles[0];
export const inProgress = demoTitles.filter((t) => t.watching);
export const scheduled = demoTitles.filter((t) => t.releaseDay !== undefined);
