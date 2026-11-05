import type {
  Card,
  Chapter,
  Corpus,
  Dialogue,
  Expression,
  PronunciationItem,
  VocabItem,
} from './types'

export interface CorpusIndex {
  chapterById: Map<string, Chapter>
  cardsByChapter: Map<string, Card[]>
  cardsByKind: Map<string, Card[]>
  dialogueByChapter: Map<string, Dialogue>
  expressionsByChapter: Map<string, Expression[]>
  vocabByChapter: Map<string, VocabItem[]>
  pronunciationByChapter: Map<string, PronunciationItem[]>
  allCards: Card[]
}

let cachedCorpus: Corpus | null = null
let loadingPromise: Promise<Corpus> | null = null

export async function loadCorpus(): Promise<Corpus> {
  if (cachedCorpus) return cachedCorpus
  if (!loadingPromise) {
    loadingPromise = import('./corpus.generated.json').then((module) => {
      const data = (module.default ?? module) as unknown as Corpus
      cachedCorpus = data
      return data
    })
  }
  return loadingPromise
}

export function buildIndex(corpus: Corpus): CorpusIndex {
  const chapterById = new Map(corpus.chapters.map((chapter) => [chapter.id, chapter]))
  const cardsByChapter = new Map<string, Card[]>()
  const cardsByKind = new Map<string, Card[]>()
  const dialogueByChapter = new Map(corpus.dialogues.map((dialogue) => [dialogue.chapterId, dialogue]))
  const expressionsByChapter = new Map<string, Expression[]>()
  const vocabByChapter = new Map<string, VocabItem[]>()
  const pronunciationByChapter = new Map<string, PronunciationItem[]>()

  for (const card of corpus.cards) {
    if (!card.practiceable) continue
    const chapterKey = card.chapterId ?? '__all__'
    if (!cardsByChapter.has(chapterKey)) cardsByChapter.set(chapterKey, [])
    cardsByChapter.get(chapterKey)!.push(card)
    if (!cardsByKind.has(card.kind)) cardsByKind.set(card.kind, [])
    cardsByKind.get(card.kind)!.push(card)
  }

  for (const expression of corpus.expressions) {
    if (!expressionsByChapter.has(expression.chapterId)) expressionsByChapter.set(expression.chapterId, [])
    expressionsByChapter.get(expression.chapterId)!.push(expression)
  }

  for (const item of corpus.vocab) {
    if (!vocabByChapter.has(item.chapterId)) vocabByChapter.set(item.chapterId, [])
    vocabByChapter.get(item.chapterId)!.push(item)
  }

  for (const item of corpus.pronunciation) {
    for (const chapterId of item.chapterIds) {
      if (!pronunciationByChapter.has(chapterId)) pronunciationByChapter.set(chapterId, [])
      pronunciationByChapter.get(chapterId)!.push(item)
    }
  }

  return {
    chapterById,
    cardsByChapter,
    cardsByKind,
    dialogueByChapter,
    expressionsByChapter,
    vocabByChapter,
    pronunciationByChapter,
    allCards: corpus.cards.filter((card) => card.practiceable),
  }
}

export function cardsForChapter(index: CorpusIndex, chapterId: string | null): Card[] {
  return index.cardsByChapter.get(chapterId ?? '__all__') ?? []
}

export function chapterTitle(index: CorpusIndex, chapterId: string | null, fallback = '综合'): string {
  if (!chapterId) return fallback
  return index.chapterById.get(chapterId)?.titleZh ?? chapterId
}

export function searchCorpus(
  corpus: Corpus,
  query: string,
  limit = 60,
): { cards: Card[]; expressions: Expression[] } {
  const term = query.trim().toLowerCase()
  if (!term) return { cards: [], expressions: [] }
  const matches = (value: string | null | undefined) => String(value ?? '').toLowerCase().includes(term)
  const cards = corpus.cards
    .filter(
      (card) =>
        card.practiceable &&
        (matches(card.promptZh) ||
          matches(card.primaryAnswer) ||
          card.acceptedAnswers.some((answer) => matches(answer)) ||
          matches(card.explanationZh)),
    )
    .slice(0, limit)
  const expressions = corpus.expressions
    .filter(
      (expression) =>
        matches(expression.titleEn) ||
        matches(expression.meaningZh) ||
        expression.alternatives.some((answer) => matches(answer)),
    )
    .slice(0, limit)
  return { cards, expressions }
}

export function getCardById(corpus: Corpus, id: string): Card | undefined {
  return corpus.cards.find((card) => card.id === id)
}
