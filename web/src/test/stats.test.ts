import { describe, expect, it } from 'vitest'
import { learningExperiment } from '../lib/stats'

describe('learningExperiment', () => {
  it('ignores cards that have only been seen once', () => {
    const result = learningExperiment({
      once: { total: 1, firstMs: 9000, firstRating: 1, lastRating: 1, recentMs: [9000] },
    })
    expect(result.cards).toBe(0)
    expect(result.firstMedianMs).toBeNull()
    expect(result.recentMedianMs).toBeNull()
  })

  it('compares the first attempt with the latest attempt on the same cards', () => {
    const result = learningExperiment({
      a: { total: 3, firstMs: 5000, firstRating: 1, lastRating: 4, recentMs: [4000, 2500, 1200] },
      b: { total: 2, firstMs: 3000, firstRating: 3, lastRating: 3, recentMs: [2800, 1800] },
      once: { total: 1, firstMs: 9000, firstRating: 1, lastRating: 1, recentMs: [9000] },
    })

    expect(result.cards).toBe(2)
    expect(result.firstMedianMs).toBe(4000)
    expect(result.recentMedianMs).toBe(1500)
    expect(result.speedGain).toBeCloseTo(0.625)
    expect(result.firstAccuracy).toBe(0.5)
    expect(result.recentAccuracy).toBe(1)
    expect(result.fastRate).toBe(1)
  })

  it('can report a negative speed gain when the latest attempt was slower', () => {
    const result = learningExperiment({
      a: { total: 2, firstMs: 1000, firstRating: 4, lastRating: 2, recentMs: [1000, 3000] },
    })
    expect(result.speedGain).toBeCloseTo(-2)
    expect(result.recentAccuracy).toBe(0)
  })
})
