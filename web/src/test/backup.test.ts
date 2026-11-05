import { beforeEach, describe, expect, it } from 'vitest'
import { createBackup, formatBytes, importBackup, isLegacyProgressExport, isUnifiedBackup } from '../lib/backup'
import { useProgressStore, type ProgressExport } from '../store/useProgressStore'
import { useSettingsStore } from '../store/useSettingsStore'
import { useStoryStore } from '../store/useStoryStore'
import { favoriteId, useFavoritesStore } from '../store/useFavoritesStore'

const LEGACY: ProgressExport = {
  app: 'efspd-trainer',
  schemaVersion: 1,
  exportedAt: '2026-01-01T00:00:00.000Z',
  cards: {},
  daily: {},
  sessions: [],
  streak: { current: 2, longest: 4, lastStudyDate: '2026-01-01' },
}

beforeEach(() => {
  useProgressStore.getState().resetAll()
  useSettingsStore.getState().reset()
  useStoryStore.getState().reset()
  useFavoritesStore.getState().reset()
})

describe('unified backup', () => {
  it('detects legacy progress and unified backup formats', () => {
    expect(isLegacyProgressExport(LEGACY)).toBe(true)
    expect(isUnifiedBackup(createBackup())).toBe(true)
    expect(isUnifiedBackup({ app: 'something-else' })).toBe(false)
  })

  it('imports an old progress-only backup without touching other stores', () => {
    useStoryStore.getState().importStory({ careerPoints: 88, rankLevel: 4 })
    const result = importBackup(LEGACY)
    expect(result.imported).toEqual(['progress'])
    expect(useProgressStore.getState().streak.current).toBe(2)
    expect(useStoryStore.getState().careerPoints).toBe(88)
  })

  it('round-trips progress, settings, story, and favorites', () => {
    useSettingsStore.getState().update({ dailyGoal: 42, ttsRate: 1.1 })
    useStoryStore.getState().importStory({
      careerPoints: 320,
      rankLevel: 6,
      streak: 7,
      lastCheckIn: '2026-11-05',
    })
    useStoryStore.getState().setCareerTrack('fullstack')
    useStoryStore.getState().learnInsight('vp:board', 3)
    useFavoritesStore.getState().add({
      id: favoriteId('word', 'recuse'),
      kind: 'word',
      title: 'recuse',
      zh: '回避',
      color: 'pink',
    })

    const backup = createBackup()
    useSettingsStore.getState().reset()
    useStoryStore.getState().reset()
    useFavoritesStore.getState().reset()

    const result = importBackup(backup)
    expect(result.imported).toEqual(['progress', 'settings', 'story', 'favorites'])
    expect(useSettingsStore.getState().dailyGoal).toBe(42)
    expect(useSettingsStore.getState().ttsRate).toBe(1.1)
    expect(useStoryStore.getState().careerPoints).toBe(320)
    expect(useStoryStore.getState().rankLevel).toBe(6)
    expect(useStoryStore.getState().careerTrack).toBe('fullstack')
    expect(useStoryStore.getState().insight).toBe(13)
    expect(useFavoritesStore.getState().items['word:recuse'].color).toBe('pink')
  })

  it('skips unknown future modules instead of failing the import', () => {
    const backup = createBackup() as unknown as {
      stores: Record<string, unknown>
    }
    backup.stores.futureModule = { version: 9, data: { anything: true } }
    const result = importBackup(backup)
    expect(result.skipped).toContain('futureModule')
    expect(result.imported).toContain('progress')
  })

  it('rejects malformed files', () => {
    expect(() => importBackup({ hello: 'world' })).toThrow('无法识别的备份格式')
  })
})

describe('formatBytes', () => {
  it('formats small and large sizes', () => {
    expect(formatBytes(0)).toBe('0 B')
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(2048)).toBe('2.0 KB')
    expect(formatBytes(3 * 1024 * 1024)).toBe('3.0 MB')
  })
})
