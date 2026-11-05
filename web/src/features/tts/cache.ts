import { idbDelete, idbGet, idbKeys, idbSet } from '../../lib/storage'

/**
 * Edge TTS 音频缓存。
 *
 * 音频以 data URL 存在现有 IDB `kv` 里，避免升级数据库版本。
 * key 由「文本 + 音色」决定，不含语速；语速由播放器 playbackRate 控制，
 * 所以同一句在 0.8× 和 1.0× 下只需要合成一次。
 */

const PREFIX = 'tts.edge.v1.'
const MAX_ENTRIES = 600

function hashText(value: string): number {
  let hash = 2166136261
  const text = value.trim().toLowerCase()
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

export function edgeCacheKey(text: string, voice: string): string {
  return `${PREFIX}${voice}.${hashText(text)}`
}

export async function readEdgeCache(text: string, voice: string): Promise<string | null> {
  try {
    return await idbGet(edgeCacheKey(text, voice))
  } catch {
    return null
  }
}

export async function writeEdgeCache(text: string, voice: string, dataUrl: string): Promise<void> {
  try {
    await idbSet(edgeCacheKey(text, voice), dataUrl)
    await trimEdgeCache()
  } catch {
    // 缓存失败不影响播放。
  }
}

async function trimEdgeCache(): Promise<void> {
  try {
    const keys = (await idbKeys()).filter((key) => key.startsWith(PREFIX))
    if (keys.length <= MAX_ENTRIES) return
    const excess = keys.length - MAX_ENTRIES
    await Promise.all(keys.slice(0, excess).map((key) => idbDelete(key)))
  } catch {
    // ignore
  }
}

export async function edgeCacheCount(): Promise<number> {
  try {
    return (await idbKeys()).filter((key) => key.startsWith(PREFIX)).length
  } catch {
    return 0
  }
}

export async function clearEdgeCache(): Promise<number> {
  try {
    const keys = (await idbKeys()).filter((key) => key.startsWith(PREFIX))
    await Promise.all(keys.map((key) => idbDelete(key)))
    return keys.length
  } catch {
    return 0
  }
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(reader.error ?? new Error('blob-read-failed'))
    reader.readAsDataURL(blob)
  })
}
