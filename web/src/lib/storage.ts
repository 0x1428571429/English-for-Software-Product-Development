import { createJSONStorage, type StateStorage } from 'zustand/middleware'

const DB_NAME = 'efspd'
const DB_VERSION = 1
const KV_STORE = 'kv'

interface KvRow {
  key: string
  value: string
  updatedAt: number
}

let dbPromise: Promise<IDBDatabase> | null = null

export function idbSupported(): boolean {
  return typeof indexedDB !== 'undefined'
}

function openDb(): Promise<IDBDatabase> {
  if (!idbSupported()) return Promise.reject(new Error('IndexedDB is not available'))
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(KV_STORE)) {
        const store = db.createObjectStore(KV_STORE, { keyPath: 'key' })
        store.createIndex('updatedAt', 'updatedAt')
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB'))
    request.onblocked = () => reject(new Error('IndexedDB upgrade blocked by another tab'))
  })
  return dbPromise
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'))
  })
}

async function readRow(key: string): Promise<KvRow | undefined> {
  const db = await openDb()
  const tx = db.transaction(KV_STORE, 'readonly')
  const store = tx.objectStore(KV_STORE)
  return requestToPromise(store.get(key) as IDBRequest<KvRow | undefined>)
}

async function writeRow(key: string, value: string): Promise<void> {
  const db = await openDb()
  const tx = db.transaction(KV_STORE, 'readwrite')
  const store = tx.objectStore(KV_STORE)
  const row: KvRow = { key, value, updatedAt: Date.now() }
  await requestToPromise(store.put(row))
}

async function deleteRow(key: string): Promise<void> {
  const db = await openDb()
  const tx = db.transaction(KV_STORE, 'readwrite')
  await requestToPromise(tx.objectStore(KV_STORE).delete(key))
}

export async function idbGet(key: string): Promise<string | null> {
  const row = await readRow(key)
  return row?.value ?? null
}

export async function idbSet(key: string, value: string): Promise<void> {
  await writeRow(key, value)
}

export async function idbDelete(key: string): Promise<void> {
  await deleteRow(key)
}

export async function idbKeys(): Promise<string[]> {
  const db = await openDb()
  const tx = db.transaction(KV_STORE, 'readonly')
  const keys = await requestToPromise(tx.objectStore(KV_STORE).getAllKeys() as IDBRequest<IDBValidKey[]>)
  return keys.map(String)
}

export async function idbClear(): Promise<void> {
  const db = await openDb()
  const tx = db.transaction(KV_STORE, 'readwrite')
  await requestToPromise(tx.objectStore(KV_STORE).clear())
}

/**
 * Zustand storage adapter.
 *
 * IndexedDB is canonical. If it is unavailable (private mode, old browser,
 * tests), we fall back to localStorage. On first read we migrate the legacy
 * localStorage value into IndexedDB so existing progress is not lost.
 */
export const idbStateStorage: StateStorage = {
  getItem: async (name) => {
    try {
      const current = await idbGet(name)
      if (current !== null) return current
      const legacy = typeof localStorage !== 'undefined' ? localStorage.getItem(name) : null
      if (legacy !== null) {
        await idbSet(name, legacy)
        localStorage.removeItem(name)
        return legacy
      }
      return null
    } catch {
      return typeof localStorage !== 'undefined' ? localStorage.getItem(name) : null
    }
  },
  setItem: async (name, value) => {
    try {
      await idbSet(name, value)
    } catch {
      if (typeof localStorage !== 'undefined') localStorage.setItem(name, value)
    }
  },
  removeItem: async (name) => {
    try {
      await idbDelete(name)
    } catch {
      // Ignore: the fallback removal below is still attempted.
    }
    if (typeof localStorage !== 'undefined') localStorage.removeItem(name)
  },
}

export function createAppStorage() {
  return createJSONStorage(() => idbStateStorage)
}

export async function storageEstimate(): Promise<{ usage: number; quota: number } | null> {
  if (typeof navigator === 'undefined' || !navigator.storage?.estimate) return null
  const estimate = await navigator.storage.estimate()
  return { usage: estimate.usage ?? 0, quota: estimate.quota ?? 0 }
}

export async function appStorageKeys(): Promise<string[]> {
  try {
    return await idbKeys()
  } catch {
    return []
  }
}
