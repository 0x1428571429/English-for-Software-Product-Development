import type { TypingSoundPack } from '../../store/useSettingsStore'

export type TypingKeyKind = 'key' | 'space' | 'enter' | 'backspace'
export type TypingKeyPhase = 'down' | 'up'

export const TYPING_SOUND_PACKS: { value: TypingSoundPack; label: string; hint: string }[] = [
  { value: 'clicky', label: 'Clicky（推荐）', hint: '清脆、短促，最接近机械键盘的青轴' },
  { value: 'tactile', label: 'Tactile', hint: '有段落感，声音干净' },
  { value: 'thock', label: 'Thock', hint: '低沉、闷响，接近润滑过的线性轴' },
  { value: 'typewriter', label: 'Typewriter', hint: '老式打字机，机械感更重' },
]

/**
 * 把一个键盘事件映射到音效类别。
 * 只关心打字输入；Shift / Control / 方向键等不发声。
 */
export function classifyTypingKey(key: string): TypingKeyKind | null {
  if (key === ' ' || key === 'Spacebar') return 'space'
  if (key === 'Enter') return 'enter'
  if (key === 'Backspace') return 'backspace'
  if (Array.from(key).length === 1) return 'key'
  return null
}

export function typingSoundFile(kind: TypingKeyKind, phase: TypingKeyPhase): string {
  if (kind === 'space') return phase === 'down' ? 'space_press.wav' : 'space_release.wav'
  if (kind === 'enter') return phase === 'down' ? 'enter_press.wav' : 'enter_release.wav'
  if (kind === 'backspace') return phase === 'down' ? 'backspace_press.wav' : 'key_release.wav'
  return phase === 'down' ? 'key_press.wav' : 'key_release.wav'
}

interface SoundOptions {
  enabled: boolean
  volume: number
  pack: TypingSoundPack
}

const DEFAULT_GAIN = 0.42
const RELEASE_GAIN = 0.32

let audioContext: AudioContext | null = null
let masterGain: GainNode | null = null
let options: SoundOptions = { enabled: true, volume: 0.5, pack: 'clicky' }
const buffers = new Map<string, AudioBuffer>()
const pending = new Map<string, Promise<AudioBuffer | null>>()

function clampVolume(value: number): number {
  return Math.min(1, Math.max(0, value))
}

function gainFor(volume: number): number {
  // 人耳对音量是非线性的；平方后再留一点余量，默认 50% 不会太吵。
  return Math.pow(clampVolume(volume), 1.5) * DEFAULT_GAIN
}

function ensureContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!audioContext) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    audioContext = new Ctor()
    masterGain = audioContext.createGain()
    masterGain.gain.value = gainFor(options.volume)
    masterGain.connect(audioContext.destination)
  }
  if (audioContext.state === 'suspended') void audioContext.resume().catch(() => undefined)
  return audioContext
}

export function configureTypingSound(next: Partial<SoundOptions>): void {
  options = { ...options, ...next }
  if (masterGain) masterGain.gain.value = options.enabled ? gainFor(options.volume) : 0
}

function soundUrl(pack: TypingSoundPack, file: string): string {
  const base = import.meta.env.BASE_URL || './'
  return new URL(`${base}sounds/${pack}/${file}`, window.location.href).href
}

async function loadBuffer(url: string, context: AudioContext): Promise<AudioBuffer | null> {
  const cached = buffers.get(url)
  if (cached) return cached
  const running = pending.get(url)
  if (running) return running

  const task = fetch(url)
    .then((response) => {
      if (!response.ok) throw new Error(`sound-${response.status}`)
      return response.arrayBuffer()
    })
    .then((data) => context.decodeAudioData(data))
    .then((buffer) => {
      buffers.set(url, buffer)
      return buffer
    })
    .catch(() => null)
    .finally(() => pending.delete(url))
  pending.set(url, task)
  return task
}

function playBuffer(buffer: AudioBuffer, kind: TypingKeyKind, phase: TypingKeyPhase): void {
  const context = audioContext
  if (!context || !masterGain) return
  const source = context.createBufferSource()
  source.buffer = buffer
  // 轻微提高音高并加高通，去掉低频闷响，让 click 更清脆。
  source.playbackRate.value = 1 + Math.random() * 0.08
  const filter = context.createBiquadFilter()
  filter.type = 'highpass'
  filter.frequency.value = 180
  filter.Q.value = 0.7
  const gain = context.createGain()
  const base = phase === 'up' ? RELEASE_GAIN : 1
  const weight = kind === 'space' ? 1.05 : kind === 'enter' ? 1.15 : 1
  const variation = 0.9 + Math.random() * 0.12
  gain.gain.value = base * weight * variation
  source.connect(filter).connect(gain).connect(masterGain)
  source.start()
}

/** 在用户手势里预加载当前音效包，避免第一次按键时没声音。 */
export async function primeTypingSound(pack: TypingSoundPack): Promise<void> {
  const context = ensureContext()
  if (!context) return
  const files = new Set<string>()
  for (const kind of ['key', 'space', 'enter', 'backspace'] as TypingKeyKind[]) {
    files.add(typingSoundFile(kind, 'down'))
    files.add(typingSoundFile(kind, 'up'))
  }
  await Promise.all([...files].map((file) => loadBuffer(soundUrl(pack, file), context)))
}

export function playTypingKey(kind: TypingKeyKind, phase: TypingKeyPhase): void {
  if (!options.enabled) return
  const context = ensureContext()
  if (!context) return
  const url = soundUrl(options.pack, typingSoundFile(kind, phase))
  const buffer = buffers.get(url)
  if (buffer) {
    playBuffer(buffer, kind, phase)
    return
  }
  // 还没加载好就跳过这一下，异步加载完成后下一次按键自然会有声音。
  void loadBuffer(url, context)
}

/** 设置页试听：不修改当前设置，按传入的音效包和音量播放一次。 */
export async function previewTypingSound(pack: TypingSoundPack, volume: number): Promise<void> {
  const context = ensureContext()
  if (!context) return
  await context.resume().catch(() => undefined)
  const buffer = await loadBuffer(soundUrl(pack, 'key_press.wav'), context)
  if (!buffer) return
  const previous = masterGain?.gain.value ?? 0
  if (masterGain) masterGain.gain.value = gainFor(volume)
  playBuffer(buffer, 'key', 'down')
  window.setTimeout(() => {
    if (masterGain) masterGain.gain.value = previous
  }, 120)
}
