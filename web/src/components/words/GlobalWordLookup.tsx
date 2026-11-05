import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { Bookmark, BookmarkCheck, ExternalLink, Volume2, X } from 'lucide-react'
import { lookupPhrase, lookupWord, type DictionaryEntry } from '../../lib/dictionary'
import { favoriteId, useFavoritesStore, type FavoriteColor } from '../../store/useFavoritesStore'
import { speakWord } from '../../lib/speech'

interface HoverCard {
  entry: DictionaryEntry
  matched: string
  x: number
  y: number
}

const SOURCE_LABEL: Record<string, string> = {
  vocab: '词汇表',
  expression: '表达库',
  'high-frequency': '高频表达',
  pronunciation: '发音表',
  story: '剧情词',
  corpus: '语料库',
}

const COLOR_OPTIONS: { value: FavoriteColor; label: string; className: string }[] = [
  { value: 'yellow', label: '重点', className: 'bg-warn' },
  { value: 'green', label: '已掌握', className: 'bg-accent' },
  { value: 'pink', label: '易错', className: 'bg-pink-400' },
]

const TOKEN_RE = /[A-Za-z][A-Za-z'’\-]*/g

export function GlobalWordLookup() {
  const [card, setCard] = useState<HoverCard | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const hideTimer = useRef<number | null>(null)
  const lastMove = useRef(0)
  const lastKey = useRef('')
  const items = useFavoritesStore((state) => state.items)
  const add = useFavoritesStore((state) => state.add)
  const remove = useFavoritesStore((state) => state.remove)
  const favorite = card ? items[favoriteId('word', card.entry.word)] : undefined
  const saved = Boolean(favorite)

  const cancelHide = () => {
    if (hideTimer.current !== null) {
      window.clearTimeout(hideTimer.current)
      hideTimer.current = null
    }
  }

  const scheduleHide = () => {
    cancelHide()
    hideTimer.current = window.setTimeout(() => setCard(null), 240)
  }

  useEffect(() => {
    const onMove = (event: MouseEvent) => {
      if (panelRef.current?.contains(event.target as Node)) return
      const now = performance.now()
      if (now - lastMove.current < 55) return
      lastMove.current = now
      const found = lookupAtPoint(event.clientX, event.clientY)
      if (!found) {
        scheduleHide()
        return
      }
      cancelHide()
      const key = found.entry.word
      if (lastKey.current === key) return
      lastKey.current = key
      setCard({ ...found, x: event.clientX, y: event.clientY })
    }

    const onLeave = () => scheduleHide()
    const onScroll = () => scheduleHide()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setCard(null)
    }
    const onPointerUp = (event: PointerEvent) => {
      if (event.pointerType === 'mouse') return
      if (panelRef.current?.contains(event.target as Node)) return
      const found = lookupAtPoint(event.clientX, event.clientY)
      if (found) setCard({ ...found, x: event.clientX, y: event.clientY })
      else setCard(null)
    }

    document.addEventListener('mousemove', onMove, { passive: true })
    document.addEventListener('mouseleave', onLeave)
    document.addEventListener('scroll', onScroll, { passive: true, capture: true })
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerup', onPointerUp)
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseleave', onLeave)
      document.removeEventListener('scroll', onScroll, true)
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerup', onPointerUp)
      if (hideTimer.current !== null) window.clearTimeout(hideTimer.current)
    }
  })

  const position = useMemo(() => {
    if (!card || typeof window === 'undefined') return { left: 0, top: 0 }
    const width = 320
    const height = 230
    const left = Math.max(10, Math.min(card.x + 16, window.innerWidth - width - 12))
    let top = card.y + 18
    if (top + height > window.innerHeight - 12) top = Math.max(12, card.y - height - 12)
    return { left, top }
  }, [card])

  if (!card) return null

  const save = (color: FavoriteColor = favorite?.color ?? 'yellow') => {
    add({
      id: favoriteId('word', card.entry.word),
      kind: 'word',
      title: card.entry.word,
      zh: card.entry.zh,
      ipa: card.entry.ipa,
      example: card.entry.example,
      source: card.entry.source,
      color,
    })
  }

  return createPortal(
    <div
      ref={panelRef}
      data-no-lookup
      onMouseEnter={cancelHide}
      onMouseLeave={scheduleHide}
      className="fixed z-[100] w-[320px] max-w-[calc(100vw-20px)] rounded-2xl border border-line bg-panel/95 p-3.5 shadow-2xl backdrop-blur-xl"
      style={{ left: position.left, top: position.top }}
    >
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 className="text-lg font-semibold leading-tight text-cream">{card.entry.word}</h3>
            {card.entry.ipa && <span className="font-mono text-[11px] text-accent/80">{card.entry.ipa}</span>}
          </div>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="rounded-full border border-line/70 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.14em] text-muted">
              {SOURCE_LABEL[card.entry.source] ?? card.entry.source}
            </span>
            {card.matched !== card.entry.word && (
              <span className="truncate text-[10px] text-muted">匹配：{card.matched}</span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={() => void speakWord(card.entry.word)}
            className="rounded-full border border-line/70 p-1.5 text-muted transition-colors hover:text-accent"
            aria-label="朗读单词"
          >
            <Volume2 size={14} />
          </button>
          <button
            onClick={() => setCard(null)}
            className="rounded-full border border-line/70 p-1.5 text-muted transition-colors hover:text-cream"
            aria-label="关闭查词"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {card.entry.zh && <p className="mt-2 text-sm leading-6 text-cream/90">{card.entry.zh}</p>}
      {card.entry.example && (
        <p className="mt-1.5 rounded-lg border border-line/60 bg-ink/40 px-2 py-1.5 text-[11px] leading-4 text-muted">
          {card.entry.example}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line/60 pt-2.5">
        <button
          onClick={() => (saved ? remove(favoriteId('word', card.entry.word)) : save())}
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
            saved
              ? 'border-accent/40 bg-accent/10 text-accent'
              : 'border-line text-muted hover:border-accent/40 hover:text-accent'
          }`}
        >
          {saved ? <BookmarkCheck size={12} /> : <Bookmark size={12} />}
          {saved ? '已收藏' : '收藏'}
        </button>
        <div className="flex items-center gap-1.5">
          {COLOR_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => save(option.value)}
              title={option.label}
              aria-label={`标记为${option.label}`}
              className={`h-4 w-4 rounded-full border transition-transform hover:scale-110 ${
                favorite?.color === option.value ? 'border-cream' : 'border-transparent'
              } ${option.className}`}
            />
          ))}
        </div>
        <Link
          to="/words"
          onClick={() => setCard(null)}
          className="ml-auto inline-flex items-center gap-1 text-[10px] text-muted hover:text-accent"
        >
          生词本 <ExternalLink size={10} />
        </Link>
      </div>
    </div>,
    document.body,
  )
}

function lookupAtPoint(x: number, y: number): Omit<HoverCard, 'x' | 'y'> | null {
  const target = document.elementFromPoint(x, y)
  if (!target) return null
  if (target.closest('[data-no-lookup], input, textarea, select, [contenteditable="true"]')) return null
  if (target.closest('svg')) return null

  const range = caretRange(x, y)
  if (!range || range.startContainer.nodeType !== Node.TEXT_NODE) return null
  const node = range.startContainer as Text
  const text = node.textContent ?? ''
  const tokens = [...text.matchAll(TOKEN_RE)].map((match) => ({
    word: match[0],
    start: match.index ?? 0,
    end: (match.index ?? 0) + match[0].length,
  }))
  if (tokens.length === 0) return null

  let offset = range.startOffset
  let index = tokens.findIndex((token) => offset >= token.start && offset <= token.end)
  if (index < 0) {
    offset = Math.max(0, offset - 1)
    index = tokens.findIndex((token) => offset >= token.start && offset <= token.end)
  }
  if (index < 0) return null

  for (let length = Math.min(5, tokens.length); length >= 2; length -= 1) {
    for (let start = Math.max(0, index - length + 1); start <= index; start += 1) {
      const window = tokens.slice(start, start + length)
      if (window.length !== length) continue
      const phrase = lookupPhrase(window.map((token) => token.word))
      if (phrase) return { entry: phrase.entry, matched: phrase.matched }
    }
  }

  const entry = lookupWord(tokens[index].word)
  if (!entry) return null
  return { entry, matched: tokens[index].word }
}

function caretRange(x: number, y: number): Range | null {
  const doc = document as Document & {
    caretRangeFromPoint?: (clientX: number, clientY: number) => Range | null
    caretPositionFromPoint?: (clientX: number, clientY: number) => { offsetNode: Node; offset: number } | null
  }
  if (typeof doc.caretRangeFromPoint === 'function') return doc.caretRangeFromPoint(x, y)
  if (typeof doc.caretPositionFromPoint === 'function') {
    const position = doc.caretPositionFromPoint(x, y)
    if (!position) return null
    const range = document.createRange()
    range.setStart(position.offsetNode, position.offset)
    range.collapse(true)
    return range
  }
  return null
}
