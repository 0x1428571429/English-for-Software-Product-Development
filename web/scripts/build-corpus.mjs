#!/usr/bin/env node
/**
 * Build the training corpus from the Markdown source.
 *
 * Sources:
 *   frontend-engineer/NN-*\/01-dialogue.md
 *   frontend-engineer/NN-*\/NN-*.md          (expression analyses)
 *   frontend-engineer/NN-*\/NN-vocab.md
 *   frontend-engineer/NN-*\/NN-pronunciation.md
 *   frontend-engineer/reference/*.md
 *   scripts/dialogue_data.json
 *
 * Output:
 *   web/src/data/corpus.generated.json
 *   web/src/data/corpus.report.json
 *
 * No third-party dependencies. Run with `node scripts/build-corpus.mjs`.
 */

import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const WEB_ROOT = path.resolve(__dirname, '..')
const REPO_ROOT = path.resolve(WEB_ROOT, '..')
const SOURCE_ROOT = path.join(REPO_ROOT, 'frontend-engineer')
const DIALOGUE_TRANSLATIONS = path.join(REPO_ROOT, 'scripts', 'dialogue_data.json')
const OUT_DIR = path.join(WEB_ROOT, 'src', 'data')
const OUT_CORPUS = path.join(OUT_DIR, 'corpus.generated.json')
const OUT_REPORT = path.join(OUT_DIR, 'corpus.report.json')

const CHAPTERS = {
  '01-daily-standup': ['每日站会', 'Daily Standup'],
  '02-sprint-planning': ['迭代排期', 'Sprint Planning'],
  '03-refinement': ['需求评审', 'Refinement'],
  '04-test-review': ['测试评审', 'Test Review'],
  '05-demo': ['演示', 'Demo'],
  '06-bug-demo': ['Bug 演示', 'Bug Demo'],
  '07-code-review': ['代码审查', 'Code Review'],
  '08-api-integration': ['API 联调', 'API Integration'],
  '09-phone-calls': ['电话会议', 'Phone Calls'],
  '10-slack-im': ['Slack 消息', 'Slack / IM'],
  '11-with-qa': ['与 QA 沟通', 'With QA'],
  '12-with-pm': ['与 PM 沟通', 'With PM'],
  '13-with-backend': ['与后端沟通', 'With Backend'],
  '14-with-designer': ['与设计师沟通', 'With Designer'],
  '15-user-guidance': ['用户指导', 'User Guidance'],
  '16-task-assignment': ['任务分配', 'Task Assignment'],
  '17-help-colleague': ['帮助同事', 'Help Colleague'],
  '18-debugging': ['调试', 'Debugging'],
  '19-asking-for-help': ['请求帮助', 'Asking for Help'],
  '20-technical-discussion': ['技术讨论', 'Technical Discussion'],
  '21-alignment-discussion': ['对齐会议', 'Alignment Discussion'],
  '22-on-call-incident': ['线上事故', 'On-call Incident'],
}

const CJK_RE = /[㐀-鿿　-〿＀-￯]/
const PUNCT_RE = /[.,!?;:'"“”‘’()[\]{}<>/\\|@#$%^&*_+=~`—–-]/g

// ---------------------------------------------------------------------------
// Small utilities
// ---------------------------------------------------------------------------

function read(file) {
  return fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n')
}

function normalizeSpace(value) {
  return String(value ?? '')
    .replace(/ /g, ' ')
    .replace(/[ \t]+/g, ' ')
    .trim()
}

function normalizeQuotes(value) {
  return String(value ?? '')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/…/g, '...')
    .replace(/ /g, ' ')
}

function normalizeKey(value) {
  return normalizeQuotes(value)
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[“”"'`]/g, '')
    .replace(/[.,!?;:。！？；：、]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function hasCJK(value) {
  return CJK_RE.test(String(value ?? ''))
}

function stripInlineMarkdown(value) {
  return normalizeSpace(
    String(value ?? '')
      .replace(/`([^`]*)`/g, '$1')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'),
  )
}

function slug(value, max = 48) {
  const result = normalizeQuotes(value)
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9一-鿿]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return (result || 'item').slice(0, max)
}

function hash(value) {
  return crypto.createHash('sha1').update(String(value)).digest('hex').slice(0, 10)
}

function uniqueStrings(values) {
  const seen = new Set()
  const result = []
  for (const value of values) {
    const clean = normalizeSpace(value)
    if (!clean) continue
    const key = normalizeKey(clean)
    if (seen.has(key)) continue
    seen.add(key)
    result.push(clean)
  }
  return result
}

function stripTrailingPunctuation(value) {
  return normalizeSpace(value).replace(/[.,;:]+$/g, '')
}

function isStageDirection(value) {
  const text = normalizeSpace(value)
  if (!text) return false
  if (/^\((?:silence|awkward silence|later|next week|phone rings|everyone laughs|laughs|pause|shows? screen|screenshot[^)]*|typing|nodding|sighs|long pause|beat)[^)]*\)$/i.test(text)) {
    return true
  }
  return /^\([^)]*\)$/.test(text) && !/[A-Za-z]{3,}\s+[A-Za-z]{3,}/.test(text.replace(/^\(|\)$/g, ''))
}

function stripStagePrefixes(value) {
  let text = normalizeSpace(value)
  // Remove leading stage directions: "(showing recording) Sorry..." -> "Sorry..."
  let changed = true
  while (changed) {
    changed = false
    const match = text.match(/^\(([^)]{1,80})\)\s*(.+)$/)
    if (match) {
      text = match[2].trim()
      changed = true
    }
  }
  return text
}

function splitTableRow(line) {
  const trimmed = line.trim()
  if (!trimmed.startsWith('|')) return null
  return trimmed
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => stripInlineMarkdown(cell.trim()))
}

function isTableSeparator(cells) {
  return cells.length > 0 && cells.every((cell) => /^:?-{2,}:?$/.test(cell.replace(/\s/g, '')))
}

function* walkFiles(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) yield* walkFiles(full)
    else yield full
  }
}

// ---------------------------------------------------------------------------
// Translation lookup
// ---------------------------------------------------------------------------

const translationsFile = read(DIALOGUE_TRANSLATIONS)
const translations = JSON.parse(translationsFile)
const translationByKey = new Map()
for (const [en, zh] of Object.entries(translations)) {
  translationByKey.set(normalizeKey(en), zh)
}

function levenshtein(a, b) {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i += 1) {
    const row = [i]
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      row[j] = Math.min(row[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost)
    }
    prev = row
  }
  return prev[b.length]
}

function similarity(a, b) {
  const max = Math.max(a.length, b.length)
  if (!max) return 1
  return 1 - levenshtein(a, b) / max
}

function lookupTranslation(text) {
  const candidates = [
    normalizeSpace(text),
    stripInlineMarkdown(text),
    stripStagePrefixes(text),
  ]
  for (const candidate of candidates) {
    const key = normalizeKey(candidate)
    if (translationByKey.has(key)) {
      return { zh: translationByKey.get(key), status: 'official' }
    }
  }
  // Fuzzy fallback for curly quotes / minor editorial differences.
  let best = null
  for (const candidate of candidates) {
    const key = normalizeKey(candidate)
    if (key.length < 8) continue
    for (const [known, zh] of translationByKey) {
      if (Math.abs(known.length - key.length) > 6) continue
      const score = similarity(key, known)
      if (score >= 0.92 && (!best || score > best.score)) {
        best = { zh, score }
      }
    }
  }
  if (best) return { zh: best.zh, status: 'fuzzy' }
  return { zh: null, status: 'missing' }
}

// ---------------------------------------------------------------------------
// Chapter metadata
// ---------------------------------------------------------------------------

const chapterDirs = fs
  .readdirSync(SOURCE_ROOT, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && /^\d{2}-/.test(entry.name))
  .map((entry) => entry.name)
  .sort()

const chapters = chapterDirs.map((id, index) => {
  const [titleZh, titleEn] = CHAPTERS[id] ?? [id, id]
  return { id, order: index + 1, titleZh, titleEn }
})
const chapterById = new Map(chapters.map((chapter) => [chapter.id, chapter]))

// ---------------------------------------------------------------------------
// Dialogue parsing
// ---------------------------------------------------------------------------

const dialogueLinesByChapter = new Map()

function parseDialogue(chapter) {
  const file = path.join(SOURCE_ROOT, chapter.id, '01-dialogue.md')
  if (!fs.existsSync(file)) return { format: 'spoken', lines: [] }
  const rawLines = read(file).split('\n')
  const lines = []
  let format = 'spoken'
  let currentSpeaker = null
  let currentTimestamp = null
  let index = 0

  for (const raw of rawLines) {
    const trimmed = raw.trim()
    if (!trimmed.startsWith('>')) continue
    let text = trimmed.replace(/^>\s?/, '').trim()
    if (!text || text === '---') continue

    const channelMatch = text.match(/^\*\*(#[^*]+)\*\*$/)
    if (channelMatch) {
      format = 'chat'
      currentSpeaker = null
      currentTimestamp = null
      lines.push({
        id: `${chapter.id}:line:${index++}`,
        speaker: 'channel',
        text: channelMatch[1].trim(),
        zh: null,
        isStage: false,
        isChannel: true,
      })
      continue
    }

    const chatSpeaker = text.match(/^\*\*([^*]+)\*\*(?:\s*\[(\d{1,2}:\d{2})\])?(?:\s*\((.*)\))?\s*$/)
    if (chatSpeaker && !chatSpeaker[1].startsWith('#')) {
      format = 'chat'
      currentSpeaker = stripInlineMarkdown(chatSpeaker[1]).trim()
      currentTimestamp = chatSpeaker[2] ?? null
      continue
    }

    const namedSpeaker = text.match(/^([A-Za-z][\w .'’-]{0,24}):\s*(.+)$/)
    if (namedSpeaker) {
      currentSpeaker = namedSpeaker[1].trim()
      text = namedSpeaker[2].trim()
      currentTimestamp = null
    }

    if (format === 'chat' && !currentSpeaker) continue
    const stage = isStageDirection(text)
    const translation = stage ? { zh: null, status: 'n/a' } : lookupTranslation(text)
    lines.push({
      id: `${chapter.id}:line:${index++}`,
      speaker: currentSpeaker ?? '?',
      text: normalizeSpace(text),
      zh: translation.zh,
      translationStatus: translation.status,
      isStage: stage,
      isChannel: false,
      timestamp: format === 'chat' ? currentTimestamp : null,
    })
  }

  return { format, lines }
}

for (const chapter of chapters) {
  const parsed = parseDialogue(chapter)
  dialogueLinesByChapter.set(chapter.id, parsed)
}

// ---------------------------------------------------------------------------
// Expression parsing
// ---------------------------------------------------------------------------

const SECTION_ALSO = /^(also say|还可以说|也可以说)\s*[：:]?$/i
const SECTION_WHEN = /^(when to use|什么时候说|使用场景)\s*[：:]?$/i
const SECTION_RELATED = /^(related conversation|关联对话)\s*[：:]?$/i
const SECTION_MISTAKES = /^(common mistakes|常见错误)\s*[：:]?$/i

function parseExpressionFile(chapter, file) {
  const rawLines = read(file).split('\n')
  const blocks = []
  let current = null
  let section = null

  const pushBlock = () => {
    if (current) blocks.push(current)
  }

  for (let i = 0; i < rawLines.length; i += 1) {
    const raw = rawLines[i]
    const trimmed = raw.trim()
    if (!trimmed) continue

    const quotedHeading = trimmed.match(/^#{2,4}\s+"(.+)"\s*(?:—\s*(.+))?$/)
    if (quotedHeading) {
      pushBlock()
      const trailing = quotedHeading[2] ? normalizeSpace(quotedHeading[2]) : ''
      current = {
        file: path.basename(file),
        titleEn: stripInlineMarkdown(quotedHeading[1]),
        meaningZh: hasCJK(trailing) ? trailing : null,
        alternatives: [],
        pairs: [],
        usageZh: [],
        related: [],
        mistakes: [],
        sections: [],
        refExamples: [],
      }
      section = null
      continue
    }

    if (!current) continue

    const heading = trimmed.match(/^#{2,4}\s+(.+)$/)
    if (heading) {
      const title = stripInlineMarkdown(heading[1]).trim()
      section = { title, kind: 'other' }
      if (SECTION_ALSO.test(title)) section.kind = 'alt'
      else if (SECTION_WHEN.test(title)) section.kind = 'when'
      else if (SECTION_RELATED.test(title)) section.kind = 'related'
      else if (SECTION_MISTAKES.test(title)) section.kind = 'mistakes'
      else section.kind = 'scenario'
      current.sections.push(section)
      continue
    }

    const plainMarker = stripInlineMarkdown(trimmed).replace(/\s+$/, '')
    if (SECTION_ALSO.test(plainMarker)) {
      section = { title: plainMarker, kind: 'alt' }
      current.sections.push(section)
      continue
    }
    if (SECTION_WHEN.test(plainMarker)) {
      section = { title: plainMarker, kind: 'when' }
      current.sections.push(section)
      continue
    }
    if (SECTION_RELATED.test(plainMarker)) {
      section = { title: plainMarker, kind: 'related' }
      current.sections.push(section)
      continue
    }
    if (SECTION_MISTAKES.test(plainMarker)) {
      section = { title: plainMarker, kind: 'mistakes' }
      current.sections.push(section)
      continue
    }

    if (trimmed.startsWith('>')) {
      const quote = trimmed.replace(/^>\s?/, '').trim()
      if (!quote) continue
      const named = quote.match(/^([A-Za-z][\w .'’-]{0,24}):\s*(.+)$/)
      const text = named ? named[2].trim() : quote
      if (!text || isStageDirection(text)) continue
      const translation = lookupTranslation(text)
      current.related.push({ speaker: named ? named[1].trim() : undefined, en: text, zh: translation.zh })
      if (!current.meaningZh && translation.zh && !hasCJK(current.titleEn)) {
        current.meaningZh = translation.zh
      }
      continue
    }

    if (trimmed.startsWith('- ')) {
      const body = trimmed.slice(2).trim()
      if (!body) continue
      if (body.startsWith('❌')) {
        const mistake = body.replace(/^❌\s*/, '')
        current.mistakes.push(mistake)
        continue
      }
      const parts = body.split(' — ')
      const en = stripInlineMarkdown(parts[0])
      const zh = parts.length > 1 ? normalizeSpace(parts.slice(1).join(' — ')) : ''
      if (en && zh && hasCJK(zh)) {
        current.pairs.push({ en, zh })
        if (!current.meaningZh) current.meaningZh = zh
        if (section?.kind === 'alt') current.alternatives.push(en)
        else if (section?.kind === 'scenario') current.refExamples.push({ en, zh, section: section.title })
        continue
      }
      if (section?.kind === 'alt' && en && !hasCJK(en)) {
        current.alternatives.push(en)
        continue
      }
      if (section?.kind === 'when' && hasCJK(body)) {
        current.usageZh.push(body)
        continue
      }
      if (section?.kind === 'scenario' && en && !hasCJK(en)) {
        current.refExamples.push({ en, zh: null, section: section.title })
        continue
      }
      if (!section && en && !hasCJK(en)) {
        current.alternatives.push(en)
      }
      continue
    }

    // A plain Chinese line right after the quoted heading is the meaning.
    if (!current.meaningZh && hasCJK(trimmed) && !trimmed.startsWith('|') && !trimmed.startsWith('!') && !trimmed.startsWith('[')) {
      current.meaningZh = stripInlineMarkdown(trimmed)
    }
  }
  pushBlock()
  return blocks
}

// ---------------------------------------------------------------------------
// Vocab parsing
// ---------------------------------------------------------------------------

function parseVocabFile(chapter, file) {
  const items = []
  for (const raw of read(file).split('\n')) {
    const trimmed = raw.trim()
    if (!trimmed.startsWith('- ')) continue
    const body = trimmed.slice(2).trim()
    const parts = body.split(' — ')
    if (parts.length < 2) continue
    const term = stripInlineMarkdown(parts[0])
    if (!term || hasCJK(term)) continue
    const rest = normalizeSpace(parts.slice(1).join(' — '))
    const exampleIndex = rest.indexOf('。')
    const meaning = (exampleIndex >= 0 ? rest.slice(0, exampleIndex) : rest).trim()
    const exampleRaw = exampleIndex >= 0 ? rest.slice(exampleIndex + 1).trim() : ''
    items.push({
      term,
      meaningZh: meaning || rest,
      exampleRaw: exampleRaw || null,
      chapterId: chapter.id,
    })
  }
  return items
}

// ---------------------------------------------------------------------------
// Pronunciation parsing
// ---------------------------------------------------------------------------

function cleanWord(value) {
  return normalizeSpace(value)
    .replace(/\s*\/[^/]+\/\s*$/, '')
    .replace(/\s*\([^)]*\)\s*$/, '')
    .trim()
}

function parsePronunciationFile(file) {
  const items = []
  const lines = read(file).split('\n')
  for (const line of lines) {
    const cells = splitTableRow(line)
    if (!cells || cells.length < 3 || isTableSeparator(cells)) continue
    if (cells[0] === '单词' || cells[0].toLowerCase() === 'word') continue
    const word = cleanWord(cells[0])
    const wrong = normalizeSpace(cells[1])
    const correct = normalizeSpace(cells[2])
    if (!word || !correct) continue
    if (correct.includes('正确发音') || wrong.includes('常见')) continue
    items.push({ word, wrong, correct })
  }
  return items
}

// ---------------------------------------------------------------------------
// Reference parsing
// ---------------------------------------------------------------------------

function parseHighFrequency() {
  const file = path.join(SOURCE_ROOT, 'reference', 'high-frequency-expressions.md')
  const items = []
  let section = ''
  for (const line of read(file).split('\n')) {
    const heading = line.trim().match(/^##\s+(.+)$/)
    if (heading) {
      section = stripInlineMarkdown(heading[1])
      continue
    }
    const cells = splitTableRow(line)
    if (!cells || cells.length < 2 || isTableSeparator(cells)) continue
    if (cells[0] === '意思' || cells[1] === '日常说法') continue
    const meaningZh = normalizeSpace(cells[0])
    const english = normalizeSpace(cells[1])
    if (!meaningZh || !english) continue
    const answers = uniqueStrings(english.split(/\s+\/\s+|\/|、/).map((part) => part.trim()))
    items.push({ section, meaningZh, answers })
  }
  return items
}

function parseMistakes() {
  const file = path.join(SOURCE_ROOT, 'reference', 'common-mistakes.md')
  const items = []
  let section = ''
  for (const line of read(file).split('\n')) {
    const heading = line.trim().match(/^##\s+(.+)$/)
    if (heading) {
      section = stripInlineMarkdown(heading[1])
      continue
    }
    const cells = splitTableRow(line)
    if (!cells || cells.length < 3 || isTableSeparator(cells)) continue
    if (cells[0] === '❌ 错误' || cells[0] === '单词' || cells[0] === '错误') continue
    const wrong = normalizeSpace(cells[0])
    const correctRaw = normalizeSpace(cells[1])
    const noteZh = normalizeSpace(cells[2])
    if (!wrong || !correctRaw) continue
    // Pronunciation sub-table inside common-mistakes.md
    if (correctRaw.startsWith('/') || wrong.startsWith('/')) continue
    // Rows that say the sentence is already correct
    if (correctRaw === '✅' || correctRaw.includes('✅') || noteZh.includes('这个是对的')) continue
    if (normalizeKey(wrong) === normalizeKey(correctRaw)) continue
    const answers = uniqueStrings(correctRaw.split(/\s+\/\s+|、/).map((part) => part.trim()))
    if (!answers.length) continue
    // Odd row where the "correct" column repeats the wrong phrase
    if (answers.some((answer) => normalizeKey(answer) === normalizeKey(wrong))) continue
    items.push({ wrong, answers, noteZh, section })
  }
  return items
}

function parsePronunciationReference() {
  return parsePronunciationFile(path.join(SOURCE_ROOT, 'reference', 'pronunciation.md'))
}

function parseScenarios() {
  const file = path.join(SOURCE_ROOT, 'reference', 'scenarios-brainstorm.md')
  const items = []
  let chapterId = null
  for (const raw of read(file).split('\n')) {
    const trimmed = raw.trim()
    const chapterHeading = trimmed.match(/^##\s+(\d{2}-[\w-]+)\s+(.+)$/)
    if (chapterHeading) {
      chapterId = chapterHeading[1]
      continue
    }
    const item = trimmed.match(/^-\s+\[[ x]\]\s+(.+)$/)
    if (!item) continue
    const body = item[1].trim()
    const [stemRaw, englishRaw = ''] = body.split(' — ')
    const stemZh = normalizeSpace(stemRaw)
    const quotes = [...englishRaw.matchAll(/"([^"]+)"/g)].map((match) => normalizeSpace(match[1])).filter(Boolean)
    const refAnswer = quotes[0] ?? null
    items.push({
      chapterId,
      promptZh: stemZh,
      referenceAnswer: refAnswer,
      examples: uniqueStrings(quotes),
    })
  }
  return items
}

// ---------------------------------------------------------------------------
// Build content
// ---------------------------------------------------------------------------

const usedIds = new Set()
function makeId(base) {
  let id = base
  let n = 2
  while (usedIds.has(id)) {
    id = `${base}-${n++}`
  }
  usedIds.add(id)
  return id
}

const cards = []
const expressions = []
const vocab = []
const pronunciationMap = new Map()
const mistakes = []
const highFrequency = []
const dialogues = []

function addCard(card) {
  if (!card.promptZh || !card.primaryAnswer) return
  if (hasCJK(card.primaryAnswer)) return
  const id = makeId(card.id)
  const accepted = uniqueStrings([
    card.primaryAnswer,
    ...(card.acceptedAnswers ?? []),
  ]).filter((answer) => normalizeKey(answer) !== normalizeKey(card.promptZh))
  if (!accepted.length) return
  cards.push({
    ...card,
    id,
    primaryAnswer: accepted[0],
    acceptedAnswers: accepted,
    practiceable: card.practiceable !== false,
  })
}

// Dialogues + dialogue cards
for (const chapter of chapters) {
  const parsed = dialogueLinesByChapter.get(chapter.id)
  const previousZh = new Map()
  let lastZh = null
  for (let i = 0; i < parsed.lines.length; i += 1) {
    const line = parsed.lines[i]
    if (line.isStage) continue
    if (line.zh) lastZh = line.zh
    previousZh.set(line.id, lastZh)
  }

  let previousNonStage = null
  for (let i = 0; i < parsed.lines.length; i += 1) {
    const line = parsed.lines[i]
    if (line.isChannel) {
      previousNonStage = null
      continue
    }
    if (line.isStage) continue
    if (line.zh) {
      addCard({
        id: `dlg:${chapter.id}:${i}`,
        kind: 'dialogue',
        chapterId: chapter.id,
        promptZh: line.zh,
        contextZh: previousNonStage?.zh ?? null,
        contextEn: previousNonStage?.text ?? null,
        primaryAnswer: line.text,
        acceptedAnswers: [],
        explanationZh: null,
        source: { file: '01-dialogue.md', line: i + 1, speaker: line.speaker },
        tags: ['dialogue', chapter.id],
        audioText: line.text,
        translationStatus: line.translationStatus ?? 'official',
        practiceable: true,
      })
    }
    previousNonStage = line
  }

  dialogues.push({
    id: `${chapter.id}:dialogue`,
    chapterId: chapter.id,
    format: parsed.format,
    lines: parsed.lines,
  })
}

// Expressions
let skippedUntranslatedExamples = 0
for (const chapter of chapters) {
  const dir = path.join(SOURCE_ROOT, chapter.id)
  const files = fs
    .readdirSync(dir)
    .filter((name) => name.endsWith('.md'))
    .filter((name) => !/^01-dialogue/.test(name))
    .filter((name) => !/vocab/.test(name))
    .filter((name) => !/pronunciation/.test(name))
    .sort()

  for (const fileName of files) {
    const blocks = parseExpressionFile(chapter, path.join(dir, fileName))
    for (const block of blocks) {
      const blockTitle = stripInlineMarkdown(block.titleEn)
      const meaningZh = block.meaningZh ? normalizeSpace(block.meaningZh) : null
      const expression = {
        id: `expr:${chapter.id}:${slug(fileName, 32)}:${slug(blockTitle, 40)}`,
        chapterId: chapter.id,
        file: fileName,
        titleEn: blockTitle,
        meaningZh,
        alternatives: uniqueStrings(block.alternatives),
        usageZh: uniqueStrings(block.usageZh),
        related: block.related,
        mistakes: block.mistakes,
        pairs: block.pairs,
      }
      expressions.push(expression)

      if (meaningZh) {
        addCard({
          id: expression.id,
          kind: 'expression',
          chapterId: chapter.id,
          promptZh: meaningZh,
          contextZh: `${chapter.titleZh} · ${blockTitle}`,
          contextEn: null,
          primaryAnswer: blockTitle,
          acceptedAnswers: block.alternatives,
          explanationZh: block.usageZh.length ? block.usageZh.join('；') : null,
          source: { file: fileName, heading: blockTitle },
          tags: ['expression', chapter.id],
          audioText: blockTitle,
          translationStatus: 'official',
          practiceable: true,
        })
      }

      for (let p = 0; p < block.pairs.length; p += 1) {
        const pair = block.pairs[p]
        addCard({
          id: `${expression.id}:pair:${p}`,
          kind: 'expression',
          chapterId: chapter.id,
          promptZh: pair.zh,
          contextZh: meaningZh ?? `${chapter.titleZh} · ${blockTitle}`,
          contextEn: null,
          primaryAnswer: pair.en,
          acceptedAnswers: [],
          explanationZh: null,
          source: { file: fileName, heading: blockTitle },
          tags: ['expression', 'pair', chapter.id],
          audioText: pair.en,
          translationStatus: 'official',
          practiceable: true,
        })
      }

      for (let e = 0; e < block.refExamples.length; e += 1) {
        const example = block.refExamples[e]
        // Only make a production card when the source gives us a Chinese
        // prompt for this exact English line. Falling back to the parent
        // expression's meaning pairs unrelated sentences and teaches wrong
        // translations (e.g. "自动化测试不稳定" -> "That's what PM asked for").
        if (!example.zh) {
          skippedUntranslatedExamples += 1
          continue
        }
        addCard({
          id: `${expression.id}:example:${e}`,
          kind: 'expression',
          chapterId: chapter.id,
          promptZh: example.zh,
          contextZh: `${chapter.titleZh} · ${example.section}`,
          contextEn: null,
          primaryAnswer: example.en,
          acceptedAnswers: [],
          explanationZh: meaningZh,
          source: { file: fileName, heading: blockTitle },
          tags: ['expression', 'scenario', chapter.id],
          audioText: example.en,
          translationStatus: 'official',
          practiceable: true,
        })
      }
    }
  }
}

// Vocab
for (const chapter of chapters) {
  const dir = path.join(SOURCE_ROOT, chapter.id)
  const files = fs.readdirSync(dir).filter((name) => /vocab/.test(name) && name.endsWith('.md'))
  for (const fileName of files) {
    const items = parseVocabFile(chapter, path.join(dir, fileName))
    for (const item of items) {
      const entry = {
        id: makeId(`vocab-entry:${chapter.id}:${slug(item.term)}`),
        chapterId: chapter.id,
        term: item.term,
        meaningZh: item.meaningZh,
        exampleRaw: item.exampleRaw,
      }
      vocab.push(entry)
      addCard({
        id: `vocab:${chapter.id}:${slug(item.term)}`,
        kind: 'vocab',
        chapterId: chapter.id,
        promptZh: item.meaningZh,
        contextZh: chapter.titleZh,
        contextEn: null,
        primaryAnswer: item.term,
        acceptedAnswers: [],
        explanationZh: item.exampleRaw,
        source: { file: fileName, line: 0 },
        tags: ['vocab', chapter.id],
        audioText: item.term,
        translationStatus: 'official',
        practiceable: true,
      })
    }
  }
}

// Pronunciation (chapter tables + reference, merged by word)
for (const chapter of chapters) {
  const dir = path.join(SOURCE_ROOT, chapter.id)
  const files = fs.readdirSync(dir).filter((name) => /pronunciation/.test(name) && name.endsWith('.md'))
  for (const fileName of files) {
    for (const item of parsePronunciationFile(path.join(dir, fileName))) {
      const key = normalizeKey(item.word)
      if (!pronunciationMap.has(key)) {
        pronunciationMap.set(key, {
          id: makeId(`pron:${slug(item.word)}`),
          word: item.word,
          wrong: item.wrong,
          correct: item.correct,
          chapterIds: [chapter.id],
        })
      } else {
        const existing = pronunciationMap.get(key)
        if (!existing.chapterIds.includes(chapter.id)) existing.chapterIds.push(chapter.id)
      }
    }
  }
}
for (const item of parsePronunciationReference()) {
  const key = normalizeKey(item.word)
  if (!pronunciationMap.has(key)) {
    pronunciationMap.set(key, {
      id: makeId(`pron:${slug(item.word)}`),
      word: item.word,
      wrong: item.wrong,
      correct: item.correct,
      chapterIds: [],
    })
  }
}
const pronunciation = [...pronunciationMap.values()]

// High frequency
const highFrequencyItems = parseHighFrequency()
for (let i = 0; i < highFrequencyItems.length; i += 1) {
  const item = highFrequencyItems[i]
  highFrequency.push({
    id: makeId(`hf-entry:${slug(item.section, 24)}:${slug(item.meaningZh, 24)}`),
    section: item.section,
    meaningZh: item.meaningZh,
    answers: item.answers,
  })
  addCard({
    id: `hf:${slug(item.section, 24)}:${slug(item.meaningZh, 24)}`,
    kind: 'highFrequency',
    chapterId: null,
    promptZh: item.meaningZh,
    contextZh: item.section,
    contextEn: null,
    primaryAnswer: item.answers[0],
    acceptedAnswers: item.answers.slice(1),
    explanationZh: null,
    source: { file: 'reference/high-frequency-expressions.md' },
    tags: ['high-frequency', item.section],
    audioText: item.answers[0],
    translationStatus: 'official',
    practiceable: true,
  })
}

// Mistakes
const mistakeItems = parseMistakes()
for (let i = 0; i < mistakeItems.length; i += 1) {
  const item = mistakeItems[i]
  const entry = {
    id: makeId(`mist-entry:${i}`),
    wrong: item.wrong,
    answers: item.answers,
    noteZh: item.noteZh,
    section: item.section,
  }
  mistakes.push(entry)
  addCard({
    id: `mist:${i}`,
    kind: 'mistake',
    chapterId: null,
    promptZh: `哪句正确？${item.noteZh}`,
    contextZh: item.section,
    contextEn: null,
    primaryAnswer: item.answers[0],
    acceptedAnswers: item.answers.slice(1),
    explanationZh: item.noteZh,
    wrongAnswer: item.wrong,
    source: { file: 'reference/common-mistakes.md' },
    tags: ['mistake', item.section],
    audioText: item.answers[0],
    translationStatus: 'official',
    practiceable: true,
  })
}

// Scenarios + options
const scenarioItems = parseScenarios()
for (let i = 0; i < scenarioItems.length; i += 1) {
  scenarioItems[i].id = makeId(`scn:${slug(scenarioItems[i].promptZh, 40)}:${i}`)
}

const scenarioPool = expressions
  .filter((expression) => expression.meaningZh && expression.titleEn)
  .map((expression) => ({ chapterId: expression.chapterId, answer: expression.titleEn }))

function pickDistractors(correct, chapterId, seed) {
  const pool = scenarioPool.filter(
    (item) =>
      normalizeKey(item.answer) !== normalizeKey(correct) &&
      item.answer.length > 2,
  )
  // Deterministic shuffle
  let state = seed >>> 0
  const random = () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 4294967296
  }
  const scored = pool.map((item) => {
    const sameChapter = item.chapterId === chapterId ? 1 : 0
    const lengthDiff = Math.abs(item.answer.length - correct.length)
    return { ...item, score: sameChapter * 100 + lengthDiff + random() * 20 }
  })
  scored.sort((a, b) => a.score - b.score)
  const picked = []
  let sameChapterCount = 0
  for (const item of scored) {
    if (picked.some((p) => normalizeKey(p.answer) === normalizeKey(item.answer))) continue
    const isSame = item.chapterId === chapterId
    if (isSame && sameChapterCount >= 1) continue
    picked.push(item)
    if (isSame) sameChapterCount += 1
    if (picked.length === 3) break
  }
  return picked.map((p) => p.answer)
}

for (let i = 0; i < scenarioItems.length; i += 1) {
  const scenario = scenarioItems[i]
  if (!scenario.referenceAnswer) continue
  const distractors = pickDistractors(scenario.referenceAnswer, scenario.chapterId, i + 1)
  if (distractors.length < 3) continue
  const options = [
    { en: scenario.referenceAnswer, correct: true },
    ...distractors.map((en) => ({ en, correct: false })),
  ]
  // Deterministic shuffle using the item index.
  let state = (i + 7) >>> 0
  for (let j = options.length - 1; j > 0; j -= 1) {
    state = (state * 1664525 + 1013904223) >>> 0
    const k = state % (j + 1)
    ;[options[j], options[k]] = [options[k], options[j]]
  }
  scenario.options = options
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

const dialogueLines = dialogues.reduce((sum, dialogue) => sum + dialogue.lines.filter((line) => !line.isChannel).length, 0)
const dialogueTranslated = dialogues.reduce(
  (sum, dialogue) => sum + dialogue.lines.filter((line) => line.zh).length,
  0,
)
const dialogueStage = dialogues.reduce(
  (sum, dialogue) => sum + dialogue.lines.filter((line) => line.isStage).length,
  0,
)

const perChapter = chapters.map((chapter) => {
  const chapterDialogue = dialogues.find((dialogue) => dialogue.chapterId === chapter.id)
  const lines = chapterDialogue?.lines.filter((line) => !line.isChannel) ?? []
  const translated = lines.filter((line) => line.zh).length
  return {
    chapterId: chapter.id,
    titleZh: chapter.titleZh,
    dialogueLines: lines.length,
    translated,
    coverage: lines.length ? Math.round((translated / lines.length) * 1000) / 10 : 0,
    cards: cards.filter((card) => card.chapterId === chapter.id).length,
  }
})

const cardsByKind = {}
for (const card of cards) {
  cardsByKind[card.kind] = (cardsByKind[card.kind] ?? 0) + 1
}

const report = {
  generatedAt: new Date().toISOString(),
  chapters: chapters.length,
  dialogueLines,
  dialogueTranslated,
  dialogueStage,
  expressions: expressions.length,
  expressionAlternatives: expressions.reduce((sum, expression) => sum + expression.alternatives.length, 0),
  vocab: vocab.length,
  pronunciation: pronunciation.length,
  highFrequency: highFrequency.length,
  mistakes: mistakes.length,
  scenarios: scenarioItems.length,
  scenariosWithOptions: scenarioItems.filter((scenario) => scenario.options?.length === 4).length,
  cards: cards.length,
  cardsByKind,
  skippedUntranslatedExamples,
  perChapter,
  warnings: skippedUntranslatedExamples
    ? [
        `跳过 ${skippedUntranslatedExamples} 条没有中文翻译的补充例句，避免生成错配卡片。`,
      ]
    : [],
}

const existingContentVersion = fs.existsSync(OUT_CORPUS)
  ? JSON.parse(read(OUT_CORPUS)).contentVersion
  : null

const contentVersion = crypto
  .createHash('sha256')
  .update(fs.readFileSync(DIALOGUE_TRANSLATIONS))
  .update(
    [...walkFiles(SOURCE_ROOT)]
      .sort()
      .map((file) => `${path.relative(REPO_ROOT, file)}:${fs.readFileSync(file)}`)
      .join('\n'),
  )
  .update(String(2))
  .digest('hex')
  .slice(0, 12)

const corpus = {
  version: 1,
  generatedAt: report.generatedAt,
  contentVersion,
  chapters,
  cards,
  dialogues,
  expressions,
  vocab,
  pronunciation,
  highFrequency,
  mistakes,
  scenarios: scenarioItems,
  report,
}

fs.mkdirSync(OUT_DIR, { recursive: true })
fs.writeFileSync(OUT_CORPUS, JSON.stringify(corpus, null, 1), 'utf8')
fs.writeFileSync(OUT_REPORT, JSON.stringify(report, null, 2), 'utf8')

// ---------------------------------------------------------------------------
// Validation gate
// ---------------------------------------------------------------------------

const failures = []
const thresholds = [
  ['chapters', report.chapters, 22],
  ['dialogueLines', report.dialogueLines, 650],
  ['dialogueTranslated', report.dialogueTranslated, 550],
  ['expressions', report.expressions, 200],
  ['vocab', report.vocab, 220],
  ['highFrequency', report.highFrequency, 40],
  ['scenarios', report.scenarios, 350],
  ['cards', report.cards, 900],
]
for (const [name, actual, minimum] of thresholds) {
  if (actual < minimum) failures.push(`${name}: ${actual} < ${minimum}`)
}
if (new Set(cards.map((card) => card.id)).size !== cards.length) {
  failures.push('duplicate card ids')
}
if (cards.some((card) => !card.primaryAnswer || !card.promptZh)) {
  failures.push('empty card prompt or answer')
}

console.log('\nCorpus report')
console.log('─'.repeat(56))
console.log(`chapters              ${report.chapters}`)
console.log(`dialogue lines        ${report.dialogueLines} (translated ${report.dialogueTranslated}, stage ${report.dialogueStage})`)
console.log(`expressions           ${report.expressions} (alternatives ${report.expressionAlternatives})`)
console.log(`vocab                 ${report.vocab}`)
console.log(`pronunciation         ${report.pronunciation}`)
console.log(`high frequency        ${report.highFrequency}`)
console.log(`mistakes              ${report.mistakes}`)
console.log(`scenarios             ${report.scenarios} (MCQ ${report.scenariosWithOptions})`)
console.log(`cards                 ${report.cards}`)
console.log(`  by kind             ${JSON.stringify(cardsByKind)}`)
console.log(`content version       ${contentVersion}`)
if (existingContentVersion && existingContentVersion !== contentVersion) {
  console.log(`content changed       ${existingContentVersion} -> ${contentVersion}`)
}
console.log('\nPer chapter')
for (const row of perChapter) {
  console.log(
    `  ${row.chapterId.padEnd(26)} lines ${String(row.dialogueLines).padStart(3)}  translated ${String(row.translated).padStart(3)} (${String(row.coverage).padStart(5)}%)  cards ${String(row.cards).padStart(4)}`,
  )
}
if (failures.length) {
  console.error('\nContent validation failed:')
  for (const failure of failures) console.error(`  - ${failure}`)
  process.exit(1)
}
console.log('\nWrote', path.relative(REPO_ROOT, OUT_CORPUS))
console.log('Wrote', path.relative(REPO_ROOT, OUT_REPORT))
