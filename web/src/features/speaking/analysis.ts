/**
 * 口语反应分析：只处理「时间 + 音量」帧，不依赖浏览器 API，方便单测。
 *
 * 录音层每 50ms 采一帧 RMS，这里负责判断有没有开口、第一帧人声出现在
 * 什么时候、中间停顿了几次。首词延迟由调用方用「录音开始时间」和
 * 「卡片出现时间」换算，保证口径是“看到卡片 → 发出第一个音”。
 */

export interface AudioFrame {
  /** 相对录音开始的毫秒数。 */
  tMs: number
  /** 该帧的 RMS 音量，0..1。 */
  rms: number
}

export interface SpeechAnalysisOptions {
  /** 低于这个 RMS 一定不算人声。 */
  minRms?: number
  /** 阈值 = max(minRms, 噪声底 × noiseMultiplier)。 */
  noiseMultiplier?: number
  /** 两段人声间隔达到这个值才算一次停顿。 */
  pauseMs?: number
  /** 短于这个值的人声段当噪声丢掉。 */
  minSpeechMs?: number
  /** 两段人声间隔小于这个值时合并，默认按帧长推导。 */
  mergeGapMs?: number
}

export interface SpeechSegment {
  startMs: number
  endMs: number
}

export interface SpeechAnalysis {
  hasSpeech: boolean
  /** 第一段有效人声的起点，相对录音开始。 */
  speechStartMs: number | null
  /** 最后一段有效人声的终点，相对录音开始。 */
  speechEndMs: number | null
  /** 从第一段人声起点到最后一段终点的跨度。 */
  speechMs: number
  /** 真正有人声的累计时长。 */
  voicedMs: number
  /** 人声段之间 ≥ pauseMs 的间隔数量。 */
  pauseCount: number
  longestPauseMs: number
  segments: SpeechSegment[]
  /** 估算的环境噪声底。 */
  noiseFloor: number
  /** 实际使用的有声阈值。 */
  threshold: number
  /** 推导出的采样帧长。 */
  frameMs: number
  frameCount: number
}

export interface SpeakingMetrics {
  /** 从卡片出现到第一个音；没检测到开口时为 null。 */
  firstWordMs: number | null
  speechMs: number
  pauseCount: number
}

export interface SpeakingSummary {
  samples: number
  medianFirstWordMs: number | null
  medianSpeechMs: number | null
  meanPauseCount: number | null
}

const DEFAULTS = {
  minRms: 0.012,
  noiseMultiplier: 3,
  pauseMs: 300,
  minSpeechMs: 100,
}

/** 计算一段波形的 RMS；空数组返回 0。 */
export function rmsFromWaveform(samples: Float32Array | number[]): number {
  if (!samples.length) return 0
  let sum = 0
  for (const sample of samples) sum += sample * sample
  return Math.sqrt(sum / samples.length)
}

function percentile(values: number[], p: number): number {
  if (!values.length) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1))
  return sorted[index]
}

function median(values: number[]): number | null {
  if (!values.length) return null
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle]
}

function inferFrameMs(frames: AudioFrame[]): number {
  if (frames.length < 2) return 50
  const deltas: number[] = []
  for (let i = 1; i < frames.length; i += 1) {
    const delta = frames[i].tMs - frames[i - 1].tMs
    if (delta > 0) deltas.push(delta)
  }
  if (!deltas.length) return 50
  const value = median(deltas) ?? 50
  return Math.min(200, Math.max(10, value))
}

/**
 * 从音量帧序列里找出口语段。
 *
 * 阈值用整段音频的 10 分位音量当噪声底，避免固定阈值在安静/嘈杂环境下
 * 表现差太多；再用 minRms 兜底。短于人声段最短长度的脉冲（键盘、咳嗽）
 * 会被丢掉。
 */
export function analyzeSpeech(frames: AudioFrame[], options: SpeechAnalysisOptions = {}): SpeechAnalysis {
  const minRms = options.minRms ?? DEFAULTS.minRms
  const noiseMultiplier = options.noiseMultiplier ?? DEFAULTS.noiseMultiplier
  const pauseMs = options.pauseMs ?? DEFAULTS.pauseMs
  const minSpeechMs = options.minSpeechMs ?? DEFAULTS.minSpeechMs

  const ordered = frames
    .filter((frame) => Number.isFinite(frame.tMs) && Number.isFinite(frame.rms))
    .map((frame) => ({ tMs: Math.max(0, frame.tMs), rms: Math.max(0, frame.rms) }))
    .sort((a, b) => a.tMs - b.tMs)

  const frameMs = inferFrameMs(ordered)
  const mergeGapMs = options.mergeGapMs ?? Math.max(60, frameMs * 1.5)
  const noiseFloor = percentile(
    ordered.map((frame) => frame.rms),
    10,
  )
  const threshold = Math.max(minRms, noiseFloor * noiseMultiplier)

  const rawSegments: SpeechSegment[] = []
  for (const frame of ordered) {
    if (frame.rms < threshold) continue
    const startMs = frame.tMs
    const endMs = startMs + frameMs
    const last = rawSegments[rawSegments.length - 1]
    if (last && startMs - last.endMs <= mergeGapMs) {
      last.endMs = Math.max(last.endMs, endMs)
    } else {
      rawSegments.push({ startMs, endMs })
    }
  }

  const segments = rawSegments.filter((segment) => segment.endMs - segment.startMs >= minSpeechMs)
  let pauseCount = 0
  let longestPauseMs = 0
  for (let i = 1; i < segments.length; i += 1) {
    const gap = Math.max(0, segments[i].startMs - segments[i - 1].endMs)
    if (gap >= pauseMs) {
      pauseCount += 1
      longestPauseMs = Math.max(longestPauseMs, gap)
    }
  }

  const first = segments[0] ?? null
  const last = segments[segments.length - 1] ?? null
  const voicedMs = segments.reduce((total, segment) => total + segment.endMs - segment.startMs, 0)

  return {
    hasSpeech: segments.length > 0,
    speechStartMs: first ? first.startMs : null,
    speechEndMs: last ? last.endMs : null,
    speechMs: first && last ? Math.max(0, last.endMs - first.startMs) : 0,
    voicedMs,
    pauseCount,
    longestPauseMs,
    segments,
    noiseFloor,
    threshold,
    frameMs,
    frameCount: ordered.length,
  }
}

/** 汇总一组卡片的口语数据，用于本组结算。 */
export function summarizeSpeaking(metrics: SpeakingMetrics[]): SpeakingSummary {
  const firstWords = metrics
    .map((item) => item.firstWordMs)
    .filter((value): value is number => value != null && Number.isFinite(value))
  const speechTimes = metrics
    .map((item) => item.speechMs)
    .filter((value) => Number.isFinite(value) && value >= 0)
  const pauses = metrics.map((item) => item.pauseCount).filter((value) => Number.isFinite(value))

  return {
    samples: metrics.length,
    medianFirstWordMs: median(firstWords),
    medianSpeechMs: median(speechTimes),
    meanPauseCount: pauses.length ? pauses.reduce((total, value) => total + value, 0) / pauses.length : null,
  }
}
