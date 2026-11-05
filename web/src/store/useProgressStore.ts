import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { isNew, newCardSnapshot, reviewCard, type GradeValue, type SrsSnapshot } from '../lib/srs'

export type PracticeMode = 'reflection' | 'scenario' | 'roleplay' | 'listening' | 'pronunciation'

export interface CardProgress {
  fsrs: SrsSnapshot
  total: number
  correct: number
  lapses: number
  lastRating: GradeValue
  lastReviewedAt: string
  recentMs: number[]
  /** Response time and grade on the very first exposure (for pre/post analysis). */
  firstMs?: number
  firstRating?: GradeValue
  firstReviewedAt?: string
}

export interface DailyStat {
  reviews: number
  correct: number
  newCards: number
  totalMs: number
  durations: number[]
  byMode: Record<string, number>
}

export interface SessionRecord {
  id: string
  finishedAt: string
  mode: PracticeMode
  cards: number
  correct: number
  medianMs: number
  newCards: number
  grades: number[]
}

export interface StreakState {
  current: number
  longest: number
  lastStudyDate: string | null
}

export interface ProgressExport {
  app: 'efspd-trainer'
  schemaVersion: 1
  exportedAt: string
  cards: Record<string, CardProgress>
  daily: Record<string, DailyStat>
  sessions: SessionRecord[]
  streak: StreakState
}

interface RecordReviewInput {
  cardId: string
  rating: GradeValue
  responseMs: number
  mode: PracticeMode
}

interface ProgressState {
  schemaVersion: 1
  cards: Record<string, CardProgress>
  daily: Record<string, DailyStat>
  sessions: SessionRecord[]
  streak: StreakState
  recordReview: (input: RecordReviewInput) => void
  finishSession: (session: Omit<SessionRecord, 'id' | 'finishedAt'>) => void
  importProgress: (payload: ProgressExport) => void
  exportProgress: () => ProgressExport
  resetAll: () => void
}

const EMPTY_STREAK: StreakState = { current: 0, longest: 0, lastStudyDate: null }

export function dateKey(date = new Date()): string {
  return date.toLocaleDateString('sv-SE')
}

function previousDateKey(date = new Date()): string {
  const previous = new Date(date)
  previous.setDate(previous.getDate() - 1)
  return dateKey(previous)
}

function emptyDaily(): DailyStat {
  return { reviews: 0, correct: 0, newCards: 0, totalMs: 0, durations: [], byMode: {} }
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      schemaVersion: 1,
      cards: {},
      daily: {},
      sessions: [],
      streak: EMPTY_STREAK,

      recordReview: ({ cardId, rating, responseMs, mode }) => {
        const now = new Date()
        const today = dateKey(now)
        const yesterday = previousDateKey(now)
        const state = get()
        const existing = state.cards[cardId]
        const wasNew = isNew(existing?.fsrs)
        const base = existing?.fsrs ?? newCardSnapshot(now)
        const reviewed = reviewCard(base, rating, now).card
        const previous = existing ?? {
          fsrs: base,
          total: 0,
          correct: 0,
          lapses: 0,
          lastRating: 3 as GradeValue,
          lastReviewedAt: now.toISOString(),
          recentMs: [],
        }
        const recentMs = [...previous.recentMs, Math.max(0, Math.round(responseMs))].slice(-10)
        const firstMs = previous.firstMs ?? Math.max(0, Math.round(responseMs))
        const firstRating = previous.firstRating ?? rating
        const firstReviewedAt = previous.firstReviewedAt ?? now.toISOString()
        const nextCard: CardProgress = {
          ...previous,
          fsrs: reviewed,
          total: previous.total + 1,
          correct: previous.correct + (rating >= 3 ? 1 : 0),
          lapses: previous.lapses + (rating === 1 ? 1 : 0),
          lastRating: rating,
          lastReviewedAt: now.toISOString(),
          recentMs,
          firstMs,
          firstRating,
          firstReviewedAt,
        }

        const daily = state.daily[today] ?? emptyDaily()
        const nextDaily: DailyStat = {
          ...daily,
          reviews: daily.reviews + 1,
          correct: daily.correct + (rating >= 3 ? 1 : 0),
          newCards: daily.newCards + (wasNew ? 1 : 0),
          totalMs: daily.totalMs + Math.max(0, Math.round(responseMs)),
          durations: [...daily.durations, Math.max(0, Math.round(responseMs))].slice(-300),
          byMode: { ...daily.byMode, [mode]: (daily.byMode[mode] ?? 0) + 1 },
        }

        let streak = state.streak
        if (streak.lastStudyDate !== today) {
          const current = streak.lastStudyDate === yesterday ? streak.current + 1 : 1
          streak = {
            current,
            longest: Math.max(streak.longest, current),
            lastStudyDate: today,
          }
        }

        set({
          cards: { ...state.cards, [cardId]: nextCard },
          daily: { ...state.daily, [today]: nextDaily },
          streak,
        })
      },

      finishSession: (session) => {
        const record: SessionRecord = {
          ...session,
          id: `session:${Date.now()}`,
          finishedAt: new Date().toISOString(),
        }
        set((state) => ({ sessions: [record, ...state.sessions].slice(0, 100) }))
      },

      importProgress: (payload) => set({
        schemaVersion: 1,
        cards: payload.cards ?? {},
        daily: payload.daily ?? {},
        sessions: payload.sessions ?? [],
        streak: payload.streak ?? EMPTY_STREAK,
      }),

      exportProgress: () => ({
        app: 'efspd-trainer',
        schemaVersion: 1,
        exportedAt: new Date().toISOString(),
        cards: get().cards,
        daily: get().daily,
        sessions: get().sessions,
        streak: get().streak,
      }),

      resetAll: () => set({ cards: {}, daily: {}, sessions: [], streak: EMPTY_STREAK }),
    }),
    {
      name: 'efspd.progress.v1',
      version: 1,
      partialize: (state) => ({
        schemaVersion: state.schemaVersion,
        cards: state.cards,
        daily: state.daily,
        sessions: state.sessions,
        streak: state.streak,
      }),
    },
  ),
)
