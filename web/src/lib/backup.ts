import { useProgressStore, type ProgressExport } from '../store/useProgressStore'
import { useSettingsStore, type SettingsSnapshot } from '../store/useSettingsStore'
import { useStoryStore, type StorySnapshot } from '../store/useStoryStore'
import { useFavoritesStore, type FavoritesExport } from '../store/useFavoritesStore'
import { appStorageKeys, idbClear, idbSupported, storageEstimate } from './storage'

export interface UnifiedBackup {
  app: 'efspd-trainer'
  format: 'efspd-backup'
  formatVersion: 1
  exportedAt: string
  stores: {
    progress: { version: 1; data: ProgressExport }
    settings: { version: 1; data: SettingsSnapshot }
    story: { version: 1; data: StorySnapshot }
    favorites: { version: 1; data: FavoritesExport }
  }
}

export interface ImportResult {
  imported: string[]
  skipped: string[]
}

export interface StorageStats {
  supported: boolean
  keys: string[]
  usage: number
  quota: number
}

const STORE_NAMES = ['progress', 'settings', 'story', 'favorites'] as const

export function createBackup(): UnifiedBackup {
  return {
    app: 'efspd-trainer',
    format: 'efspd-backup',
    formatVersion: 1,
    exportedAt: new Date().toISOString(),
    stores: {
      progress: { version: 1, data: useProgressStore.getState().exportProgress() },
      settings: { version: 1, data: useSettingsStore.getState().exportSettings() },
      story: { version: 1, data: useStoryStore.getState().exportStory() },
      favorites: { version: 1, data: useFavoritesStore.getState().exportFavorites() },
    },
  }
}

export function isLegacyProgressExport(value: unknown): value is ProgressExport {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<ProgressExport>
  return candidate.app === 'efspd-trainer' && Boolean(candidate.cards)
}

export function isUnifiedBackup(value: unknown): value is UnifiedBackup {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<UnifiedBackup>
  return (
    candidate.app === 'efspd-trainer' &&
    candidate.format === 'efspd-backup' &&
    Boolean(candidate.stores) &&
    typeof candidate.stores === 'object'
  )
}

export function importBackup(raw: unknown): ImportResult {
  if (isLegacyProgressExport(raw)) {
    useProgressStore.getState().importProgress(raw)
    return { imported: ['progress'], skipped: [] }
  }

  if (!isUnifiedBackup(raw)) {
    throw new Error('无法识别的备份格式')
  }

  const imported: string[] = []
  const skipped: string[] = []
  const stores = raw.stores as Record<string, unknown>

  for (const name of Object.keys(stores)) {
    if (!STORE_NAMES.includes(name as (typeof STORE_NAMES)[number])) skipped.push(name)
  }

  const progress = stores.progress as { data?: ProgressExport } | undefined
  if (progress?.data) {
    useProgressStore.getState().importProgress(progress.data)
    imported.push('progress')
  }

  const settings = stores.settings as { data?: Partial<SettingsSnapshot> } | undefined
  if (settings?.data) {
    useSettingsStore.getState().importSettings(settings.data)
    imported.push('settings')
  }

  const story = stores.story as { data?: Partial<StorySnapshot> } | undefined
  if (story?.data) {
    useStoryStore.getState().importStory(story.data)
    imported.push('story')
  }

  const favorites = stores.favorites as { data?: FavoritesExport } | undefined
  if (favorites?.data) {
    useFavoritesStore.getState().importFavorites(favorites.data)
    imported.push('favorites')
  }

  return { imported, skipped }
}

export async function storageStats(): Promise<StorageStats> {
  const [keys, estimate] = await Promise.all([appStorageKeys(), storageEstimate()])
  return {
    supported: idbSupported(),
    keys,
    usage: estimate?.usage ?? 0,
    quota: estimate?.quota ?? 0,
  }
}

export async function clearAllData(): Promise<void> {
  await idbClear().catch(() => undefined)
  await Promise.all([
    useProgressStore.persist.clearStorage(),
    useSettingsStore.persist.clearStorage(),
    useStoryStore.persist.clearStorage(),
    useFavoritesStore.persist.clearStorage(),
  ]).catch(() => undefined)
  useProgressStore.getState().resetAll()
  useSettingsStore.getState().reset()
  useStoryStore.getState().reset()
  useFavoritesStore.getState().reset()
  if (typeof localStorage !== 'undefined') {
    for (const key of Object.keys(localStorage)) {
      if (key.toLowerCase().includes('efspd')) localStorage.removeItem(key)
    }
  }
}

export function formatBytes(bytes: number): string {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const index = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)))
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`
}
