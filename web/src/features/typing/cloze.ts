import { normalizeAnswer } from '../../lib/textMatch'

/**
 * 打字/填字模块的纯逻辑层。
 *
 * 这一层不依赖 React、不读写存储，只负责：
 * - 把英文句子切成「可展示的 token」；
 * - 选出适合挖空的关键词；
 * - 校验用户填写的单词；
 * - 给出渐进提示。
 *
 * 页面只负责渲染和会话状态。以后要换 UI、加「整句默写」或「词组填空」，
 * 都应该先扩展这里的纯函数和测试，而不是把规则写进组件。
 */

export interface ClozeBlank {
  /** 在原句 token 数组里的位置。 */
  tokenIndex: number
  /** 去掉首尾标点后的答案，用于校验与提示。 */
  answer: string
  /** 原句里的完整 token（含标点），用于展示。 */
  display: string
  prefix: string
  suffix: string
  /** 单词长度，用于展示空格宽度。 */
  length: number
}

export interface ClozeToken {
  /** 原句 token（含标点）。 */
  text: string
  core: string | null
  prefix: string
  suffix: string
  /** 若该 token 被挖空，这里是它在 blanks 里的下标。 */
  blankIndex: number | null
}

export interface ClozePrompt {
  answer: string
  tokens: ClozeToken[]
  blanks: ClozeBlank[]
}

export interface ClozeOptions {
  /** 同一个 seed 得到同样的挖空结果，便于测试和复盘。 */
  seed?: number
  /** 最多挖几个空，默认按句子长度 1–3 个。 */
  maxBlanks?: number
  /** 候选词最短长度，默认 3。 */
  minWordLength?: number
}

export interface ClozeCheck {
  correct: boolean
  /** 每个空是否填对。 */
  perBlank: boolean[]
  /** 第一个填错的下标；全对时为 -1。 */
  firstWrong: number
}

const STOP_WORDS = new Set(
  [
    'a', 'an', 'the', 'and', 'or', 'but', 'if', 'then', 'so', 'to', 'of', 'in', 'on', 'at', 'for',
    'from', 'with', 'without', 'by', 'as', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'am',
    'do', 'does', 'did', 'have', 'has', 'had', 'will', 'would', 'can', 'could', 'should', 'shall',
    'may', 'might', 'must', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us',
    'them', 'my', 'your', 'his', 'its', 'our', 'their', 'this', 'that', 'these', 'those', 'there',
    'here', 'not', 'no', 'yes', 'just', 'really', 'very', 'about', 'into', 'over', 'under', 'after',
    'before', 'up', 'down', 'out', 'off', 'again', 'more', 'most', 'some', 'any', 'all', 'let',
    'lets', 'im', 'ive', 'ill', 'id', 'youre', 'youve', 'youll', 'were', 'weve', 'well', 'theyre',
    'theyve', 'theyll', 'thats', 'whats', 'dont', 'doesnt', 'didnt', 'cant', 'couldnt', 'wont',
    'wouldnt', 'shouldnt', 'isnt', 'arent', 'wasnt', 'werent', 'havent', 'hasnt', 'hadnt',
  ],
)

const TOKEN_PATTERN = /^([^A-Za-z0-9]*)([A-Za-z0-9][A-Za-z0-9'’-]*)([^A-Za-z0-9]*)$/

/** FNV-1a，足够稳定，不依赖运行环境。 */
export function hashString(value: string): number {
  let hash = 2166136261
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

/** 小范围可复现随机数，只用于同分词的稳定打散。 */
function seededRandom(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

/** 把 "standup." 拆成 prefix="", core="standup", suffix="." */
export function splitSurfaceToken(text: string): { prefix: string; core: string; suffix: string } | null {
  const match = text.match(TOKEN_PATTERN)
  if (!match) return null
  return { prefix: match[1], core: match[2], suffix: match[3] }
}

/** 单词级归一化：小写、统一弯引号、去掉首尾标点，但保留词内撇号和连字符。 */
export function normalizeWord(value: string): string {
  return String(value ?? '')
    .normalize('NFKC')
    .replace(/[‘’]/g, "'")
    .toLowerCase()
    .replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, '')
}

/**
 * 比较用户输入和空里的答案。
 * - 忽略大小写、首尾标点；
 * - 撇号可省略（dont = don't）；
 * - 也接受缩写展开（do not = don't）。
 */
export function wordsMatch(input: string, answer: string): boolean {
  const left = normalizeWord(input).replace(/'/g, '')
  const right = normalizeWord(answer).replace(/'/g, '')
  if (!left) return false
  if (left === right) return true
  return normalizeAnswer(input) === normalizeAnswer(answer)
}

/** 渐进提示：0 = 全遮，1 = 首字母，2 = 前两个字母…… */
export function maskWord(word: string, revealed = 0): string {
  const safeReveal = Math.max(0, Math.floor(revealed))
  return [...word]
    .map((char, index) => (index < safeReveal || char === "'" || char === '-' ? char : '•'))
    .join('')
}

function isEligible(core: string, minWordLength: number): boolean {
  const key = normalizeWord(core).replace(/'/g, '')
  if (key.length < minWordLength) return false
  if (STOP_WORDS.has(key)) return false
  if (/^\d+$/.test(key)) return false
  return true
}

function wordScore(core: string, position: number, total: number): number {
  const letters = core.replace(/[^A-Za-z0-9]/g, '').length
  let score = letters
  // 句首词通常可以从上下文猜出来，优先挖句中的实词。
  if (position === 0 && total > 2) score -= 1.5
  if (position === total - 1) score += 0.4
  return score
}

function desiredBlankCount(wordCount: number, maxBlanks: number): number {
  const base = wordCount <= 4 ? 1 : wordCount <= 9 ? 2 : 3
  return Math.max(1, Math.min(maxBlanks, base))
}

/**
 * 从英文答案里生成挖空题。
 *
 * 选择规则：
 * 1. 优先实词（去停用词、长度 ≥ 3）；
 * 2. 越长的词分数越高，句首词略微降权；
 * 3. 同分时用 seed 打散，保证同一个 seed 结果稳定；
 * 4. 如果整句都是停用词，退化到挖最长的词，绝不生成「没有空」的题。
 */
export function buildCloze(answer: string, options: ClozeOptions = {}): ClozePrompt {
  const { seed = 1, maxBlanks = 3, minWordLength = 3 } = options
  const surface = String(answer ?? '').trim().split(/\s+/).filter(Boolean)
  const tokens: ClozeToken[] = surface.map((text) => {
    const split = splitSurfaceToken(text)
    return {
      text,
      core: split?.core ?? null,
      prefix: split?.prefix ?? '',
      suffix: split?.suffix ?? '',
      blankIndex: null,
    }
  })

  const candidates = tokens
    .map((token, index) => ({ token, index }))
    .filter((item) => item.token.core && isEligible(item.token.core, minWordLength))

  const random = seededRandom(seed)
  const ranked = candidates
    .map((item) => ({
      ...item,
      score: wordScore(item.token.core!, item.index, tokens.length) + random() * 0.5,
    }))
    .sort((a, b) => b.score - a.score)

  let selected = ranked.slice(0, desiredBlankCount(tokens.length, maxBlanks))

  if (!selected.length) {
    const fallback = tokens
      .map((token, index) => ({ token, index }))
      .filter((item) => item.token.core)
      .sort((a, b) => (b.token.core!.length - a.token.core!.length) || a.index - b.index)
      .slice(0, 1)
    selected = fallback.map((item) => ({ ...item, score: 0 }))
  }

  selected.sort((a, b) => a.index - b.index)

  const blanks: ClozeBlank[] = selected.map((item) => ({
    tokenIndex: item.index,
    answer: item.token.core!,
    display: item.token.text,
    prefix: item.token.prefix,
    suffix: item.token.suffix,
    length: item.token.core!.length,
  }))

  blanks.forEach((blank, blankIndex) => {
    tokens[blank.tokenIndex].blankIndex = blankIndex
  })

  return { answer: String(answer ?? ''), tokens, blanks }
}

/** 校验所有空。 */
export function checkCloze(prompt: ClozePrompt, values: string[]): ClozeCheck {
  const perBlank = prompt.blanks.map((blank, index) => wordsMatch(values[index] ?? '', blank.answer))
  const firstWrong = perBlank.findIndex((value) => !value)
  return { correct: perBlank.length > 0 && firstWrong === -1, perBlank, firstWrong }
}

export type TypingGradeSuggestion = 1 | 2 | 3 | 4

/**
 * 根据「有没有看答案、试了几次、用没用提示、花了多久」给出 FSRS 评分建议。
 * 最终评分仍由用户按 1–4 决定。
 */
export function suggestTypingGrade(input: {
  revealed: boolean
  attempts: number
  hintsUsed: number
  elapsedMs: number
}): TypingGradeSuggestion {
  if (input.revealed) return 1
  if (input.attempts > 0 || input.hintsUsed > 0) return 2
  if (input.elapsedMs > 0 && input.elapsedMs <= 6000) return 4
  return 3
}
