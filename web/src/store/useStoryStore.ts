import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  CHALLENGE_BONUS,
  INSIGHT_START,
  STORY_EPISODES,
  careerRank,
  type CareerTrack,
  type StoryQuality,
} from '../data/story'
import { createAppStorage } from '../lib/storage'

export interface StoryRecord {
  episodeId: string
  endingId: StoryQuality
  endingTitleZh: string
  score: number
  goodChoices: number
  totalChoices: number
  completedAt: string
  challengePassed: boolean
  careerPointsEarned: number
  insightEarned?: number
  fired?: boolean
}

export interface StoryReward {
  baseEarned: number
  challengeBonus: number
  earned: number
  challengePassed: boolean
  rankUp: boolean
  rankLevel: number
  rankTitleZh: string
  firstClear: boolean
  fired: boolean
}

export interface StorySnapshot {
  records: Record<string, StoryRecord>
  careerPoints: number
  rankLevel: number
  checkIns: Record<string, boolean>
  streak: number
  lastCheckIn: string | null
  careerTrack: CareerTrack | null
  insight: number
  /** choiceKey -> insight already granted. Replaying the same choice never farms insight. */
  learnedInsights: Record<string, number>
  firedCount: number
}

interface StoryState extends StorySnapshot {
  recordEnding: (record: StoryRecord, basePoints: number, promotionTo?: number) => StoryReward
  setCareerTrack: (track: CareerTrack) => boolean
  learnInsight: (choiceKey: string, amount: number) => number
  checkIn: () => number
  exportStory: () => StorySnapshot
  importStory: (snapshot: Partial<StorySnapshot>) => void
  reset: () => void
}

function dateKey(date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function yesterdayKey(): string {
  const date = new Date()
  date.setDate(date.getDate() - 1)
  return dateKey(date)
}

function inferredRank(points: number, promoted: boolean): number {
  if (promoted) return 5
  if (points >= 200) return 4
  if (points >= 100) return 3
  if (points >= 40) return 2
  return 1
}

export const useStoryStore = create<StoryState>()(
  persist(
    (set, get) => ({
      records: {},
      careerPoints: 0,
      rankLevel: 1,
      checkIns: {},
      streak: 0,
      lastCheckIn: null,
      careerTrack: null,
      insight: INSIGHT_START,
      learnedInsights: {},
      firedCount: 0,

      recordEnding: (record, basePoints, promotionTo) => {
        const state = get()
        const previous = state.records[record.episodeId]
        const firstClear = !previous
        const challengeJustPassed = record.challengePassed && !previous?.challengePassed
        const baseEarned = firstClear ? basePoints : 0
        const challengeBonus = challengeJustPassed ? CHALLENGE_BONUS : 0
        const earned = baseEarned + challengeBonus
        const rankUp = Boolean(record.challengePassed && promotionTo && promotionTo > state.rankLevel)
        const rankLevel = rankUp ? (promotionTo as number) : state.rankLevel

        const best =
          previous && previous.score > record.score
            ? {
                ...previous,
                completedAt: record.completedAt,
                challengePassed: previous.challengePassed || record.challengePassed,
                careerPointsEarned: (previous.careerPointsEarned ?? 0) + earned,
                fired: previous.fired || record.fired,
              }
            : {
                ...record,
                challengePassed: record.challengePassed || Boolean(previous?.challengePassed),
                careerPointsEarned: (previous?.careerPointsEarned ?? 0) + earned,
                fired: record.fired || Boolean(previous?.fired),
              }

        set({
          records: { ...state.records, [record.episodeId]: best },
          careerPoints: state.careerPoints + earned,
          rankLevel,
          firedCount: state.firedCount + (record.fired ? 1 : 0),
        })

        return {
          baseEarned,
          challengeBonus,
          earned,
          challengePassed: record.challengePassed,
          rankUp,
          rankLevel,
          rankTitleZh: careerRank(rankLevel, state.careerTrack ?? 'frontend').titleZh,
          firstClear,
          fired: Boolean(record.fired),
        }
      },

      setCareerTrack: (track) => {
        const state = get()
        const playedTrack = STORY_EPISODES.find(
          (episode) => episode.track && state.records[episode.id],
        )?.track
        if (playedTrack && playedTrack !== track) return false
        set({ careerTrack: track })
        return true
      },

      learnInsight: (choiceKey, amount) => {
        if (amount <= 0) return 0
        const state = get()
        if (state.learnedInsights[choiceKey]) return 0
        set({
          insight: state.insight + amount,
          learnedInsights: { ...state.learnedInsights, [choiceKey]: amount },
        })
        return amount
      },

      checkIn: () => {
        const state = get()
        const today = dateKey()
        if (state.lastCheckIn === today) return state.streak
        const streak = state.lastCheckIn === yesterdayKey() ? state.streak + 1 : 1
        set({
          checkIns: { ...state.checkIns, [today]: true },
          lastCheckIn: today,
          streak,
        })
        return streak
      },

      exportStory: () => {
        const state = get()
        return {
          records: state.records,
          careerPoints: state.careerPoints,
          rankLevel: state.rankLevel,
          checkIns: state.checkIns,
          streak: state.streak,
          lastCheckIn: state.lastCheckIn,
          careerTrack: state.careerTrack,
          insight: state.insight,
          learnedInsights: state.learnedInsights,
          firedCount: state.firedCount,
        }
      },

      importStory: (snapshot) =>
        set((state) => ({
          records: snapshot.records ?? {},
          careerPoints: snapshot.careerPoints ?? 0,
          rankLevel: snapshot.rankLevel ?? 1,
          checkIns: snapshot.checkIns ?? {},
          streak: snapshot.streak ?? 0,
          lastCheckIn: snapshot.lastCheckIn ?? null,
          careerTrack: snapshot.careerTrack ?? null,
          insight: snapshot.insight ?? INSIGHT_START,
          learnedInsights: snapshot.learnedInsights ?? {},
          firedCount: snapshot.firedCount ?? 0,
          recordEnding: state.recordEnding,
          setCareerTrack: state.setCareerTrack,
          learnInsight: state.learnInsight,
          checkIn: state.checkIn,
          exportStory: state.exportStory,
          importStory: state.importStory,
          reset: state.reset,
        })),

      reset: () =>
        set({
          records: {},
          careerPoints: 0,
          rankLevel: 1,
          checkIns: {},
          streak: 0,
          lastCheckIn: null,
          careerTrack: null,
          insight: INSIGHT_START,
          learnedInsights: {},
          firedCount: 0,
        }),
    }),
    {
      name: 'efspd.story.v1',
      storage: createAppStorage(),
      version: 4,
      migrate: (persisted) => {
        const state = (persisted ?? {}) as Partial<StoryState> & { promoted?: boolean }
        const careerPoints = state.careerPoints ?? 0
        return {
          ...state,
          records: state.records ?? {},
          careerPoints,
          rankLevel: state.rankLevel ?? inferredRank(careerPoints, state.promoted ?? false),
          checkIns: state.checkIns ?? {},
          streak: state.streak ?? 0,
          lastCheckIn: state.lastCheckIn ?? null,
          careerTrack: state.careerTrack ?? null,
          insight: state.insight ?? INSIGHT_START,
          learnedInsights: state.learnedInsights ?? {},
          firedCount: state.firedCount ?? 0,
        } as StoryState
      },
    },
  ),
)
