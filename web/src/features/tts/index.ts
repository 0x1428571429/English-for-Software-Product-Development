import { synthesizeEdge } from './edge'
import { blobToDataUrl, readEdgeCache, writeEdgeCache } from './cache'

const DEFAULT_VOICE = 'en-US-AriaNeural'

export interface EdgeAudioSource {
  url: string
  /** true 表示是本次新建的 blob URL，播放完需要 revoke。 */
  revoke: boolean
  fromCache: boolean
}

/**
 * 取一段可播放的 Edge 音频：
 * 1. 先查 IndexedDB；
 * 2. 没有再合成，合成成功后异步写入缓存；
 * 3. 返回 blob URL 或缓存里的 data URL。
 */
export async function edgeAudioSource(
  text: string,
  voice = DEFAULT_VOICE,
  signal?: AbortSignal,
  proxyUrl = '',
): Promise<EdgeAudioSource> {
  const cached = await readEdgeCache(text, voice)
  if (cached) return { url: cached, revoke: false, fromCache: true }

  let blob: Blob
  if (proxyUrl.trim()) {
    const response = await fetch(`${proxyUrl.trim().replace(/\/+$/, '')}/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice }),
      signal,
    })
    if (!response.ok) throw new Error(`edge-proxy-${response.status}`)
    blob = await response.blob()
  } else {
    blob = await synthesizeEdge(text, { voice, signal })
  }

  if (!blob.size) throw new Error('edge-empty-audio')
  const url = URL.createObjectURL(blob)
  void blobToDataUrl(blob)
    .then((dataUrl) => writeEdgeCache(text, voice, dataUrl))
    .catch(() => undefined)
  return { url, revoke: true, fromCache: false }
}

export { cancelEdgeSynthesis, edgeTtsSupported, EDGE_VOICES, DEFAULT_EDGE_VOICE } from './edge'
export type { EdgeVoice } from './edge'
export { clearEdgeCache, edgeCacheCount } from './cache'
