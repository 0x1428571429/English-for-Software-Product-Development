/**
 * Edge Read Aloud TTS——浏览器端实现。
 *
 * 这是对 Edge「大声朗读」公开合成通道的逆向封装，不是微软官方 API：
 * - 免费、无需 key；
 * - 协议或令牌可能随时变化，失败时由 `speech.ts` 回退到浏览器/百度/Google；
 * - 仅供个人学习使用，不要拿它做高并发或商业服务。
 *
 * 协议参考：Edge Read Aloud WebSocket + `Sec-MS-GEC` 时间戳签名。
 * 合成固定使用 24kHz/48kbps MP3；语速由播放器的 playbackRate 控制，
 * 这样同一句话可以按不同语速复用缓存。
 */

const TRUSTED_CLIENT_TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4'
const WSS_URL = 'wss://api.msedgeservices.com/tts/cognitiveservices/websocket/v1'
const GEC_VERSION = '2-155.0.4283.45'
const OUTPUT_FORMAT = 'audio-24khz-48kbitrate-mono-mp3'

const WIN_EPOCH_OFFSET = 11644473600
const GEC_PREFIX =
  'Copyright (C) Microsoft Corporation. All rights reserved.'

export const DEFAULT_EDGE_VOICE = 'en-US-AriaNeural'

export interface EdgeVoice {
  id: string
  label: string
  lang: string
  gender: 'Female' | 'Male'
}

export const EDGE_VOICES: EdgeVoice[] = [
  { id: 'en-US-AriaNeural', label: 'Aria · 美音女声（自然）', lang: 'en-US', gender: 'Female' },
  { id: 'en-US-JennyNeural', label: 'Jenny · 美音女声（清晰）', lang: 'en-US', gender: 'Female' },
  { id: 'en-US-AvaNeural', label: 'Ava · 美音女声（年轻）', lang: 'en-US', gender: 'Female' },
  { id: 'en-US-EmmaNeural', label: 'Emma · 美音女声（温和）', lang: 'en-US', gender: 'Female' },
  { id: 'en-US-GuyNeural', label: 'Guy · 美音男声', lang: 'en-US', gender: 'Male' },
  { id: 'en-US-AndrewNeural', label: 'Andrew · 美音男声（自然）', lang: 'en-US', gender: 'Male' },
  { id: 'en-US-BrianNeural', label: 'Brian · 美音男声（沉稳）', lang: 'en-US', gender: 'Male' },
  { id: 'en-GB-SoniaNeural', label: 'Sonia · 英音女声', lang: 'en-GB', gender: 'Female' },
  { id: 'en-GB-LibbyNeural', label: 'Libby · 英音女声', lang: 'en-GB', gender: 'Female' },
  { id: 'en-GB-RyanNeural', label: 'Ryan · 英音男声', lang: 'en-GB', gender: 'Male' },
  { id: 'en-AU-NatashaNeural', label: 'Natasha · 澳洲女声', lang: 'en-AU', gender: 'Female' },
]

/** 只有同时具备 WebSocket 与 Web Crypto 的浏览器才能走这条通道。 */
export function edgeTtsSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof WebSocket !== 'undefined' &&
    Boolean(globalThis.crypto?.subtle)
  )
}

function randomId(): string {
  const cryptoApi = globalThis.crypto
  if (cryptoApi?.randomUUID) return cryptoApi.randomUUID().replace(/-/g, '')
  const bytes = cryptoApi.getRandomValues(new Uint8Array(16))
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Sec-MS-GEC v2：`<16 hex>-<64 hex>`。
 *
 * 前 8 字节来自 CS64 混淆链，后 32 字节是 SHA-256。
 * 输入 = 57 字节固定前缀 + 5 分钟取整的 Windows FILETIME ticks + token。
 *
 * 2026-10 之后旧 v1 token 会被 403；必须保留 v2 格式和 `2-` 版本号。
 * 算法参考 rany2/edge-tts PR #492 与 readest 的浏览器实现。
 */
function rol16(value: number): number {
  return ((value << 16) | (value >>> 16)) >>> 0
}

function toWords(bytes: Uint8Array): number[] {
  const padded = new Uint8Array(Math.ceil(bytes.length / 8) * 8)
  padded.set(bytes)
  const view = new DataView(padded.buffer)
  return Array.from({ length: padded.length / 4 }, (_, index) => view.getUint32(index * 4, true))
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()
}

function cs64WordSwap(words: number[], a: number, b: number): [number, number] {
  let acc = 0
  let last = 0
  for (let index = 0; index < words.length; index += 2) {
    const x = words[index]
    const y = words[index + 1]
    let t = rol16((Math.imul(rol16(x), 0xef0569fb) + Math.imul(x, a)) >>> 0)
    let q = Math.imul(t, 0x76f50f34) >>> 0
    acc = (acc + Math.imul(rol16(q), 0xc3efea97) + q) >>> 0
    t = rol16((Math.imul(rol16(y), 0xc31713db) + Math.imul(y, b)) >>> 0)
    q = Math.imul(t, 0x1881ce3c) >>> 0
    last = (Math.imul(rol16(q), 0x35bd1ec9) + q) >>> 0
    acc = (acc + last) >>> 0
  }
  return [last, acc]
}

function cs64Reversible(words: number[], a: number, b: number): [number, number] {
  let state = 0
  let acc = 0
  for (let index = 0; index < words.length; index += 2) {
    state = Math.imul(state + words[index], a) >>> 0
    for (const constant of [0xcf98b111, 0x87085b9f, 0x12ceb96d, 0x257e1d83]) {
      state = Math.imul(rol16(state), constant) >>> 0
    }
    let t = Math.imul(words[index + 1] + state, b) >>> 0
    t = Math.imul(rol16(t), 0xa27416f5) >>> 0
    t = rol16(Math.imul(rol16(t), 0xd38396ff) >>> 0)
    acc = (acc + state) >>> 0
    state = Math.imul(rol16(Math.imul(t, 0x7c932b89) >>> 0), 0xbfa49f69) >>> 0
    acc = (acc + state) >>> 0
  }
  return [state, acc]
}

export async function generateSecMsGec(now = Date.now()): Promise<string> {
  let ticks = Math.floor(now / 1000)
  ticks += WIN_EPOCH_OFFSET
  ticks -= ticks % 300
  ticks *= 10000000
  const suffix = new TextEncoder().encode(`${ticks.toFixed(0)}${TRUSTED_CLIENT_TOKEN}`)
  const data = new Uint8Array(GEC_PREFIX.length + suffix.length)
  data.set(new TextEncoder().encode(GEC_PREFIX), 0)
  data.set(suffix, GEC_PREFIX.length)

  const digest = new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256', data))
  const words = toWords(data)
  const [key0, key1] = toWords(digest)
  const a = (key0 | 1) >>> 0
  const b = (key1 | 1) >>> 0
  const [s0, s1] = cs64WordSwap(words, a, b)
  const [r0, r1] = cs64Reversible(words, a, b)
  const cs64 = new DataView(new ArrayBuffer(8))
  cs64.setUint32(0, s0 ^ r0, true)
  cs64.setUint32(4, s1 ^ r1, true)
  return `${toHex(new Uint8Array(cs64.buffer))}-${toHex(digest)}`
}

export function edgeSocketUrl(secMsGec: string, connectionId: string): string {
  const params = new URLSearchParams({
    'Ocp-Apim-Subscription-Key': TRUSTED_CLIENT_TOKEN,
    'Sec-MS-GEC': secMsGec,
    'Sec-MS-GEC-Version': GEC_VERSION,
    ConnectionId: connectionId,
  })
  return `${WSS_URL}?${params.toString()}`
}

export function escapeXml(value: string): string {
  return value.replace(/[<>&'"]/g, (char) => {
    switch (char) {
      case '<':
        return '&lt;'
      case '>':
        return '&gt;'
      case '&':
        return '&amp;'
      case "'":
        return '&apos;'
      default:
        return '&quot;'
    }
  })
}

export function buildEdgeSsml(text: string, voice = DEFAULT_EDGE_VOICE): string {
  return (
    `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'>` +
    `<voice name='${escapeXml(voice)}'>` +
    `<prosody pitch='+0Hz' rate='+0%' volume='+0%'>${escapeXml(text)}</prosody>` +
    `</voice></speak>`
  )
}

export function buildSpeechConfig(): string {
  const body = JSON.stringify({
    context: {
      synthesis: {
        audio: {
          metadataoptions: {
            sentenceBoundaryEnabled: 'false',
            wordBoundaryEnabled: 'false',
          },
          outputFormat: OUTPUT_FORMAT,
        },
      },
    },
  })
  return (
    `X-Timestamp:${new Date().toString()}\r\n` +
    `Content-Type:application/json; charset=utf-8\r\n` +
    `Path:speech.config\r\n\r\n${body}`
  )
}

export function buildSsmlMessage(
  text: string,
  voice: string,
  requestId: string,
  timestamp = new Date(),
): string {
  return (
    `X-RequestId:${requestId}\r\n` +
    `Content-Type:application/ssml+xml\r\n` +
    `X-Timestamp:${timestamp.toString()}\r\n` +
    `Path:ssml\r\n\r\n` +
    buildEdgeSsml(text, voice)
  )
}

/**
 * 二进制帧格式：2 字节大端 header 长度 + header + 音频数据。
 * 只取 `Path:audio` 帧；`turn.end` 是文本消息，由 WebSocket 层处理。
 */
export function parseEdgeBinaryFrame(data: ArrayBuffer): Uint8Array | null {
  if (data.byteLength < 2) return null
  const view = new DataView(data)
  const headerLength = view.getUint16(0)
  if (data.byteLength < 2 + headerLength) return null
  const header = new TextDecoder().decode(new Uint8Array(data, 2, headerLength))
  if (!header.includes('Path:audio')) return null
  const audio = new Uint8Array(data, 2 + headerLength)
  return audio.byteLength ? audio : null
}

function concatChunks(chunks: Uint8Array[]): Uint8Array<ArrayBuffer> {
  const total = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0)
  const result = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    result.set(chunk, offset)
    offset += chunk.byteLength
  }
  return result
}

const activeSockets = new Set<WebSocket>()

/** 用户切歌/离开页面时，主动结束所有正在合成的连接。 */
export function cancelEdgeSynthesis(): void {
  for (const socket of activeSockets) {
    try {
      socket.close()
    } catch {
      // ignore
    }
  }
  activeSockets.clear()
}

export interface EdgeSynthesisOptions {
  voice?: string
  signal?: AbortSignal
  /** 测试用；默认 20 秒。 */
  timeoutMs?: number
}

/** 合成一段 MP3。失败时抛出 `edge-*` 错误，由上层决定如何回退。 */
export async function synthesizeEdge(
  text: string,
  options: EdgeSynthesisOptions = {},
): Promise<Blob> {
  const clean = String(text ?? '').trim()
  if (!clean) throw new Error('edge-empty-text')
  if (!edgeTtsSupported()) throw new Error('edge-unsupported')
  if (options.signal?.aborted) throw new Error('edge-aborted')

  const voice = options.voice || DEFAULT_EDGE_VOICE
  const requestId = randomId()
  const connectionId = randomId()
  const secMsGec = await generateSecMsGec()
  const socket = new WebSocket(edgeSocketUrl(secMsGec, connectionId))
  socket.binaryType = 'arraybuffer'
  activeSockets.add(socket)

  return new Promise<Blob>((resolve, reject) => {
    const chunks: Uint8Array[] = []
    let settled = false
    let timeout: ReturnType<typeof setTimeout> | null = null

    const cleanup = () => {
      if (timeout) clearTimeout(timeout)
      options.signal?.removeEventListener('abort', onAbort)
      activeSockets.delete(socket)
      try {
        socket.close()
      } catch {
        // ignore
      }
    }

    const finish = (error?: Error) => {
      if (settled) return
      settled = true
      cleanup()
      if (error) {
        reject(error)
        return
      }
      if (!chunks.length) {
        reject(new Error('edge-no-audio'))
        return
      }
      resolve(new Blob([concatChunks(chunks)], { type: 'audio/mpeg' }))
    }

    const onAbort = () => finish(new Error('edge-aborted'))
    options.signal?.addEventListener('abort', onAbort, { once: true })
    timeout = setTimeout(() => finish(new Error('edge-timeout')), options.timeoutMs ?? 20000)

    socket.onopen = () => {
      try {
        socket.send(buildSpeechConfig())
        socket.send(buildSsmlMessage(clean, voice, requestId))
      } catch {
        finish(new Error('edge-send-failed'))
      }
    }

    socket.onmessage = (event) => {
      if (typeof event.data === 'string') {
        if (event.data.includes('Path:turn.end')) finish()
        return
      }
      if (event.data instanceof ArrayBuffer) {
        const audio = parseEdgeBinaryFrame(event.data)
        if (audio) chunks.push(audio)
      }
    }

    socket.onerror = () => finish(new Error('edge-socket-error'))
    socket.onclose = () => {
      if (!settled) finish(new Error('edge-closed'))
    }
  })
}
