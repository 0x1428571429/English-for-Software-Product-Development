import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createAppStorage } from '../lib/storage'

export type FavoriteKind = 'word' | 'expression' | 'card' | 'dialogue' | 'story'
export type FavoriteColor = 'yellow' | 'green' | 'pink'

export interface FavoriteItem {
  id: string
  kind: FavoriteKind
  title: string
  zh?: string
  ipa?: string | null
  example?: string | null
  note?: string
  source?: string
  color: FavoriteColor
  createdAt: string
  updatedAt: string
}

export interface FavoritesExport {
  schemaVersion: 1
  items: Record<string, FavoriteItem>
}

interface FavoritesState {
  items: Record<string, FavoriteItem>
  add: (item: Omit<FavoriteItem, 'createdAt' | 'updatedAt'> & Partial<Pick<FavoriteItem, 'createdAt' | 'updatedAt'>>) => void
  remove: (id: string) => void
  setColor: (id: string, color: FavoriteColor) => void
  toggle: (item: Omit<FavoriteItem, 'createdAt' | 'updatedAt'>) => void
  exportFavorites: () => FavoritesExport
  importFavorites: (payload: FavoritesExport) => void
  reset: () => void
}

export function favoriteId(kind: FavoriteKind, title: string): string {
  const normalized = title
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
  return `${kind}:${normalized}`
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      items: {},
      add: (item) => {
        const now = new Date().toISOString()
        const existing = get().items[item.id]
        set((state) => ({
          items: {
            ...state.items,
            [item.id]: {
              ...existing,
              ...item,
              createdAt: existing?.createdAt ?? item.createdAt ?? now,
              updatedAt: now,
            },
          },
        }))
      },
      remove: (id) =>
        set((state) => {
          const next = { ...state.items }
          delete next[id]
          return { items: next }
        }),
      setColor: (id, color) =>
        set((state) => {
          const item = state.items[id]
          if (!item) return state
          return {
            items: {
              ...state.items,
              [id]: { ...item, color, updatedAt: new Date().toISOString() },
            },
          }
        }),
      toggle: (item) => {
        if (get().items[item.id]) get().remove(item.id)
        else get().add(item)
      },
      exportFavorites: () => ({ schemaVersion: 1, items: get().items }),
      importFavorites: (payload) =>
        set({
          items: Object.fromEntries(
            Object.entries(payload.items ?? {}).filter(([, item]) => {
              return Boolean(item && typeof item.id === 'string' && typeof item.title === 'string')
            }),
          ),
        }),
      reset: () => set({ items: {} }),
    }),
    {
      name: 'efspd.favorites.v1',
      storage: createAppStorage(),
      version: 1,
      partialize: (state) => ({ items: state.items }),
    },
  ),
)
