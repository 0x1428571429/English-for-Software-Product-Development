import { describe, expect, it } from 'vitest'
import {
  buildCloze,
  checkCloze,
  maskWord,
  splitSurfaceToken,
  suggestTypingGrade,
  wordsMatch,
} from './cloze'

describe('buildCloze', () => {
  it('blanks content words and keeps punctuation attached', () => {
    const prompt = buildCloze('We should circle back after standup.', { seed: 7 })
    expect(prompt.blanks.map((blank) => blank.answer)).toEqual(['circle', 'standup'])
    const standup = prompt.blanks.find((blank) => blank.answer === 'standup')
    expect(standup?.suffix).toBe('.')
    expect(standup?.prefix).toBe('')
    expect(prompt.tokens.some((token) => token.text === 'standup.')).toBe(true)
  })

  it('is deterministic for the same seed', () => {
    const left = buildCloze("Let's align on the rollout plan before Friday.", { seed: 42 })
    const right = buildCloze("Let's align on the rollout plan before Friday.", { seed: 42 })
    expect(left.blanks.map((blank) => blank.answer)).toEqual(right.blanks.map((blank) => blank.answer))
  })

  it('scales the number of blanks with sentence length and respects maxBlanks', () => {
    expect(buildCloze('Ship it.', { seed: 1 }).blanks).toHaveLength(1)
    expect(buildCloze('We need a clear rollout plan for the migration.', { seed: 1 }).blanks).toHaveLength(2)
    expect(
      buildCloze('We need a clear rollout plan for the migration before the team starts the work.', {
        seed: 1,
        maxBlanks: 2,
      }).blanks,
    ).toHaveLength(2)
  })

  it('still blanks a word when every word is a stop word', () => {
    const prompt = buildCloze('It is up to you.', { seed: 1 })
    expect(prompt.blanks.length).toBe(1)
    expect(prompt.blanks[0].answer.length).toBeGreaterThan(0)
  })

  it('handles punctuation around a blank and empty input safely', () => {
    const prompt = buildCloze('(Standup) is at nine.', { seed: 3 })
    expect(prompt.blanks[0].answer).toBe('Standup')
    expect(prompt.blanks[0].prefix).toBe('(')
    expect(prompt.blanks[0].suffix).toBe(')')
    expect(buildCloze('', { seed: 1 }).blanks).toHaveLength(0)
  })
})

describe('splitSurfaceToken', () => {
  it('separates leading and trailing punctuation from the word', () => {
    expect(splitSurfaceToken('"ship,"')).toEqual({ prefix: '"', core: 'ship', suffix: ',"' })
    expect(splitSurfaceToken("don't,")).toEqual({ prefix: '', core: "don't", suffix: ',' })
    expect(splitSurfaceToken('---')).toBeNull()
  })
})

describe('wordsMatch', () => {
  it('ignores case, punctuation, and apostrophes', () => {
    expect(wordsMatch('Standup', 'standup')).toBe(true)
    expect(wordsMatch('dont', "don't")).toBe(true)
    expect(wordsMatch('do not', "don't")).toBe(true)
    expect(wordsMatch('standup.', 'standup')).toBe(true)
  })

  it('rejects empty or different words', () => {
    expect(wordsMatch('', 'standup')).toBe(false)
    expect(wordsMatch('stand', 'standup')).toBe(false)
  })
})

describe('checkCloze', () => {
  const prompt = buildCloze('We should circle back after standup.', { seed: 7 })

  it('reports per-blank correctness and the first wrong blank', () => {
    const result = checkCloze(prompt, ['circle', 'standup'])
    expect(result).toEqual({ correct: true, perBlank: [true, true], firstWrong: -1 })

    const wrong = checkCloze(prompt, ['circle', 'stanup'])
    expect(wrong.correct).toBe(false)
    expect(wrong.perBlank).toEqual([true, false])
    expect(wrong.firstWrong).toBe(1)
  })

  it('treats missing values as wrong', () => {
    const result = checkCloze(prompt, [])
    expect(result.correct).toBe(false)
    expect(result.perBlank).toEqual([false, false])
  })
})

describe('maskWord', () => {
  it('reveals letters progressively and keeps apostrophes', () => {
    expect(maskWord('standup')).toBe('•••••••')
    expect(maskWord('standup', 1)).toBe('s••••••')
    expect(maskWord('standup', 2)).toBe('st•••••')
    expect(maskWord("don't", 1)).toBe("d••'•")
  })
})

describe('suggestTypingGrade', () => {
  it('rewards unaided fast answers and punishes hints or reveal', () => {
    expect(suggestTypingGrade({ revealed: false, attempts: 0, hintsUsed: 0, elapsedMs: 3000 })).toBe(4)
    expect(suggestTypingGrade({ revealed: false, attempts: 0, hintsUsed: 0, elapsedMs: 9000 })).toBe(3)
    expect(suggestTypingGrade({ revealed: false, attempts: 1, hintsUsed: 0, elapsedMs: 3000 })).toBe(2)
    expect(suggestTypingGrade({ revealed: false, attempts: 0, hintsUsed: 1, elapsedMs: 3000 })).toBe(2)
    expect(suggestTypingGrade({ revealed: true, attempts: 0, hintsUsed: 1, elapsedMs: 3000 })).toBe(1)
  })
})
