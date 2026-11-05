import { beforeEach, describe, expect, it } from 'vitest'
import { INSIGHT_START, type StoryQuality } from '../data/story'
import { useStoryStore, type StoryRecord } from '../store/useStoryStore'

function record(episodeId: string, extra: Partial<StoryRecord> = {}): StoryRecord {
  return {
    episodeId,
    endingId: 'good' as StoryQuality,
    endingTitleZh: '好结局',
    score: 6,
    goodChoices: 3,
    totalChoices: 3,
    completedAt: '2026-11-05T00:00:00.000Z',
    challengePassed: true,
    careerPointsEarned: 0,
    ...extra,
  }
}

describe('story store', () => {
  beforeEach(() => {
    useStoryStore.getState().reset()
  })

  it('starts with a clean track and baseline insight', () => {
    const state = useStoryStore.getState()
    expect(state.careerTrack).toBeNull()
    expect(state.insight).toBe(INSIGHT_START)
    expect(state.firedCount).toBe(0)
  })

  it('grants insight once per choice and never farms replays', () => {
    const store = useStoryStore.getState()
    expect(store.learnInsight('standup:a1-good', 2)).toBe(2)
    expect(useStoryStore.getState().insight).toBe(INSIGHT_START + 2)
    expect(useStoryStore.getState().learnInsight('standup:a1-good', 2)).toBe(0)
    expect(useStoryStore.getState().insight).toBe(INSIGHT_START + 2)
    expect(useStoryStore.getState().learnInsight('standup:a1-ok', -5)).toBe(0)
    expect(useStoryStore.getState().insight).toBe(INSIGHT_START + 2)
  })

  it('uses the chosen track for promotion titles', () => {
    useStoryStore.getState().setCareerTrack('fullstack')
    const reward = useStoryStore.getState().recordEnding(
      { ...record('layoff'), challengePassed: true },
      50,
      6,
    )
    expect(reward.rankUp).toBe(true)
    expect(reward.rankLevel).toBe(6)
    expect(reward.rankTitleZh).toContain('全栈')
    expect(useStoryStore.getState().rankLevel).toBe(6)
  })

  it('locks the track after a track-specific episode is completed', () => {
    expect(useStoryStore.getState().setCareerTrack('frontend')).toBe(true)
    useStoryStore.getState().recordEnding(record('design-system'), 30)
    expect(useStoryStore.getState().setCareerTrack('fullstack')).toBe(false)
    expect(useStoryStore.getState().careerTrack).toBe('frontend')
    expect(useStoryStore.getState().setCareerTrack('frontend')).toBe(true)
  })

  it('counts fired endings and keeps the best record on replay', () => {
    const store = useStoryStore.getState()
    store.recordEnding(record('forbidden-file', { endingId: 'bad', fired: true, score: -6 }), 25)
    expect(useStoryStore.getState().firedCount).toBe(1)
    expect(useStoryStore.getState().records['forbidden-file'].fired).toBe(true)

    useStoryStore.getState().recordEnding(record('forbidden-file', { score: 6 }), 25)
    const saved = useStoryStore.getState().records['forbidden-file']
    expect(saved.score).toBe(6)
    expect(saved.fired).toBe(true)
    // Fired once; replaying with a better ending does not fire you again.
    expect(useStoryStore.getState().firedCount).toBe(1)
    // Replay never pays base points twice; the first clear paid 25 + 20 challenge.
    expect(useStoryStore.getState().careerPoints).toBe(45)
  })

  it('round-trips track, insight, learned choices, and fired count', () => {
    useStoryStore.getState().setCareerTrack('fullstack')
    useStoryStore.getState().learnInsight('vp:x', 3)
    useStoryStore.getState().recordEnding(record('forbidden-file', { fired: true }), 25)
    const snapshot = useStoryStore.getState().exportStory()

    useStoryStore.getState().reset()
    expect(useStoryStore.getState().careerTrack).toBeNull()

    useStoryStore.getState().importStory(snapshot)
    expect(useStoryStore.getState().careerTrack).toBe('fullstack')
    expect(useStoryStore.getState().insight).toBe(INSIGHT_START + 3)
    expect(useStoryStore.getState().learnedInsights['vp:x']).toBe(3)
    expect(useStoryStore.getState().firedCount).toBe(1)
  })
})
