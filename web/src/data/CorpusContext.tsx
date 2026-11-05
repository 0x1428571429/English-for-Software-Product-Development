import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { buildIndex, loadCorpus, type CorpusIndex } from './corpus'
import type { Corpus } from './types'

interface CorpusContextValue {
  corpus: Corpus | null
  index: CorpusIndex | null
  loading: boolean
  error: string | null
}

const CorpusContext = createContext<CorpusContextValue | null>(null)

export function CorpusProvider({ children }: { children: ReactNode }) {
  const [corpus, setCorpus] = useState<Corpus | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    loadCorpus()
      .then((data) => {
        if (!cancelled) setCorpus(data)
      })
      .catch((reason: unknown) => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : '语料加载失败')
      })
    return () => {
      cancelled = true
    }
  }, [])

  const index = useMemo(() => (corpus ? buildIndex(corpus) : null), [corpus])
  const value = useMemo(
    () => ({ corpus, index, loading: !corpus && !error, error }),
    [corpus, index, error],
  )

  return <CorpusContext.Provider value={value}>{children}</CorpusContext.Provider>
}

export function useCorpus(): CorpusContextValue {
  const value = useContext(CorpusContext)
  if (!value) throw new Error('useCorpus must be used inside CorpusProvider')
  return value
}
