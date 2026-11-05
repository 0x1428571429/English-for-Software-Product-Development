import type { Card, Chapter } from '../data/types'
import type { CardProgress, DailyStat } from '../store/useProgressStore'
import { dateKey } from '../store/useProgressStore'
import { isMature } from './srs'

export function median(values: number[]): number {
  if (!values.length) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle]
}

export function percentile(values: number[], p: number): number {
  if (!values.length) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1))
  return sorted[index]
}

export function todayStat(daily: Record<string, DailyStat>): DailyStat {
  return daily[dateKey()] ?? {
    reviews: 0,
    correct: 0,
    newCards: 0,
    totalMs: 0,
    durations: [],
    byMode: {},
  }
}

export function accuracy(stat: DailyStat): number {
  return stat.reviews ? stat.correct / stat.reviews : 0
}

export function reactionMedian(stat: DailyStat): number {
  return median(stat.durations)
}

export function percent(value: number): string {
  return `${Math.round(value * 100)}%`
}

export interface ChapterMastery {
  chapterId: string
  titleZh: string
  total: number
  studied: number
  mature: number
  coverage: number
  accuracy: number
  fastRate: number
  mastery: number
}

export function chapterMastery(
  chapters: Chapter[],
  cards: Card[],
  progress: Record<string, CardProgress>,
  fastThresholdMs = 5000,
): ChapterMastery[] {
  return chapters.map((chapter) => {
    const chapterCards = cards.filter((card) => card.chapterId === chapter.id)
    let studied = 0
    let mature = 0
    let correct = 0
    let totalReviews = 0
    let fastCorrect = 0
    for (const card of chapterCards) {
      const item = progress[card.id]
      if (!item) continue
      studied += 1
      if (isMature(item.fsrs)) mature += 1
      correct += item.correct
      totalReviews += item.total
      const recent = item.recentMs.length ? median(item.recentMs) : Infinity
      if (item.lastRating >= 3 && recent <= fastThresholdMs) fastCorrect += 1
    }
    const total = chapterCards.length
    const coverage = total ? studied / total : 0
    const chapterAccuracy = totalReviews ? correct / totalReviews : 0
    const fastRate = studied ? fastCorrect / studied : 0
    return {
      chapterId: chapter.id,
      titleZh: chapter.titleZh,
      total,
      studied,
      mature,
      coverage,
      accuracy: chapterAccuracy,
      fastRate,
      mastery: coverage * 0.45 + chapterAccuracy * 0.35 + fastRate * 0.2,
    }
  })
}

export interface ExperimentCard {
  total: number
  recentMs: number[]
  lastRating: number
  firstMs?: number
  firstRating?: number
}

export interface LearningExperiment {
  cards: number
  firstMedianMs: number | null
  recentMedianMs: number | null
  /** Fractional reduction in median response time; 0.35 means 35% faster. */
  speedGain: number | null
  firstAccuracy: number | null
  recentAccuracy: number | null
  fastRate: number | null
}

/**
 * Within-item pre/post measurement: for every card reviewed at least twice,
 * compare the very first response with the most recent one. This is a single-
 * group pre/post design (not a randomized controlled trial), but it directly
 * answers the training question: after repetition, is the same expression
 * recalled faster and more accurately?
 */
export function learningExperiment(
  progress: Record<string, ExperimentCard>,
  fastThresholdMs = 2000,
): LearningExperiment {
  const items = Object.values(progress).filter(
    (item) => item.total >= 2 && item.firstMs != null && item.recentMs.length > 0,
  )
  if (!items.length) {
    return {
      cards: 0,
      firstMedianMs: null,
      recentMedianMs: null,
      speedGain: null,
      firstAccuracy: null,
      recentAccuracy: null,
      fastRate: null,
    }
  }

  const firstTimes = items.map((item) => item.firstMs as number)
  const recentTimes = items.map((item) => item.recentMs[item.recentMs.length - 1])
  const firstMedianMs = median(firstTimes)
  const recentMedianMs = median(recentTimes)
  const firstCorrect = items.filter((item) => (item.firstRating ?? 0) >= 3).length
  const recentCorrect = items.filter((item) => item.lastRating >= 3).length
  const fast = items.filter(
    (item) =>
      item.lastRating >= 3 &&
      item.recentMs[item.recentMs.length - 1] <= fastThresholdMs,
  ).length

  return {
    cards: items.length,
    firstMedianMs,
    recentMedianMs,
    speedGain: firstMedianMs > 0 ? 1 - recentMedianMs / firstMedianMs : null,
    firstAccuracy: firstCorrect / items.length,
    recentAccuracy: recentCorrect / items.length,
    fastRate: fast / items.length,
  }
}

export function lastNDays(n: number, daily: Record<string, DailyStat>): { date: string; stat: DailyStat }[] {  const result = []
  for (let i = n - 1; i >= 0; i -= 1) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const key = dateKey(date)
    result.push({
      date: key,
      stat: daily[key] ?? { reviews: 0, correct: 0, newCards: 0, totalMs: 0, durations: [], byMode: {} },
    })
  }
  return result
}

export function heatmapWeeks(weeks: number, daily: Record<string, DailyStat>): { date: string; count: number }[][] {
  const columns: { date: string; count: number }[][] = []
  const today = new Date()
  const end = new Date(today)
  end.setDate(end.getDate() + (6 - ((end.getDay() + 6) % 7)))
  const start = new Date(end)
  start.setDate(start.getDate() - weeks * 7 + 1)
  const cursor = new Date(start)
  for (let week = 0; week < weeks; week += 1) {
    const column: { date: string; count: number }[] = []
    for (let day = 0; day < 7; day += 1) {
      const key = dateKey(cursor)
      column.push({ date: key, count: daily[key]?.reviews ?? 0 })
      cursor.setDate(cursor.getDate() + 1)
    }
    columns.push(column)
  }
  return columns
}
