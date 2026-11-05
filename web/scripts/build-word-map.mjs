#!/usr/bin/env node
/**
 * Build the local hover dictionary from the corpus plus a hand-written
 * story glossary. The output is intentionally a plain JSON map so it can be
 * imported synchronously and used offline.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')
const corpusPath = resolve(root, 'src/data/corpus.generated.json')
const extraPath = resolve(here, 'word-extra.json')
const outputPath = resolve(root, 'src/data/word-map.generated.json')

const corpus = JSON.parse(await readFile(corpusPath, 'utf8'))
const extra = JSON.parse(await readFile(extraPath, 'utf8'))

function normalize(raw) {
  return String(raw ?? '')
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, ' ')
    .replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, '')
    .trim()
}

function usable(key) {
  if (!key || key.length > 48) return false
  const words = key.split(' ').filter(Boolean)
  if (words.length > 6) return false
  return /^[a-z0-9][a-z0-9 ' -]*$/.test(key)
}

const entries = new Map()

function add(rawKey, data) {
  const key = normalize(rawKey)
  if (!usable(key)) return
  const existing = entries.get(key)
  if (existing) {
    entries.set(key, {
      ...existing,
      ...data,
      zh: data.zh || existing.zh,
      ipa: data.ipa || existing.ipa,
      example: data.example || existing.example,
    })
    return
  }
  entries.set(key, {
    word: key,
    zh: data.zh ?? '',
    ipa: data.ipa ?? null,
    example: data.example ?? null,
    source: data.source ?? 'corpus',
  })
}

for (const item of corpus.vocab ?? []) {
  add(item.term, {
    zh: item.meaningZh,
    example: item.exampleRaw?.replace(/^["']|["']$/g, '') ?? null,
    source: 'vocab',
  })
}

for (const item of corpus.pronunciation ?? []) {
  add(item.word, {
    ipa: item.correct,
    example: null,
    source: 'pronunciation',
  })
}

for (const item of corpus.expressions ?? []) {
  add(item.titleEn, { zh: item.meaningZh, source: 'expression' })
  for (const pair of item.pairs ?? []) add(pair.en, { zh: pair.zh, source: 'expression' })
  for (const alt of item.alternatives ?? []) add(alt, { zh: item.meaningZh, source: 'expression' })
}

for (const item of corpus.highFrequency ?? []) {
  for (const answer of item.answers ?? []) add(answer, { zh: item.meaningZh, source: 'high-frequency' })
}

for (const [key, data] of Object.entries(extra)) {
  add(key, { ...data, source: 'story' })
}

const entriesObject = Object.fromEntries(
  [...entries.entries()]
    .filter(([, value]) => value.zh || value.ipa)
    .sort(([a], [b]) => a.localeCompare(b)),
)

await mkdir(dirname(outputPath), { recursive: true })
await writeFile(
  outputPath,
  JSON.stringify(
    {
      version: 1,
      generatedAt: new Date().toISOString(),
      count: Object.keys(entriesObject).length,
      entries: entriesObject,
    },
    null,
    2,
  ),
  'utf8',
)

console.log(`Word map: ${Object.keys(entriesObject).length} entries`)
console.log(`Wrote ${outputPath}`)
