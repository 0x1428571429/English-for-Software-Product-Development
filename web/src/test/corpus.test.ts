import { describe, expect, it } from 'vitest'
import rawCorpus from '../data/corpus.generated.json'
import type { Card, Corpus } from '../data/types'

const corpus = rawCorpus as unknown as Corpus
const CJK = /[㐀-鿿]/
const ANSWER_TOKEN = /[A-Za-z0-9]/

function cardsOf(kind: Card['kind']): Card[] {
  return corpus.cards.filter((card) => card.kind === kind)
}

describe('generated corpus', () => {
  it('contains the expected chapters and a usable number of cards', () => {
    expect(corpus.chapters).toHaveLength(22)
    expect(corpus.cards.length).toBeGreaterThanOrEqual(1200)
    expect(corpus.dialogues.length).toBe(22)
    expect(corpus.report.cards).toBe(corpus.cards.length)
  })

  it('uses unique card ids', () => {
    const ids = corpus.cards.map((card) => card.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('has a Chinese prompt and an English answer on every production card', () => {
    const malformed = corpus.cards.filter((card) => {
      if (CJK.test(card.primaryAnswer) || !ANSWER_TOKEN.test(card.primaryAnswer)) return true
      if (CJK.test(card.promptZh)) return false
      // Vocabulary abbreviations are allowed to use an English expansion as the
      // prompt, e.g. "Continuous Integration" -> "CI".
      return !(card.kind === 'vocab' && /[A-Za-z]/.test(card.promptZh))
    })
    expect(malformed).toEqual([])
  })

  it('never pairs an untranslated example with the parent expression meaning', () => {
    // Regression guard for the bug where "自动化测试不稳定，没人信。" was paired
    // with "That's what PM asked for" because the example had no Chinese line.
    const untranslated = corpus.cards.filter(
      (card) => card.kind === 'expression' && card.translationStatus === 'missing',
    )
    expect(untranslated).toEqual([])
  })

  it('keeps every practiceable card linked to its source file', () => {
    const missingSource = corpus.cards.filter((card) => !card.source?.file)
    expect(missingSource).toEqual([])
  })

  it('has at least one card in every chapter', () => {
    const counts = new Map<string, number>()
    for (const card of corpus.cards) {
      if (card.chapterId) counts.set(card.chapterId, (counts.get(card.chapterId) ?? 0) + 1)
    }
    for (const chapter of corpus.chapters) {
      expect(counts.get(chapter.id) ?? 0, chapter.id).toBeGreaterThan(0)
    }
  })

  it('keeps the four training pools populated', () => {
    expect(cardsOf('dialogue').length).toBeGreaterThanOrEqual(600)
    expect(cardsOf('expression').length).toBeGreaterThanOrEqual(400)
    expect(cardsOf('vocab').length).toBeGreaterThanOrEqual(200)
    expect(cardsOf('highFrequency').length).toBeGreaterThanOrEqual(40)
  })

  it('records the number of skipped untranslated examples in the report', () => {
    expect(corpus.report.skippedUntranslatedExamples).toBeGreaterThan(0)
    expect(corpus.report.warnings.join(' ')).toContain('没有中文翻译')
  })
})
