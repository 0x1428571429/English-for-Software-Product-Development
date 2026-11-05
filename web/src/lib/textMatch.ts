const CONTRACTIONS: Record<string, string> = {
  "i'm": 'i am',
  "i've": 'i have',
  "i'll": 'i will',
  "i'd": 'i would',
  "you're": 'you are',
  "you've": 'you have',
  "you'll": 'you will',
  "we're": 'we are',
  "we've": 'we have',
  "we'll": 'we will',
  "they're": 'they are',
  "they've": 'they have',
  "they'll": 'they will',
  "he's": 'he is',
  "she's": 'she is',
  "it's": 'it is',
  "that's": 'that is',
  "there's": 'there is',
  "what's": 'what is',
  "let's": 'let us',
  "don't": 'do not',
  "doesn't": 'does not',
  "didn't": 'did not',
  "can't": 'cannot',
  "couldn't": 'could not',
  "won't": 'will not',
  "wouldn't": 'would not',
  "shouldn't": 'should not',
  "isn't": 'is not',
  "aren't": 'are not',
  "wasn't": 'was not',
  "weren't": 'were not',
  "haven't": 'have not',
  "hasn't": 'has not',
  "hadn't": 'had not',
  "i'd like": 'i would like',
}

export function normalizeAnswer(value: string): string {
  let text = String(value ?? '')
    .normalize('NFKC')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/…/g, '...')
    .toLowerCase()
    .trim()

  for (const [short, long] of Object.entries(CONTRACTIONS)) {
    text = text.replace(new RegExp(`\\b${short.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g'), long)
  }

  return text
    .replace(/[^a-z0-9' ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function tokens(value: string): string[] {
  const normalized = normalizeAnswer(value)
  return normalized ? normalized.split(' ') : []
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i += 1) {
    const row = [i]
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      row[j] = Math.min(row[j - 1] + 1, previous[j] + 1, previous[j - 1] + cost)
    }
    previous = row
  }
  return previous[b.length]
}

export function characterSimilarity(a: string, b: string): number {
  const max = Math.max(a.length, b.length)
  if (!max) return 1
  return 1 - levenshtein(a, b) / max
}

export function tokenSimilarity(a: string, b: string): number {
  const left = new Set(tokens(a))
  const right = new Set(tokens(b))
  if (!left.size && !right.size) return 1
  let intersection = 0
  for (const token of left) if (right.has(token)) intersection += 1
  const union = new Set([...left, ...right]).size
  return union ? intersection / union : 0
}

export type DiffStatus = 'same' | 'missing' | 'extra'

export interface DiffToken {
  token: string
  status: DiffStatus
}

/** Word-level diff: shows what the learner typed vs. the target. */
export function diffWords(input: string, target: string): DiffToken[] {
  const left = tokens(input)
  const right = tokens(target)
  const dp: number[][] = Array.from({ length: left.length + 1 }, () => Array(right.length + 1).fill(0))
  for (let i = 1; i <= left.length; i += 1) {
    for (let j = 1; j <= right.length; j += 1) {
      dp[i][j] =
        left[i - 1] === right[j - 1]
          ? dp[i - 1][j - 1] + 1
          : Math.max(dp[i - 1][j], dp[i][j - 1])
    }
  }
  const result: DiffToken[] = []
  let i = left.length
  let j = right.length
  while (i > 0 && j > 0) {
    if (left[i - 1] === right[j - 1]) {
      result.push({ token: right[j - 1], status: 'same' })
      i -= 1
      j -= 1
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      result.push({ token: left[i - 1], status: 'extra' })
      i -= 1
    } else {
      result.push({ token: right[j - 1], status: 'missing' })
      j -= 1
    }
  }
  while (i > 0) {
    result.push({ token: left[i - 1], status: 'extra' })
    i -= 1
  }
  while (j > 0) {
    result.push({ token: right[j - 1], status: 'missing' })
    j -= 1
  }
  return result.reverse()
}

export interface MatchResult {
  correct: boolean
  almost: boolean
  score: number
  matchedAnswer: string | null
  diff: DiffToken[]
}

export function matchAnswer(input: string, accepted: string[]): MatchResult {
  const normalizedInput = normalizeAnswer(input)
  if (!normalizedInput) {
    return { correct: false, almost: false, score: 0, matchedAnswer: null, diff: [] }
  }

  let best: { answer: string; score: number } | null = null
  for (const answer of accepted) {
    const normalizedAnswer = normalizeAnswer(answer)
    if (!normalizedAnswer) continue
    if (normalizedInput === normalizedAnswer) {
      return {
        correct: true,
        almost: true,
        score: 1,
        matchedAnswer: answer,
        diff: diffWords(input, answer),
      }
    }
    const score = Math.max(
      characterSimilarity(normalizedInput, normalizedAnswer),
      tokenSimilarity(normalizedInput, normalizedAnswer) * 0.96,
    )
    if (!best || score > best.score) best = { answer, score }
  }

  if (!best) {
    return { correct: false, almost: false, score: 0, matchedAnswer: null, diff: [] }
  }

  return {
    correct: best.score >= 0.88,
    almost: best.score >= 0.62,
    score: best.score,
    matchedAnswer: best.answer,
    diff: diffWords(input, best.answer),
  }
}

export function wordErrorRate(input: string, target: string): number {
  const left = tokens(input)
  const right = tokens(target)
  if (!right.length) return left.length ? 1 : 0
  return levenshtein(left.join(' '), right.join(' ')) / Math.max(left.join(' ').length, right.join(' ').length)
}

export function formatMs(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return '—'
  if (ms < 1000) return `${Math.round(ms)}ms`
  return `${(ms / 1000).toFixed(1)}s`
}
