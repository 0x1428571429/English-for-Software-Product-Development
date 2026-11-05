import type { Card, CardKind } from '../data/types'
import type { CardProgress } from '../store/useProgressStore'
import { isDue, isNew } from './srs'

export type QueueMode = 'due' | 'new' | 'weak' | 'all'

export interface BuildQueueOptions {
  cards: Card[]
  progress: Record<string, CardProgress>
  dailyNewCards: number
  newCardsPerDay: number
  sessionSize: number
  chapterId?: string | null
  kinds?: CardKind[]
  mode?: QueueMode
  seed?: number
}

function shuffled<T>(items: T[], seed = 1): T[] {
  const result = [...items]
  let state = seed >>> 0
  for (let i = result.length - 1; i > 0; i -= 1) {
    state = (state * 1664525 + 1013904223) >>> 0
    const j = state % (i + 1)
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/** Avoid running the same chapter three cards in a row. */
function interleaveByChapter(cards: Card[]): Card[] {
  const buckets = new Map<string, Card[]>()
  for (const card of cards) {
    const key = card.chapterId ?? 'general'
    if (!buckets.has(key)) buckets.set(key, [])
    buckets.get(key)!.push(card)
  }
  const keys = [...buckets.keys()]
  const result: Card[] = []
  let lastKey: string | null = null
  while (result.length < cards.length) {
    const available = keys.filter((key) => buckets.get(key)!.length > 0)
    if (!available.length) break
    const nextKey = available.find((key) => key !== lastKey) ?? available[0]
    result.push(buckets.get(nextKey)!.shift()!)
    lastKey = nextKey
  }
  return result
}

export function buildQueue({
  cards,
  progress,
  dailyNewCards,
  newCardsPerDay,
  sessionSize,
  chapterId = null,
  kinds,
  mode = 'due',
  seed = Date.now(),
}: BuildQueueOptions): Card[] {
  const pool = cards.filter((card) => {
    if (!card.practiceable) return false
    if (chapterId && card.chapterId !== chapterId) return false
    if (kinds?.length && !kinds.includes(card.kind)) return false
    return true
  })

  const due: Card[] = []
  const fresh: Card[] = []
  const weak: Card[] = []

  for (const card of pool) {
    const item = progress[card.id]
    const snapshot = item?.fsrs
    if (isNew(snapshot)) {
      fresh.push(card)
    } else if (isDue(snapshot)) {
      due.push(card)
    }
    if (item && (item.lapses >= 3 || item.lastRating <= 2)) weak.push(card)
  }

  const newAllowance = Math.max(0, newCardsPerDay - dailyNewCards)
  const dueSorted = [...due].sort(
    (a, b) =>
      new Date(progress[a.id]!.fsrs.due).getTime() - new Date(progress[b.id]!.fsrs.due).getTime(),
  )
  const freshShuffled = shuffled(fresh, seed)
  const weakShuffled = shuffled(weak, seed + 17)

  let ordered: Card[] = []
  if (mode === 'new') {
    ordered = freshShuffled
  } else if (mode === 'weak') {
    ordered = weakShuffled
  } else if (mode === 'all') {
    ordered = shuffled(pool, seed)
  } else {
    ordered = [...dueSorted, ...freshShuffled.slice(0, newAllowance)]
    if (ordered.length < sessionSize) {
      const chosen = new Set(ordered.map((card) => card.id))
      ordered = ordered.concat(weakShuffled.filter((card) => !chosen.has(card.id)))
    }
    if (ordered.length < sessionSize) {
      const chosen = new Set(ordered.map((card) => card.id))
      ordered = ordered.concat(freshShuffled.filter((card) => !chosen.has(card.id)))
    }
  }

  const unique = []
  const seen = new Set<string>()
  for (const card of ordered) {
    if (seen.has(card.id)) continue
    seen.add(card.id)
    unique.push(card)
  }
  return interleaveByChapter(unique).slice(0, sessionSize)
}

export function countDue(cards: Card[], progress: Record<string, CardProgress>): number {
  return cards.filter((card) => {
    const item = progress[card.id]
    return Boolean(item && !isNew(item.fsrs) && isDue(item.fsrs))
  }).length
}

export function countNew(cards: Card[], progress: Record<string, CardProgress>): number {
  return cards.filter((card) => isNew(progress[card.id]?.fsrs)).length
}

export function countWeak(cards: Card[], progress: Record<string, CardProgress>): number {
  return cards.filter((card) => {
    const item = progress[card.id]
    return Boolean(item && (item.lapses >= 3 || item.lastRating <= 2))
  }).length
}
