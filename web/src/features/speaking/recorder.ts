import { rmsFromWaveform, type AudioFrame } from './analysis'

/**
 * 麦克风录音 + 音量采样。
 *
 * 采样和录音分开：即使浏览器不支持 MediaRecorder（拿不到回放 Blob），
 * 音量帧仍然会记录，口语分析仍可用。创建一次可以跨卡片复用，避免每张卡
 * 都弹一次权限或重新打开设备。
 */

export interface SpeakingRecording {
  frames: AudioFrame[]
  blob: Blob | null
  mimeType: string
  /** performance.now()，用于把首词延迟换算到卡片出现时间。 */
  startedAt: number
  durationMs: number
}

export interface SpeakingRecorderOptions {
  /** 音量采样间隔，默认 50ms。 */
  sampleMs?: number
  onLevel?: (rms: number, elapsedMs: number) => void
}

export type SpeakingRecorderErrorCode = 'unsupported' | 'denied' | 'not-found' | 'busy' | 'unknown'

export class SpeakingRecorderError extends Error {
  readonly code: SpeakingRecorderErrorCode

  constructor(code: SpeakingRecorderErrorCode, message: string) {
    super(message)
    this.name = 'SpeakingRecorderError'
    this.code = code
  }
}

interface RecordingSession {
  frames: AudioFrame[]
  chunks: BlobPart[]
  recorder: MediaRecorder | null
  startedAt: number
  timer: number | null
  active: boolean
  stopPromise: Promise<SpeakingRecording> | null
  last: SpeakingRecording | null
}

const EMPTY_RECORDING: SpeakingRecording = {
  frames: [],
  blob: null,
  mimeType: '',
  startedAt: 0,
  durationMs: 0,
}

function toRecorderError(error: unknown): SpeakingRecorderError {
  const name = (error as { name?: string } | null)?.name ?? ''
  if (name === 'NotAllowedError' || name === 'SecurityError' || name === 'PermissionDeniedError') {
    return new SpeakingRecorderError('denied', '麦克风权限被拒绝。请在系统设置里允许麦克风后再试。')
  }
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError' || name === 'OverconstrainedError') {
    return new SpeakingRecorderError('not-found', '没有找到可用的麦克风。')
  }
  if (name === 'NotReadableError' || name === 'TrackStartError' || name === 'AbortError') {
    return new SpeakingRecorderError('busy', '麦克风被其他程序占用了，先关掉会议软件再试。')
  }
  return new SpeakingRecorderError('unknown', '麦克风启动失败。')
}

function pickMimeType(): string | null {
  if (typeof MediaRecorder === 'undefined') return null
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus']
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? null
}

export class SpeakingRecorder {
  private readonly stream: MediaStream
  private readonly context: AudioContext
  private readonly analyser: AnalyserNode
  private readonly waveform: Float32Array<ArrayBuffer>
  private readonly byteWaveform: Uint8Array<ArrayBuffer>
  private readonly sampleMs: number
  private readonly onLevel?: SpeakingRecorderOptions['onLevel']
  private session: RecordingSession | null = null
  private disposed = false

  private constructor(
    stream: MediaStream,
    context: AudioContext,
    analyser: AnalyserNode,
    options: SpeakingRecorderOptions,
  ) {
    this.stream = stream
    this.context = context
    this.analyser = analyser
    this.sampleMs = Math.min(200, Math.max(30, Math.round(options.sampleMs ?? 50)))
    this.onLevel = options.onLevel
    this.waveform = new Float32Array(analyser.fftSize)
    this.byteWaveform = new Uint8Array(analyser.fftSize)
  }

  static async create(options: SpeakingRecorderOptions = {}): Promise<SpeakingRecorder> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      throw new SpeakingRecorderError('unsupported', '当前环境不支持麦克风录音。')
    }

    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        video: false,
      })
    } catch (error) {
      throw toRecorderError(error)
    }

    const AudioContextCtor =
      typeof window !== 'undefined'
        ? window.AudioContext ??
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
        : undefined
    if (!AudioContextCtor) {
      stream.getTracks().forEach((track) => track.stop())
      throw new SpeakingRecorderError('unsupported', '当前环境不支持音频分析。')
    }

    const context = new AudioContextCtor()
    try {
      await context.resume()
    } catch {
      // 自动播放策略拒绝 resume 时，第一次用户手势后仍会恢复；采样失败会体现为静音。
    }
    const source = context.createMediaStreamSource(stream)
    const analyser = context.createAnalyser()
    analyser.fftSize = 1024
    analyser.smoothingTimeConstant = 0.2
    source.connect(analyser)

    return new SpeakingRecorder(stream, context, analyser, options)
  }

  get isRecording(): boolean {
    return this.session?.active ?? false
  }

  start(): void {
    if (this.disposed) throw new SpeakingRecorderError('unknown', '录音器已经释放。')
    if (this.session?.active) return

    const session: RecordingSession = {
      frames: [],
      chunks: [],
      recorder: null,
      startedAt: performance.now(),
      timer: null,
      active: true,
      stopPromise: null,
      last: null,
    }
    this.session = session

    session.timer = window.setInterval(() => this.sample(session), this.sampleMs)

    if (typeof MediaRecorder === 'undefined') return
    const mimeType = pickMimeType()
    try {
      const recorder = mimeType ? new MediaRecorder(this.stream, { mimeType }) : new MediaRecorder(this.stream)
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) session.chunks.push(event.data)
      }
      session.recorder = recorder
      recorder.start()
    } catch {
      // 回放不是核心路径；拿不到 Blob 时继续保留音量帧。
      session.recorder = null
    }
  }

  private sample(session: RecordingSession): void {
    if (!session.active) return
    let rms = 0
    if (typeof this.analyser.getFloatTimeDomainData === 'function') {
      this.analyser.getFloatTimeDomainData(this.waveform)
      rms = rmsFromWaveform(this.waveform)
    } else {
      this.analyser.getByteTimeDomainData(this.byteWaveform)
      let sum = 0
      for (const value of this.byteWaveform) {
        const centered = (value - 128) / 128
        sum += centered * centered
      }
      rms = Math.sqrt(sum / this.byteWaveform.length)
    }
    const tMs = performance.now() - session.startedAt
    session.frames.push({ tMs, rms })
    this.onLevel?.(rms, tMs)
  }

  stop(): Promise<SpeakingRecording> {
    const session = this.session
    if (!session) return Promise.resolve(this.lastRecording())
    if (session.stopPromise) return session.stopPromise

    session.active = false
    if (session.timer != null) {
      window.clearInterval(session.timer)
      session.timer = null
    }

    const startedAt = session.startedAt
    const frames = [...session.frames]
    const chunks = session.chunks
    const recorder = session.recorder
    session.recorder = null
    const durationMs = Math.max(0, performance.now() - startedAt)

    session.stopPromise = (async () => {
      let blob: Blob | null = null
      let mimeType = ''
      if (recorder && recorder.state !== 'inactive') {
        mimeType = recorder.mimeType
        blob = await new Promise<Blob | null>((resolve) => {
          let settled = false
          const finish = () => {
            if (settled) return
            settled = true
            resolve(chunks.length ? new Blob(chunks, { type: mimeType || 'audio/webm' }) : null)
          }
          recorder.onstop = finish
          recorder.onerror = finish
          try {
            recorder.stop()
          } catch {
            finish()
          }
          // 某些 WebView 在设备被抢占时不一定触发 stop/error，兜底避免卡住。
          window.setTimeout(finish, 1200)
        })
      }
      const recording: SpeakingRecording = { frames, blob, mimeType, startedAt, durationMs }
      session.last = recording
      return recording
    })()

    return session.stopPromise
  }

  async cancel(): Promise<void> {
    const session = this.session
    await this.stop()
    if (session) session.last = null
  }

  private lastRecording(): SpeakingRecording {
    return this.session?.last ?? EMPTY_RECORDING
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    const session = this.session
    if (session) {
      session.active = false
      if (session.timer != null) {
        window.clearInterval(session.timer)
        session.timer = null
      }
      if (session.recorder && session.recorder.state !== 'inactive') {
        try {
          session.recorder.stop()
        } catch {
          // ignore
        }
      }
      session.recorder = null
    }
    this.session = null
    this.stream.getTracks().forEach((track) => track.stop())
    void this.context.close().catch(() => {})
  }
}
