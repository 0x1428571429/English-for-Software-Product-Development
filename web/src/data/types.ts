export type CardKind = 'dialogue' | 'expression' | 'vocab' | 'highFrequency' | 'mistake'

export interface Chapter {
  id: string
  order: number
  titleZh: string
  titleEn: string
}

export interface CardSource {
  file?: string
  line?: number
  heading?: string
  speaker?: string
}

export interface Card {
  id: string
  kind: CardKind
  chapterId: string | null
  promptZh: string
  contextZh?: string | null
  contextEn?: string | null
  primaryAnswer: string
  acceptedAnswers: string[]
  explanationZh?: string | null
  wrongAnswer?: string
  source?: CardSource
  tags: string[]
  audioText: string
  translationStatus?: 'official' | 'fuzzy' | 'override' | 'missing' | 'n/a'
  practiceable: boolean
}

export interface DialogueLine {
  id: string
  speaker: string
  text: string
  zh?: string | null
  translationStatus?: string
  isStage: boolean
  isChannel: boolean
  timestamp?: string | null
}

export interface Dialogue {
  id: string
  chapterId: string
  format: 'spoken' | 'chat'
  lines: DialogueLine[]
}

export interface ExpressionExample {
  en: string
  zh?: string | null
  section?: string
}

export interface Expression {
  id: string
  chapterId: string
  file: string
  titleEn: string
  meaningZh: string | null
  alternatives: string[]
  usageZh: string[]
  related: { speaker?: string; en: string; zh?: string | null }[]
  mistakes: string[]
  pairs: ExpressionExample[]
}

export interface VocabItem {
  id: string
  chapterId: string
  term: string
  meaningZh: string
  exampleRaw?: string | null
}

export interface PronunciationItem {
  id: string
  word: string
  wrong: string
  correct: string
  chapterIds: string[]
}

export interface HighFrequencyItem {
  id: string
  section: string
  meaningZh: string
  answers: string[]
}

export interface MistakeItem {
  id: string
  wrong: string
  answers: string[]
  noteZh: string
  section: string
}

export interface ScenarioOption {
  en: string
  correct: boolean
}

export interface Scenario {
  id: string
  chapterId: string | null
  promptZh: string
  referenceAnswer: string | null
  examples: string[]
  options?: ScenarioOption[]
}

export interface ChapterReportRow {
  chapterId: string
  titleZh: string
  dialogueLines: number
  translated: number
  coverage: number
  cards: number
}

export interface CorpusReport {
  generatedAt: string
  chapters: number
  dialogueLines: number
  dialogueTranslated: number
  dialogueStage: number
  expressions: number
  expressionAlternatives: number
  vocab: number
  pronunciation: number
  highFrequency: number
  mistakes: number
  scenarios: number
  scenariosWithOptions: number
  cards: number
  cardsByKind: Record<string, number>
  perChapter: ChapterReportRow[]
  warnings: string[]
}

export interface Corpus {
  version: number
  generatedAt: string
  contentVersion: string
  chapters: Chapter[]
  cards: Card[]
  dialogues: Dialogue[]
  expressions: Expression[]
  vocab: VocabItem[]
  pronunciation: PronunciationItem[]
  highFrequency: HighFrequencyItem[]
  mistakes: MistakeItem[]
  scenarios: Scenario[]
  report: CorpusReport
}
