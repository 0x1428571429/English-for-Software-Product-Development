import { describe, expect, it } from 'vitest'
import {
  dictionarySize,
  lookupPhrase,
  lookupWord,
  normalizeTerm,
} from '../lib/dictionary'

describe('local dictionary', () => {
  it('loads a useful word map from corpus + story glossary', () => {
    expect(dictionarySize).toBeGreaterThan(1000)
  })

  it('normalizes curly quotes, spacing, and punctuation', () => {
    expect(normalizeTerm('  Don’t   Panic! ')).toBe("don't panic")
    expect(normalizeTerm('“Scope Creep”')).toBe('scope creep')
  })

  it('looks up exact words, phrases, and simple inflections', () => {
    expect(lookupWord('blocker')?.zh).toContain('阻碍')
    expect(lookupWord('blockers')?.word).toBe('blocker')
    expect(lookupWord('PRs')?.word).toBe('pr')
    expect(lookupWord('shipped')?.zh).toContain('上线')
    expect(lookupPhrase(['scope', 'creep'])?.entry.zh).toContain('范围')
    expect(lookupPhrase(['on-call'])?.entry.zh).toContain('值班')
  })

  it('returns null for unknown or non-English text', () => {
    expect(lookupWord('zzzznotaword')).toBeNull()
    expect(lookupWord('这是一句中文')).toBeNull()
    expect(lookupPhrase(['not', 'a', 'known', 'phrase'])).toBeNull()
  })
})
