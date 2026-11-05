import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { Bookmark, BookmarkCheck, ExternalLink, Volume2, X } from 'lucide-react'
import { lookupPhrase, lookupWord, type DictionaryEntry } from '../../lib/dictionary'
import { favoriteId, useFavoritesStore, type FavoriteColor } from '../../store/useFavoritesStore'
import { speakWord } from '../../lib/speech'

interface LookupHit {
  entry: DictionaryEntry
  matched: string
  /** 命中单词在视口中的矩形，用于画 tag 式高亮。 */
  rects: DOMRect[]
  /** 同一个词在不同位置时也要能更新高亮。 */
  key: string
}

interface HoverCard extends LookupHit {
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

const TOKEN_RE = /[A-Za-z][A-Za-z'’-]*/g

/** 停在一个词上多久才出卡片：避免鼠标扫过页面时到处弹。 */
const HOVER_DELAY = 280
const HIDE_DELAY = 220

export function GlobalWordLookup() {
  const [card, setCard] = useState<HoverCard | null>(null)
  const [pinned, setPinned] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const hideTimer = useRef<number | null>(null)
  const hoverTimer = useRef<number | null>(null)
  const pendingKey = useRef('')
  const shownKey = useRef('')
  const pinnedRef = useRef(false)
  const lastMove = useRef(0)
  const lastPointerDown = useRef(0)
  const items = useFavoritesStore((state) => state.items)
  const add = useFavoritesStore((state) => state.add)
  const remove = useFavoritesStore((state) => state.remove)
  const favorite = card ? items[favoriteId('word', card.entry.word)] : undefined
  const saved = Boolean(favorite)

  const cancelHide = useCallback(() => {
    if (hideTimer.current !== null) {
      window.clearTimeout(hideTimer.current)
      hideTimer.current = null
    }
  }, [])

  const clearHoverTimer = useCallback(() => {
    if (hoverTimer.current !== null) {
      window.clearTimeout(hoverTimer.current)
      hoverTimer.current = null
    }
    pendingKey.current = ''
  }, [])

  const close = useCallback(() => {
    clearHoverTimer()
    cancelHide()
    pinnedRef.current = false
    shownKey.current = ''
    setPinned(false)
    setCard(null)
  }, [cancelHide, clearHoverTimer])

  const scheduleHide = useCallback(() => {
    if (pinnedRef.current) return
    clearHoverTimer()
    cancelHide()
    hideTimer.current = window.setTimeout(() => {
      shownKey.current = ''
      setCard(null)
    }, HIDE_DELAY)
  }, [cancelHide, clearHoverTimer])

  const showCard = useCallback(
    (hit: LookupHit, x: number, y: number, pin: boolean) => {
      clearHoverTimer()
      cancelHide()
      shownKey.current = hit.key
      pinnedRef.current = pin
      setPinned(pin)
      setCard({ ...hit, x, y })
    },
    [cancelHide, clearHoverTimer],
  )

  useEffect(() => {
    const onMove = (event: MouseEvent) => {
      if (panelRef.current?.contains(event.target as Node)) {
        cancelHide()
        return
      }
      if (lookupBlocked(event.target)) {
        scheduleHide()
        return
      }

      const now = performance.now()
      // 刚点过按钮/链接时不要因为鼠标停在同一位置而弹卡片。
      if (now - lastPointerDown.current < 400) return
      if (now - lastMove.current < 40) return
      lastMove.current = now

      const found = lookupAtPoint(event.clientX, event.clientY)
      if (!found) {
        scheduleHide()
        return
      }

      cancelHide()
      if (shownKey.current === found.key) {
        clearHoverTimer()
        return
      }
      if (pendingKey.current === found.key) return

      clearHoverTimer()
      pendingKey.current = found.key
      hoverTimer.current = window.setTimeout(() => {
        // 鼠标停住后才弹卡片；期间移到别的词会重新计时。
        showCard(found, event.clientX, event.clientY, pinnedRef.current)
      }, HOVER_DELAY)
    }

    const onLeave = () => scheduleHide()
    // 滚动/缩放后高亮位置会失效，直接收起，避免 tag 停在错误的位置。
    const onScroll = (event: Event) => {
      if (panelRef.current?.contains(event.target as Node)) return
      close()
    }
    const onResize = () => close()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }

    const onDoubleClick = (event: MouseEvent) => {
      if (panelRef.current?.contains(event.target as Node)) return
      if (lookupBlocked(event.target) || isClickTarget(event.target)) return
      const found = lookupAtPoint(event.clientX, event.clientY)
      if (!found) return
      // 双击是明确意图：固定卡片，同时去掉浏览器默认的蓝色选中。
      event.preventDefault()
      window.getSelection()?.removeAllRanges()
      showCard(found, event.clientX, event.clientY, true)
    }

    const onPointerUp = (event: PointerEvent) => {
      if (event.pointerType === 'mouse') return
      if (panelRef.current?.contains(event.target as Node)) return
      if (lookupBlocked(event.target) || isClickTarget(event.target)) {
        close()
        return
      }
      const found = lookupAtPoint(event.clientX, event.clientY)
      if (found) showCard(found, event.clientX, event.clientY, false)
      else close()
    }

    const onPointerDown = (event: PointerEvent) => {
      if (panelRef.current?.contains(event.target as Node)) return
      lastPointerDown.current = performance.now()
      clearHoverTimer()
    }

    document.addEventListener('mousemove', onMove, { passive: true })
    document.addEventListener('pointerdown', onPointerDown, { capture: true })
    document.addEventListener('mouseleave', onLeave)
    document.addEventListener('scroll', onScroll, { passive: true, capture: true })
    document.addEventListener('keydown', onKey)
    document.addEventListener('dblclick', onDoubleClick)
    document.addEventListener('pointerup', onPointerUp)
    window.addEventListener('resize', onResize)
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('pointerdown', onPointerDown, true)
      document.removeEventListener('mouseleave', onLeave)
      document.removeEventListener('scroll', onScroll, true)
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('dblclick', onDoubleClick)
      document.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('resize', onResize)
      if (hideTimer.current !== null) window.clearTimeout(hideTimer.current)
      if (hoverTimer.current !== null) window.clearTimeout(hoverTimer.current)
    }
  }, [cancelHide, clearHoverTimer, close, scheduleHide, showCard])

  const position = useMemo(() => {
    if (!card || typeof window === 'undefined') return { left: 0, top: 0 }
    const width = 340
    const height = 260
    const anchor = card.rects[0]
    const anchorX = anchor ? anchor.left + anchor.width / 2 : card.x
    const anchorY = anchor ? anchor.bottom : card.y
    const left = Math.max(10, Math.min(anchorX - width / 2, window.innerWidth - width - 12))
    let top = anchorY + 10
    if (top + height > window.innerHeight - 12) {
      top = Math.max(12, (anchor?.top ?? card.y) - height - 10)
    }
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
    <>
      {card.rects.map((rect, index) => (
        <span
          key={`${rect.left}-${rect.top}-${index}`}
          aria-hidden="true"
          data-no-lookup
          className="pointer-events-none fixed z-[95] rounded-md border border-accent/50 bg-accent/20 shadow-[0_0_0_2px_rgba(52,211,153,0.08)]"
          style={{
            left: rect.left - 2,
            top: rect.top - 1,
            width: rect.width + 4,
            height: rect.height + 2,
          }}
        />
      ))}
      <div
        ref={panelRef}
        data-no-lookup
        onMouseEnter={cancelHide}
        onMouseLeave={scheduleHide}
        className="fixed z-[100] max-h-[70vh] w-[340px] max-w-[calc(100vw-20px)] overflow-y-auto rounded-2xl border border-line bg-panel/95 p-3.5 shadow-2xl backdrop-blur-xl"
        style={{ left: position.left, top: position.top }}
      >
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <h3 className="inline-flex max-w-full break-words rounded-lg border border-accent/30 bg-accent/10 px-2 py-0.5 text-lg font-semibold leading-tight text-cream">
                {card.entry.word}
              </h3>
              {card.entry.ipa && (
                <span className="rounded-md border border-line/60 bg-ink/40 px-1.5 py-0.5 font-mono text-xs text-accent/80">
                  {card.entry.ipa}
                </span>
              )}
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <span className="rounded-full border border-line/70 px-1.5 py-0.5 text-2xs uppercase tracking-[0.14em] text-muted">
                {SOURCE_LABEL[card.entry.source] ?? card.entry.source}
              </span>
              {pinned && (
                <span className="rounded-full border border-accent/40 bg-accent/10 px-1.5 py-0.5 text-2xs text-accent">
                  已固定
                </span>
              )}
              {card.matched !== card.entry.word && (
                <span className="truncate text-2xs text-muted">匹配：{card.matched}</span>
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
              onClick={close}
              className="rounded-full border border-line/70 p-1.5 text-muted transition-colors hover:text-cream"
              aria-label="关闭查词"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {card.entry.zh && <p className="mt-2.5 text-sm leading-6 text-cream/90">{card.entry.zh}</p>}
        {card.entry.example && (
          <p className="mt-1.5 rounded-lg border border-line/60 bg-ink/40 px-2 py-1.5 text-xs leading-5 text-muted">
            {card.entry.example}
          </p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line/60 pt-2.5">
          <button
            onClick={() => (saved ? remove(favoriteId('word', card.entry.word)) : save())}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors ${
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
            onClick={close}
            className="ml-auto inline-flex items-center gap-1 text-2xs text-muted hover:text-accent"
          >
            生词本 <ExternalLink size={10} />
          </Link>
        </div>
        <p className="mt-2 text-2xs text-muted/80">悬停 0.3 秒查词 · 双击固定 · Esc 关闭</p>
      </div>
    </>,
    document.body,
  )
}

function lookupBlocked(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return true
  return Boolean(
    target.closest(
      'input, textarea, select, label, [contenteditable="true"], [data-no-lookup], svg',
    ),
  )
}

/** 双击/点按会触发原本的点击行为时，不去抢它的交互。 */
function isClickTarget(target: EventTarget | null): boolean {
  return (
    target instanceof Element &&
    Boolean(target.closest('a[href], button, [role="button"], label'))
  )
}

function lookupAtPoint(x: number, y: number): LookupHit | null {
  const target = document.elementFromPoint(x, y)
  if (!target || lookupBlocked(target)) return null

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
      if (phrase) {
        const first = window[0]
        const last = window[window.length - 1]
        // 短语命中时仍只高亮鼠标下的那个单词，避免一大块绿色盖住整句。
        return makeHit(phrase.entry, phrase.matched, node, first.start, last.end, tokens[index].start, tokens[index].end)
      }
    }
  }

  const entry = lookupWord(tokens[index].word)
  if (!entry) return null
  const token = tokens[index]
  return makeHit(entry, token.word, node, token.start, token.end)
}

function makeHit(
  entry: DictionaryEntry,
  matched: string,
  node: Text,
  start: number,
  end: number,
  highlightStart = start,
  highlightEnd = end,
): LookupHit | null {
  const range = document.createRange()
  range.setStart(node, start)
  range.setEnd(node, end)
  const rects = Array.from(range.getClientRects()).filter(
    (rect) => rect.width > 1 && rect.height > 1,
  )
  if (!rects.length) return null

  const highlightRange = document.createRange()
  highlightRange.setStart(node, highlightStart)
  highlightRange.setEnd(node, highlightEnd)
  const highlightRects = Array.from(highlightRange.getClientRects()).filter(
    (rect) => rect.width > 1 && rect.height > 1,
  )
  const first = highlightRects[0] ?? rects[0]
  return {
    entry,
    matched,
    rects: highlightRects.length ? highlightRects : rects,
    key: `${entry.word}|${matched}|${Math.round(first.left)}:${Math.round(first.top)}`,
  }
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
