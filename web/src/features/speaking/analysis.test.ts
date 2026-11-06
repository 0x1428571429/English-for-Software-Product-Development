import { describe, expect, it } from 'vitest'
import {
  analyzeSpeech,
  rmsFromWaveform,
  summarizeSpeaking,
  type AudioFrame,
  type SpeakingMetrics,
} from './analysis'

interface Tone {
  fromMs: number
  toMs: number
  rms: number
}

function makeFrames(tones: Tone[], { durationMs = 1000, stepMs = 50, silenceRms = 0.001 } = {}): AudioFrame[] {
  const frames: AudioFrame[] = []
  for (let tMs = 0; tMs < durationMs; tMs += stepMs) {
    const tone = tones.find((item) => tMs >= item.fromMs && tMs < item.toMs)
    frames.push({ tMs, rms: tone ? tone.rms : silenceRms })
  }
  return frames
}

describe('rmsFromWaveform', () => {
  it('returns zero for silence and empty input', () => {
    expect(rmsFromWaveform([])).toBe(0)
    expect(rmsFromWaveform([0, 0, 0, 0])).toBe(0)
  })

  it('returns the root mean square of the samples', () => {
    expect(rmsFromWaveform([0.5, -0.5, 0.5, -0.5])).toBeCloseTo(0.5)
    expect(rmsFromWaveform([1, 0, 0, 0])).toBeCloseTo(0.5)
  })
})

describe('analyzeSpeech', () => {
  it('reports no speech for a silent recording', () => {
    const result = analyzeSpeech(makeFrames([]))
    expect(result.hasSpeech).toBe(false)
    expect(result.speechStartMs).toBeNull()
    expect(result.speechEndMs).toBeNull()
    expect(result.speechMs).toBe(0)
    expect(result.pauseCount).toBe(0)
    expect(result.frameCount).toBe(20)
  })

  it('finds the first voiced frame and its end', () => {
    const result = analyzeSpeech(makeFrames([{ fromMs: 500, toMs: 900, rms: 0.05 }]))
    expect(result.hasSpeech).toBe(true)
    expect(result.speechStartMs).toBe(500)
    expect(result.speechEndMs).toBe(900)
    expect(result.speechMs).toBe(400)
    expect(result.voicedMs).toBe(400)
    expect(result.pauseCount).toBe(0)
  })

  it('counts a long gap as one pause', () => {
    const result = analyzeSpeech(
      makeFrames([
        { fromMs: 0, toMs: 200, rms: 0.05 },
        { fromMs: 600, toMs: 900, rms: 0.05 },
      ]),
    )
    expect(result.segments).toHaveLength(2)
    expect(result.pauseCount).toBe(1)
    expect(result.longestPauseMs).toBe(400)
    expect(result.speechMs).toBe(900)
    expect(result.voicedMs).toBe(500)
  })

  it('merges a short dropout instead of counting a pause', () => {
    const result = analyzeSpeech(
      makeFrames([
        { fromMs: 0, toMs: 200, rms: 0.05 },
        { fromMs: 250, toMs: 450, rms: 0.05 },
      ]),
    )
    expect(result.segments).toHaveLength(1)
    expect(result.pauseCount).toBe(0)
    expect(result.speechMs).toBe(450)
  })

  it('ignores clicks shorter than the minimum speech length', () => {
    const result = analyzeSpeech(makeFrames([{ fromMs: 100, toMs: 150, rms: 0.08 }]))
    expect(result.hasSpeech).toBe(false)
    expect(result.speechStartMs).toBeNull()
  })

  it('adapts to a noisy room', () => {
    const result = analyzeSpeech(
      makeFrames([{ fromMs: 300, toMs: 800, rms: 0.09 }], { silenceRms: 0.02 }),
    )
    expect(result.noiseFloor).toBeCloseTo(0.02)
    expect(result.threshold).toBeCloseTo(0.06)
    expect(result.hasSpeech).toBe(true)
    expect(result.speechStartMs).toBe(300)
  })

  it('does not mistake noise for speech when the signal is too close', () => {
    const result = analyzeSpeech(
      makeFrames([{ fromMs: 300, toMs: 800, rms: 0.04 }], { silenceRms: 0.02 }),
    )
    expect(result.hasSpeech).toBe(false)
  })

  it('sorts frames and infers the frame length', () => {
    const frames = makeFrames([{ fromMs: 300, toMs: 700, rms: 0.05 }], { stepMs: 100 }).reverse()
    const result = analyzeSpeech(frames)
    expect(result.frameMs).toBe(100)
    expect(result.speechStartMs).toBe(300)
    expect(result.speechEndMs).toBe(700)
    expect(result.speechMs).toBe(400)
  })

  it('treats a gap exactly at the pause threshold as a pause', () => {
    const result = analyzeSpeech(
      makeFrames([
        { fromMs: 0, toMs: 200, rms: 0.05 },
        { fromMs: 500, toMs: 700, rms: 0.05 },
      ]),
    )
    expect(result.pauseCount).toBe(1)
    expect(result.longestPauseMs).toBe(300)
  })

  it('does not count a gap just below the pause threshold', () => {
    const result = analyzeSpeech(
      makeFrames([
        { fromMs: 0, toMs: 200, rms: 0.05 },
        { fromMs: 450, toMs: 700, rms: 0.05 },
      ]),
    )
    expect(result.segments).toHaveLength(2)
    expect(result.pauseCount).toBe(0)
  })

  it('handles an empty or malformed frame list safely', () => {
    const result = analyzeSpeech([
      { tMs: Number.NaN, rms: 0.5 },
      { tMs: 100, rms: Number.POSITIVE_INFINITY },
    ])
    expect(result.hasSpeech).toBe(false)
    expect(result.frameCount).toBe(0)
  })
})

describe('summarizeSpeaking', () => {
  const metrics: SpeakingMetrics[] = [
    { firstWordMs: 1000, speechMs: 3000, pauseCount: 1 },
    { firstWordMs: 2000, speechMs: 1000, pauseCount: 3 },
    { firstWordMs: null, speechMs: 2000, pauseCount: 2 },
  ]

  it('aggregates medians and the mean pause count', () => {
    const result = summarizeSpeaking(metrics)
    expect(result.samples).toBe(3)
    expect(result.medianFirstWordMs).toBe(1500)
    expect(result.medianSpeechMs).toBe(2000)
    expect(result.meanPauseCount).toBe(2)
  })

  it('returns nulls when there is no data', () => {
    expect(summarizeSpeaking([])).toEqual({
      samples: 0,
      medianFirstWordMs: null,
      medianSpeechMs: null,
      meanPauseCount: null,
    })
  })

  it('keeps speech duration when no first word was detected', () => {
    const result = summarizeSpeaking([{ firstWordMs: null, speechMs: 400, pauseCount: 0 }])
    expect(result.samples).toBe(1)
    expect(result.medianFirstWordMs).toBeNull()
    expect(result.medianSpeechMs).toBe(400)
    expect(result.meanPauseCount).toBe(0)
  })
})
