import { describe, expect, it } from 'vitest'
import {
  CAREER_RANKS,
  CAREER_TRACKS,
  STORY_ARCS,
  STORY_CHARACTERS,
  STORY_EPISODES,
  careerProgress,
  careerRank,
  challengePassed,
  choiceScore,
  endingFor,
  episodeChoiceCount,
  episodeLock,
  episodesForArc,
  episodesForTrack,
  nextCareerRank,
  specialtyEpisode,
  storyEpisodeById,
  type CareerTrack,
  type StoryChoice,
  type StoryEpisode,
} from '../data/story'
import { composeAvatar } from '../data/avatar'

function choice(id: string, quality: StoryChoice['quality']): StoryChoice {
  return { id, en: 'x', zh: 'x', quality, noteZh: 'x', next: 'x' }
}

function goodHistory(episode: StoryEpisode): StoryChoice[] {
  return Object.values(episode.beats)
    .flatMap((beat) => beat.choices ?? [])
    .filter((item) => item.quality === 'good')
}

function allTrust(episode: StoryEpisode): Record<string, number> {
  return Object.fromEntries(episode.characters.map((character) => [character.id, 100]))
}

/** Walk every branch of an episode, returning reachable beats and ending tones. */
function walkEpisode(episode: StoryEpisode) {
  const beats = new Set<string>()
  const endings = new Set<string>()
  const seen = new Set<string>()
  const stack: Array<{ id: string; score: number }> = [{ id: episode.start, score: 0 }]

  while (stack.length > 0) {
    const state = stack.pop()!
    const key = `${state.id}:${state.score}`
    if (seen.has(key)) continue
    seen.add(key)
    const beat = episode.beats[state.id]
    expect(beat, `${episode.id}/${state.id}`).toBeTruthy()
    beats.add(state.id)

    if (beat.choices?.length) {
      for (const item of beat.choices) {
        stack.push({ id: item.next, score: state.score + choiceScore(item.quality) })
      }
    } else if (beat.ending === 'auto') {
      endings.add(endingFor(episode, state.score).tone)
    } else if (beat.next) {
      stack.push({ id: beat.next, score: state.score })
    }
  }

  return { beats, endings }
}

describe('story graph', () => {
  it('keeps every arc and episode link consistent', () => {
    expect(STORY_ARCS.length).toBeGreaterThanOrEqual(4)
    for (const episode of STORY_EPISODES) {
      expect(episode.arcId, episode.id).toBeTruthy()
      expect(episodesForArc(episode.arcId).some((item) => item.id === episode.id), episode.id).toBe(true)
    }
    for (const arc of STORY_ARCS) {
      expect(arc.episodeIds.length).toBeGreaterThan(0)
      for (const id of arc.episodeIds) expect(storyEpisodeById(id), id).toBeTruthy()
    }
  })

  it('points every beat and choice at an existing node', () => {
    for (const episode of STORY_EPISODES) {
      expect(episode.beats[episode.start], `${episode.id} start`).toBeTruthy()
      for (const [key, beat] of Object.entries(episode.beats)) {
        expect(beat.id, `${episode.id}/${key}`).toBe(key)
        if (beat.next) expect(episode.beats[beat.next], `${episode.id}/${key} next`).toBeTruthy()
        for (const item of beat.choices ?? []) {
          expect(episode.beats[item.next], `${episode.id}/${item.id} next`).toBeTruthy()
          for (const characterId of Object.keys(item.trust ?? {})) {
            expect(
              episode.characters.some((character) => character.id === characterId),
              `${episode.id}/${item.id} trust:${characterId}`,
            ).toBe(true)
          }
        }
      }
    }
  })

  it('reaches every beat and all three endings from the start of every episode', () => {
    for (const episode of STORY_EPISODES) {
      const { beats, endings } = walkEpisode(episode)
      const unreachable = Object.keys(episode.beats).filter((id) => !beats.has(id))
      expect(unreachable, `${episode.id} unreachable`).toEqual([])
      expect([...endings].sort(), `${episode.id} endings`).toEqual(['bad', 'good', 'ok'])
    }
  })

  it('gives every episode a challenge, language focus, and at least three choices', () => {
    for (const episode of STORY_EPISODES) {
      expect(episode.challenge.zh.length, episode.id).toBeGreaterThan(0)
      expect(episode.challenge.minGood, episode.id).toBeGreaterThan(0)
      expect(episode.languageFocus.length, episode.id).toBeGreaterThanOrEqual(3)
      expect(episodeChoiceCount(episode), episode.id).toBeGreaterThanOrEqual(3)
      expect(episode.endings.good.tone).toBe('good')
      expect(episode.endings.ok.tone).toBe('ok')
      expect(episode.endings.bad.tone).toBe('bad')
    }
  })

  it('keeps every insight gate reachable and every knowledge card complete', () => {
    const knowledgeIds = new Set<string>()
    for (const episode of STORY_EPISODES) {
      for (const beat of Object.values(episode.beats)) {
        for (const item of beat.choices ?? []) {
          if (item.requiresInsight !== undefined) {
            expect(item.requiresInsight, `${episode.id}/${item.id}`).toBeGreaterThan(0)
            const previous = Object.values(episode.beats)
              .flatMap((node) => node.choices ?? [])
              .filter((other) => other.id !== item.id)
              .reduce((sum, other) => sum + (other.insight ?? 0), 0)
            expect(previous + 10, `${episode.id}/${item.id} gate`).toBeGreaterThanOrEqual(item.requiresInsight)
          }
          if (item.insight !== undefined) expect(item.insight, `${episode.id}/${item.id}`).toBeGreaterThan(0)
        }
      }
      for (const card of episode.knowledge ?? []) {
        expect(knowledgeIds.has(card.id), `duplicate knowledge ${card.id}`).toBe(false)
        knowledgeIds.add(card.id)
        expect(card.titleZh.length, card.id).toBeGreaterThan(0)
        expect(card.summaryZh.length, card.id).toBeGreaterThan(0)
        expect(card.pointsZh.length, card.id).toBeGreaterThanOrEqual(2)
        if (card.track) expect(['frontend', 'fullstack']).toContain(card.track)
      }
    }
  })

  it('makes the forbidden-file bad ending the only fired ending', () => {
    const fired = STORY_EPISODES.filter((episode) =>
      Object.values(episode.endings).some((ending) => ending.fired),
    )
    expect(fired.map((episode) => episode.id)).toEqual(['forbidden-file'])
    expect(fired[0].endings.bad.fired).toBe(true)
  })

  it('uses a fixed, composable avatar preset for every character', () => {
    for (const character of Object.values(STORY_CHARACTERS)) {
      expect(character.avatar, character.id).toBeTruthy()
      const composed = composeAvatar(character.avatar, { outfit: 'hoodie' })
      expect(composed.outfit).toBe('hoodie')
      expect(composed.face).toBe(character.avatar.face)
    }
  })
})

describe('career tracks', () => {
  it('has a complete frontend and full-stack path', () => {
    for (const track of CAREER_TRACKS) {
      expect(track.rankTitles[8], track.id).toBeTruthy()
      const specialty = specialtyEpisode(track.id)
      expect(specialty, track.id).toBeTruthy()
      expect(specialty?.track).toBe(track.id)
      expect(episodesForTrack(track.id).some((episode) => episode.id === 'vp')).toBe(true)
      expect(episodesForTrack(track.id).some((episode) => episode.id === 'job-interview')).toBe(true)
    }
    expect(specialtyEpisode('frontend')?.id).toBe('design-system')
    expect(specialtyEpisode('fullstack')?.id).toBe('platform-incident')
    expect(careerRank(8, 'frontend').titleZh).not.toBe(careerRank(8, 'fullstack').titleZh)
    expect(careerRank(5, 'fullstack').titleEn).toContain('Full-stack')
  })

  it('lets both tracks walk from the first episode to the job interview without a dead end', () => {
    for (const track of ['frontend', 'fullstack'] as CareerTrack[]) {
      const specialty = specialtyEpisode(track)!
      let rankLevel = 1
      let careerPoints = 0
      const completedIds: string[] = []
      const order = [
        'standup',
        'pm-deadline',
        'oncall-night',
        'code-review',
        'qa-repro',
        'promotion',
        'layoff',
        'office-romance',
        specialty.id,
        'forbidden-file',
        'vp',
        'job-interview',
      ]

      for (const id of order) {
        const episode = storyEpisodeById(id)
        expect(episode, id).toBeTruthy()
        expect(
          episodeLock(episode!, { rankLevel, careerPoints, careerTrack: track, completedIds }),
          `${track}/${id} should be unlocked (rank ${rankLevel}, points ${careerPoints})`,
        ).toBeNull()

        const history = goodHistory(episode!)
        expect(
          challengePassed(episode!, history, allTrust(episode!)),
          `${track}/${id} good path must pass the challenge`,
        ).toBe(true)

        completedIds.push(id)
        careerPoints += episode!.careerPoints + 20
        if (episode!.promotionTo) rankLevel = episode!.promotionTo
      }

      expect(rankLevel).toBe(8)
      expect(completedIds).toContain(specialty.id)
    }
  })

  it('locks the other track and requires the specialty episode before the VP seat', () => {
    const vp = storyEpisodeById('vp')!
    const base = {
      rankLevel: 6,
      careerPoints: 500,
      careerTrack: 'frontend' as CareerTrack,
      completedIds: [] as string[],
    }
    expect(episodeLock(vp, base)?.kind).toBe('track-episode')
    expect(
      episodeLock(storyEpisodeById('platform-incident')!, base)?.kind,
    ).toBe('track')
    expect(
      episodeLock(vp, { ...base, completedIds: ['design-system'] }),
    ).toBeNull()
    expect(
      episodeLock(vp, { ...base, careerTrack: 'fullstack', completedIds: ['platform-incident'] }),
    ).toBeNull()
  })

  it('locks management, dark, and job-hop arcs behind rank', () => {
    const progress = { rankLevel: 1, careerPoints: 0, careerTrack: 'frontend' as CareerTrack, completedIds: [] }
    expect(episodeLock(storyEpisodeById('layoff')!, progress)?.kind).toBe('rank')
    expect(episodeLock(storyEpisodeById('forbidden-file')!, progress)?.kind).toBe('rank')
    expect(episodeLock(storyEpisodeById('job-interview')!, progress)?.kind).toBe('rank')
  })
})

describe('career helpers', () => {
  it('maps rank levels and stops at the top', () => {
    expect(careerRank(1).titleEn).toBe('Intern')
    expect(careerRank(2).titleEn).toBe('Junior Frontend')
    expect(careerRank(5).titleEn).toBe('Tech Lead')
    expect(careerRank(8).titleEn).toBe('VP of Engineering')
    expect(careerRank(99).titleEn).toBe('VP of Engineering')
    expect(nextCareerRank(1)?.level).toBe(2)
    expect(nextCareerRank(8)).toBeNull()
  })

  it('reports bounded progress toward the next rank', () => {
    expect(careerProgress(0, 1)).toBe(0)
    expect(careerProgress(20, 1)).toBe(50)
    expect(careerProgress(999, 8)).toBe(100)
    expect(CAREER_RANKS.every((rank, index) => index === 0 || rank.minPoints > CAREER_RANKS[index - 1].minPoints)).toBe(true)
  })
})

describe('challengePassed', () => {
  const episode = STORY_EPISODES[0]

  it('requires both enough good choices and no bad ones', () => {
    const trust = { alex: 80, mark: 80, sarah: 80 }
    expect(challengePassed(episode, [choice('a', 'good'), choice('b', 'good'), choice('c', 'good')], trust)).toBe(true)
    expect(challengePassed(episode, [choice('a', 'good'), choice('b', 'good'), choice('c', 'bad')], trust)).toBe(false)
    expect(challengePassed(episode, [choice('a', 'good'), choice('b', 'ok')], trust)).toBe(false)
  })
})
