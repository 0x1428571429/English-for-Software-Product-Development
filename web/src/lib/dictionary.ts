import raw from '../data/word-map.generated.json'

export interface DictionaryEntry {
  word: string
  zh: string
  ipa: string | null
  example: string | null
  source: string
}

interface WordMapFile {
  version: number
  count: number
  entries: Record<string, DictionaryEntry>
}

const file = raw as unknown as WordMapFile
const entries = new Map<string, DictionaryEntry>(Object.entries(file.entries))

export const dictionarySize = entries.size

export function normalizeTerm(rawTerm: string): string {
  return rawTerm
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, ' ')
    .replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, '')
    .trim()
}

function variants(word: string): string[] {
  const result = new Set<string>([word])
  if (word.endsWith("'s")) result.add(word.slice(0, -2))
  if (word.endsWith('ies') && word.length > 4) result.add(`${word.slice(0, -3)}y`)
  if (word.endsWith('es') && word.length > 3) result.add(word.slice(0, -2))
  if (word.endsWith('s') && !word.endsWith('ss') && word.length > 2) result.add(word.slice(0, -1))
  if (word.endsWith('ing') && word.length > 5) {
    const base = word.slice(0, -3)
    result.add(base)
    result.add(`${base}e`)
    if (base.length > 2 && base.at(-1) === base.at(-2)) result.add(base.slice(0, -1))
  }
  if (word.endsWith('ed') && word.length > 4) {
    const base = word.slice(0, -2)
    result.add(base)
    result.add(`${base}e`)
    if (base.length > 2 && base.at(-1) === base.at(-2)) result.add(base.slice(0, -1))
  }
  return [...result]
}

export function lookupWord(rawWord: string): DictionaryEntry | null {
  const word = normalizeTerm(rawWord)
  if (!word) return null
  for (const candidate of variants(word)) {
    const found = entries.get(candidate)
    if (found) return found
  }
  return null
}

/** Look up a contiguous phrase (longest window should be tried first). */
export function lookupPhrase(rawWords: string[]): { entry: DictionaryEntry; matched: string } | null {
  const key = normalizeTerm(rawWords.join(' '))
  if (!key || key.split(' ').length > 6) return null
  const found = entries.get(key)
  if (!found) return null
  return { entry: found, matched: key }
}

export function allDictionaryEntries(): DictionaryEntry[] {
  return [...entries.values()]
}
