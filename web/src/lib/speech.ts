import { useSettingsStore, type TtsAccent, type TtsEngine } from '../store/useSettingsStore'

export interface SpeakOptions {
  rate?: number
  pitch?: number
  voiceURI?: string | null
  lang?: string
  /** Override the engine saved in settings (used by the settings preview). */
  engine?: TtsEngine
  accent?: TtsAccent
  signal?: AbortSignal
}

let cachedVoices: SpeechSynthesisVoice[] = []
let voicesPromise: Promise<SpeechSynthesisVoice[]> | null = null
let playbackToken = 0
let onlineAudio: HTMLAudioElement | null = null

export function ttsSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

export function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  if (!ttsSupported()) return Promise.resolve([])
  if (cachedVoices.length) return Promise.resolve(cachedVoices)
  if (voicesPromise) return voicesPromise

  voicesPromise = new Promise((resolve) => {
    const read = () => {
      const voices = window.speechSynthesis.getVoices()
      if (voices.length) {
        cachedVoices = voices
        resolve(voices)
        return true
      }
      return false
    }
    if (read()) return
    const onChange = () => {
      if (read()) window.speechSynthesis.removeEventListener('voiceschanged', onChange)
    }
    window.speechSynthesis.addEventListener('voiceschanged', onChange)
    window.setTimeout(() => {
      window.speechSynthesis.removeEventListener('voiceschanged', onChange)
      if (!cachedVoices.length) cachedVoices = window.speechSynthesis.getVoices()
      resolve(cachedVoices)
    }, 1500)
  })
  return voicesPromise
}

export function englishVoices(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice[] {
  return voices.filter((voice) => /^en(-|_)/i.test(voice.lang))
}

/** Re-read the voice list, e.g. after the user installs an English voice. */
export async function refreshVoices(): Promise<SpeechSynthesisVoice[]> {
  cachedVoices = []
  voicesPromise = null
  return loadVoices()
}

function isNaturalVoice(voice: SpeechSynthesisVoice): boolean {
  return (
    !voice.localService ||
    /natural|neural|online|premium|enhanced|google/i.test(voice.name)
  )
}

/**
 * True when the browser has an English voice that is likely to sound human
 * (Edge online/natural voices, Chrome's Google voices, macOS enhanced voices).
 * Local SAPI voices such as "Microsoft David" are deliberately not counted.
 */
export function hasNaturalEnglishVoice(voices: SpeechSynthesisVoice[] = cachedVoices): boolean {
  const cached = voices.length ? voices : cachedVoices
  return englishVoices(cached).some(isNaturalVoice)
}

function scoreVoice(voice: SpeechSynthesisVoice): number {
  let value = 0
  if (/natural|neural|online|premium|enhanced/i.test(voice.name)) value += 100
  if (/google/i.test(voice.name)) value += 80
  if (!voice.localService) value += 50
  if (/^en-US/i.test(voice.lang)) value += 10
  else if (/^en-GB/i.test(voice.lang)) value += 8
  else if (/^en-(AU|CA|IE|NZ|ZA)/i.test(voice.lang)) value += 5
  if (/aria|jenny|guy|samantha|daniel|karen|moira|libby|sonia|ryan|ava|allison|serena/i.test(voice.name)) {
    value += 6
  }
  if (/novelty|whisper|bells|boing|bubbles|cellos|jester|organ|superstar|trinoids|zarvox/i.test(voice.name)) {
    value -= 50
  }
  return value
}

export function pickVoice(
  voices: SpeechSynthesisVoice[],
  preferredURI?: string | null,
): SpeechSynthesisVoice | null {
  if (!voices.length) return null
  const english = englishVoices(voices)
  // Never attach a non-English voice to English text. With a Chinese-only
  // system that is what makes an English sentence sound incomprehensible.
  const pool = english.length ? english : []
  if (!pool.length) return null
  if (preferredURI) {
    const preferred = pool.find((voice) => voice.voiceURI === preferredURI)
    if (preferred) return preferred
  }
  return [...pool].sort((a, b) => scoreVoice(b) - scoreVoice(a))[0] ?? null
}

/**
 * Whether a voice is worth recommending in the settings screen.
 */
export function voiceQuality(voice: SpeechSynthesisVoice): 'natural' | 'local' {
  return isNaturalVoice(voice) ? 'natural' : 'local'
}

function currentSettings() {
  return useSettingsStore.getState()
}

function isOnlineEngine(engine: TtsEngine): engine is 'youdao' | 'baidu' | 'google' {
  return engine === 'youdao' || engine === 'baidu' || engine === 'google'
}

function resolveEngine(requested: TtsEngine, voices: SpeechSynthesisVoice[]): TtsEngine {
  if (requested !== 'auto') return requested
  if (hasNaturalEnglishVoice(voices)) return 'browser'
  // A Chinese-only (or SAPI-only) system is exactly where the browser voice
  // sounds robotic. Prefer a decent online accent, then fall back to the
  // browser when the network is unavailable.
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return englishVoices(voices).length ? 'browser' : 'baidu'
  }
  // Baidu is reachable from mainland China and handles full sentences;
  // Google Translate's voice is a little better where it is reachable.
  // Note: Youdao's public endpoint only handles short words reliably, so it
  // stays available as a legacy option but is not used by "auto".
  return typeof navigator !== 'undefined' && /^zh/i.test(navigator.language) ? 'baidu' : 'google'
}

function onlineUrl(engine: TtsEngine, text: string, accent: TtsAccent): string | null {
  if (engine === 'youdao') {
    return `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(text)}&type=${accent === 'uk' ? 1 : 2}`
  }
  if (engine === 'baidu') {
    return `https://fanyi.baidu.com/gettts?lan=en&text=${encodeURIComponent(text)}&spd=3&source=web`
  }
  if (engine === 'google') {
    return `https://translate.googleapis.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${
      accent === 'uk' ? 'en-GB' : 'en-US'
    }&client=tw-ob`
  }
  return null
}

function audioElement(): HTMLAudioElement | null {
  if (typeof document === 'undefined') return null
  if (!onlineAudio) {
    onlineAudio = document.createElement('audio')
    onlineAudio.preload = 'auto'
    onlineAudio.setAttribute('playsinline', 'true')
    onlineAudio.style.display = 'none'
    document.body.appendChild(onlineAudio)
  }
  return onlineAudio
}

function stopOnlineAudio() {
  if (!onlineAudio) return
  onlineAudio.pause()
  onlineAudio.removeAttribute('src')
  try {
    onlineAudio.load()
  } catch {
    // ignore
  }
}

async function playOnline(
  text: string,
  engine: TtsEngine,
  accent: TtsAccent,
  rate: number,
  token: number,
): Promise<void> {
  const url = onlineUrl(engine, text, accent)
  const audio = audioElement()
  if (!url || !audio) throw new Error('online-tts-unavailable')
  if (token !== playbackToken) return

  audio.pause()
  audio.src = url
  audio.playbackRate = Math.min(1.5, Math.max(0.6, rate))
  audio.load()

  await new Promise<void>((resolve, reject) => {
    let settled = false
    const finish = (error?: Error) => {
      if (settled) return
      settled = true
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('error', onError)
      window.clearTimeout(timer)
      if (error) reject(error)
      else resolve()
    }
    const onEnded = () => finish()
    const onError = () => finish(new Error('online-tts-error'))
    const timer = window.setTimeout(() => {
      // Give a long sentence room to finish; the timeout only protects the
      // queue from an endpoint that never fires ended/error.
      if (audio.duration && Number.isFinite(audio.duration)) {
        window.setTimeout(() => finish(), Math.max(500, audio.duration * 1000 + 2000))
      } else {
        finish(new Error('online-tts-timeout'))
      }
    }, 12000)
    audio.addEventListener('ended', onEnded, { once: true })
    audio.addEventListener('error', onError, { once: true })
    if (token !== playbackToken) {
      finish()
      return
    }
    void audio.play().catch((error: unknown) => {
      finish(error instanceof Error ? error : new Error('online-tts-play-failed'))
    })
  })
}

function browserSpeak(text: string, options: SpeakOptions, token: number): Promise<void> {
  return new Promise((resolve) => {
    if (!ttsSupported() || !text.trim() || token !== playbackToken) {
      resolve()
      return
    }
    const utterance = new SpeechSynthesisUtterance(text)
    const accent = options.accent ?? currentSettings().ttsAccent
    utterance.lang = options.lang ?? (accent === 'uk' ? 'en-GB' : 'en-US')
    utterance.rate = options.rate ?? 0.95
    utterance.pitch = options.pitch ?? 1
    const voices = cachedVoices.length ? cachedVoices : window.speechSynthesis.getVoices()
    const voice = pickVoice(voices, options.voiceURI)
    if (voice) utterance.voice = voice
    utterance.onend = () => resolve()
    utterance.onerror = () => resolve()
    // Chrome occasionally drops the end event for very short utterances.
    const guard = window.setTimeout(
      () => resolve(),
      Math.max(4000, text.length * 90 + 3000),
    )
    const finish = () => {
      window.clearTimeout(guard)
      resolve()
    }
    utterance.onend = finish
    utterance.onerror = finish
    window.speechSynthesis.speak(utterance)
  })
}

async function speakInternal(
  text: string,
  options: SpeakOptions,
  token: number,
): Promise<void> {
  const clean = text.trim()
  if (!clean || token !== playbackToken) return
  if (options.signal?.aborted) return

  const settings = currentSettings()
  const accent = options.accent ?? settings.ttsAccent
  const rate = options.rate ?? settings.ttsRate
  const requested = options.engine ?? settings.ttsEngine
  const voices = cachedVoices.length ? cachedVoices : ttsSupported() ? window.speechSynthesis.getVoices() : []
  const engine = resolveEngine(requested, voices)

  if (isOnlineEngine(engine)) {
    try {
      await playOnline(clean, engine, accent, rate, token)
      return
    } catch {
      if (token !== playbackToken) return
      // A blocked endpoint or an autoplay rejection: fall through to the
      // installed voices instead of leaving the user in silence.
    }
  }

  if (!ttsSupported()) return
  await loadVoices()
  if (token !== playbackToken) return
  await browserSpeak(clean, { ...options, accent, rate }, token)
}

export async function speak(text: string, options: SpeakOptions = {}): Promise<void> {
  cancelSpeech()
  const token = playbackToken
  if (!cachedVoices.length && ttsSupported()) {
    // Start loading voices for next time, but do not block an online request
    // (blocking would lose the user-gesture context on mobile).
    void loadVoices()
  }
  await speakInternal(text, options, token)
}

export function cancelSpeech(): void {
  playbackToken += 1
  stopOnlineAudio()
  if (ttsSupported()) window.speechSynthesis.cancel()
}

export async function speakSequence(
  lines: string[],
  options: SpeakOptions & { gapMs?: number; onLine?: (index: number) => void; signal?: AbortSignal } = {},
): Promise<void> {
  cancelSpeech()
  const token = playbackToken
  if (!cachedVoices.length && ttsSupported()) void loadVoices()
  for (let index = 0; index < lines.length; index += 1) {
    if (options.signal?.aborted || token !== playbackToken) return
    options.onLine?.(index)
    await speakInternal(lines[index], options, token)
    if (token !== playbackToken || options.signal?.aborted) return
    if (options.gapMs) {
      await new Promise((resolve) => window.setTimeout(resolve, options.gapMs))
    }
  }
}

export interface RecognitionResult {
  transcript: string
  confidence: number
}

type SpeechRecognitionLike = {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  start: () => void
  stop: () => void
  abort: () => void
  onresult: ((event: any) => void) | null
  onerror: ((event: any) => void) | null
  onend: (() => void) | null
}

export function asrSupported(): boolean {
  if (typeof window === 'undefined') return false
  const w = window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }
  return Boolean(w.SpeechRecognition || w.webkitSpeechRecognition)
}

export function startRecognition(options: {
  lang?: string
  onInterim?: (transcript: string) => void
  onResult: (result: RecognitionResult) => void
  onError?: (error: string) => void
  onEnd?: () => void
}): { stop: () => void; abort: () => void } | null {
  if (!asrSupported()) return null
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike
    webkitSpeechRecognition?: new () => SpeechRecognitionLike
  }
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition
  if (!Ctor) return null
  const recognition = new Ctor()
  recognition.lang = options.lang ?? 'en-US'
  recognition.continuous = false
  recognition.interimResults = true
  recognition.maxAlternatives = 3

  recognition.onresult = (event: any) => {
    let interim = ''
    let finalTranscript = ''
    let confidence = 0
    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const result = event.results[i]
      const alternative = result[0]
      if (result.isFinal) {
        finalTranscript += alternative.transcript
        confidence = alternative.confidence ?? 0
      } else {
        interim += alternative.transcript
      }
    }
    if (interim) options.onInterim?.(interim)
    if (finalTranscript) {
      options.onResult({ transcript: finalTranscript.trim(), confidence })
    }
  }
  recognition.onerror = (event: any) => {
    options.onError?.(event?.error ?? 'unknown')
  }
  recognition.onend = () => {
    options.onEnd?.()
  }
  try {
    recognition.start()
  } catch {
    options.onError?.('start-failed')
    return null
  }
  return {
    stop: () => recognition.stop(),
    abort: () => recognition.abort(),
  }
}
