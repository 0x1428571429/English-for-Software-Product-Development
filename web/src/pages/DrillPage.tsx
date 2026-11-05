import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  ChevronRight,
  Mic,
  MicOff,
  RotateCcw,
  SkipForward,
  Sparkles,
  Volume2,
} from 'lucide-react'
import { useCorpus } from '../data/CorpusContext'
import type { Card } from '../data/types'
import { useProgressStore } from '../store/useProgressStore'
import { useSettingsStore } from '../store/useSettingsStore'
import { buildQueue } from '../lib/session'
import { GRADES, isNew, type GradeValue } from '../lib/srs'
import { formatMs, matchAnswer, type MatchResult } from '../lib/textMatch'
import { asrSupported, speak, startRecognition } from '../lib/speech'
import { median, percent, todayStat } from '../lib/stats'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { ProgressRing } from '../components/ui/ProgressRing'

interface ResultRow {
  cardId: string
  rating: GradeValue
  responseMs: number
  correct: boolean
  promptZh: string
  answer: string
  newCard: boolean
}

export function DrillPage() {
  const { corpus, index, loading } = useCorpus()
  const [params] = useSearchParams()
  const chapterId = params.get('chapter')
  const focus = params.get('focus') === '1'
  const settings = useSettingsStore()
  const progress = useProgressStore((state) => state.cards)
  const daily = useProgressStore((state) => state.daily)
  const recordReview = useProgressStore((state) => state.recordReview)
  const finishSession = useProgressStore((state) => state.finishSession)

  const [queue, setQueue] = useState<Card[]>([])
  const [cardIndex, setCardIndex] = useState(0)
  const [phase, setPhase] = useState<'setup' | 'prompt' | 'revealed' | 'summary'>('setup')
  const [input, setInput] = useState('')
  const [responseMs, setResponseMs] = useState(0)
  const [timedOut, setTimedOut] = useState(false)
  const [match, setMatch] = useState<MatchResult | null>(null)
  const [results, setResults] = useState<ResultRow[]>([])
  const [, setTick] = useState(0)
  const [message, setMessage] = useState<string | null>(null)
  const [listening, setListening] = useState(false)
  const [asrTranscript, setAsrTranscript] = useState('')

  const shownAtRef = useRef(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<{ stop: () => void; abort: () => void } | null>(null)
  const autoStartedRef = useRef(false)
  const current = queue[cardIndex]
  const currentIsNew = current ? isNew(progress[current.id]?.fsrs) : false
  const today = todayStat(daily)

  const startSession = useCallback(
    (mode: 'due' | 'new' | 'weak' | 'all' = 'due') => {
      if (!index) return
      const cards = index.allCards.filter((card) => !chapterId || card.chapterId === chapterId)
      const nextQueue = buildQueue({
        cards,
        progress,
        dailyNewCards: today.newCards,
        newCardsPerDay: settings.newCardsPerDay,
        sessionSize: settings.sessionSize,
        chapterId,
        mode,
      })
      if (!nextQueue.length) {
        setMessage('这个范围暂时没有卡片。试试切换章节、降低每日新卡上限，或先做一次「全部练习」。')
        setPhase('setup')
        return
      }
      setQueue(nextQueue)
      setCardIndex(0)
      setResults([])
      setInput('')
      setMatch(null)
      setTimedOut(false)
      setResponseMs(0)
      setMessage(null)
      shownAtRef.current = performance.now()
      setPhase('prompt')
    },
    [chapterId, index, progress, settings.newCardsPerDay, settings.sessionSize, today.newCards],
  )

  useEffect(() => {
    if (focus && !autoStartedRef.current && index && phase === 'setup') {
      autoStartedRef.current = true
      startSession('due')
    }
  }, [focus, index, phase, startSession])

  useEffect(() => {
    if (phase !== 'prompt') return
    const timer = window.setInterval(() => setTick((value) => value + 1), 100)
    return () => window.clearInterval(timer)
  }, [phase, cardIndex])

  useEffect(() => {
    if (phase !== 'prompt' || settings.timerSec <= 0) return
    const timeout = window.setTimeout(() => reveal(true), settings.timerSec * 1000)
    return () => window.clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, cardIndex, settings.timerSec])

  useEffect(() => {
    if (phase === 'prompt') {
      window.setTimeout(() => inputRef.current?.focus(), 30)
    }
  }, [phase, cardIndex])

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort()
    }
  }, [])

  const elapsed = phase === 'prompt' && shownAtRef.current ? performance.now() - shownAtRef.current : responseMs
  const remaining = settings.timerSec > 0 ? Math.max(0, settings.timerSec * 1000 - elapsed) : null

  const reveal = useCallback(
    (auto = false) => {
      if (!current || phase !== 'prompt') return
      const measured = performance.now() - shownAtRef.current
      setResponseMs(measured)
      setTimedOut(auto)
      setMatch(input.trim() ? matchAnswer(input, [current.primaryAnswer, ...current.acceptedAnswers]) : null)
      setPhase('revealed')
      if (settings.autoPlay) {
        void speak(current.primaryAnswer, { rate: settings.ttsRate, voiceURI: settings.ttsVoiceURI })
      }
    },
    [current, input, phase, settings.autoPlay, settings.ttsRate, settings.ttsVoiceURI],
  )

  const advance = useCallback(() => {
    setInput('')
    setMatch(null)
    setTimedOut(false)
    setResponseMs(0)
    setAsrTranscript('')
    if (cardIndex + 1 >= queue.length) {
      setPhase('summary')
      return
    }
    setCardIndex((value) => value + 1)
    shownAtRef.current = performance.now()
    setPhase('prompt')
  }, [index, queue.length])

  const grade = (rating: GradeValue) => {
    if (!current) return
    const isNewCard = isNew(progress[current.id]?.fsrs)
    recordReview({
      cardId: current.id,
      rating,
      responseMs: responseMs || performance.now() - shownAtRef.current,
      mode: 'reflection',
    })
    setResults((rows) => [
      ...rows,
      {
        cardId: current.id,
        rating,
        responseMs,
        correct: rating >= 3,
        promptZh: current.promptZh,
        answer: current.primaryAnswer,
        newCard: isNewCard,
      },
    ])
    if (rating === 1 && queue.length < settings.sessionSize + 4) {
      setQueue((items) => [...items, current])
    }
    advance()
  }

  const skip = () => {
    if (!current) return
    setResults((rows) => [
      ...rows,
      {
        cardId: current.id,
        rating: 1,
        responseMs: 0,
        correct: false,
        promptZh: current.promptZh,
        answer: current.primaryAnswer,
        newCard: currentIsNew,
      },
    ])
    advance()
  }

  const finishNow = () => {
    if (results.length) {
      finishSession({
        mode: 'reflection',
        cards: results.length,
        correct: results.filter((row) => row.correct).length,
        medianMs: Math.round(median(results.map((row) => row.responseMs).filter(Boolean))),
        newCards: results.filter((row) => row.newCard).length,
        grades: results.map((row) => row.rating),
      })
    }
    setPhase('summary')
  }

  const replay = () => {
    if (current) void speak(current.primaryAnswer, { rate: settings.ttsRate, voiceURI: settings.ttsVoiceURI })
  }

  const startAsr = () => {
    if (!asrSupported()) {
      setMessage('当前浏览器不支持语音识别，已切换为键盘输入。')
      return
    }
    setListening(true)
    setAsrTranscript('')
    const controller = startRecognition({
      lang: 'en-US',
      onInterim: (text) => setAsrTranscript(text),
      onResult: (result) => {
        setAsrTranscript(result.transcript)
        setInput(result.transcript)
        setListening(false)
        window.setTimeout(() => reveal(false), 250)
      },
      onError: (error) => {
        setListening(false)
        setMessage(
          error === 'not-allowed'
            ? '麦克风权限被拒绝，已切换为键盘输入。'
            : `语音识别不可用（${error}），已切换为键盘输入。`,
        )
      },
      onEnd: () => setListening(false),
    })
    if (!controller) {
      setListening(false)
      setMessage('语音识别启动失败，已切换为键盘输入。')
    } else {
      recognitionRef.current = controller
    }
  }

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (phase === 'revealed') {
        if (event.key === '1' || event.key === '2' || event.key === '3' || event.key === '4') {
          event.preventDefault()
          grade(Number(event.key) as GradeValue)
        } else if (event.key.toLowerCase() === 'r') {
          event.preventDefault()
          replay()
        } else if (event.key === 'Enter') {
          event.preventDefault()
          advance()
        }
        return
      }
      if (phase !== 'prompt') return
      const target = event.target as HTMLElement | null
      const editing = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA'
      if (event.key === 'Enter' && !event.isComposing) {
        event.preventDefault()
        reveal(false)
      } else if (event.key === ' ' && !editing) {
        event.preventDefault()
        reveal(false)
      } else if (event.key.toLowerCase() === 'r') {
        event.preventDefault()
        replay()
      } else if (event.key === 'Escape') {
        event.preventDefault()
        finishNow()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, index, results, responseMs, input])

  if (loading || !corpus || !index) {
    return <div className="py-24 text-center text-muted">正在加载语料…</div>
  }

  if (phase === 'setup') {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted hover:text-cream">
          <ArrowLeft size={16} /> 返回今日
        </Link>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted">Reflex Drill</p>
          <h1 className="mt-1 text-3xl font-semibold">限时反射训练</h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            看到中文先开口说英文，再按空格揭示。默认 {settings.timerSec || '不限'} 秒，超时会自动揭示。
          </p>
        </div>

        <div className="card-surface space-y-4 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="accent">{index.allCards.length} 张可用卡</Badge>
            {chapterId && <Badge>{index.chapterById.get(chapterId)?.titleZh ?? chapterId}</Badge>}
            <Badge tone="warn">{today.reviews} 张今日已练</Badge>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Button variant="primary" size="lg" onClick={() => startSession('due')}>
              开始（到期优先）
            </Button>
            <Button variant="secondary" size="lg" onClick={() => startSession('new')}>
              只练新卡
            </Button>
            <Button variant="secondary" size="lg" onClick={() => startSession('all')}>
              随机混练
            </Button>
          </div>
          {message && <p className="text-sm text-warn">{message}</p>}
          <div className="grid gap-2 text-xs text-muted sm:grid-cols-2">
            <p>· 每天最多引入 {settings.newCardsPerDay} 张新卡</p>
            <p>· 每组 {settings.sessionSize} 张，可随时结束</p>
            <p>· Enter 揭示 · 1-4 评分 · R 重播 · Esc 结束</p>
            <p>· 语音输入：{settings.asrEnabled ? '已开启' : '可在设置中开启'}</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Link to="/typing" className="card-surface p-4 hover:border-accent/40">
            <p className="text-sm font-medium text-cream">想练拼写？</p>
            <p className="mt-1 text-xs text-muted">填字或整句默写，打字的过程帮助记忆。</p>
          </Link>
          <Link to="/scenario" className="card-surface p-4 hover:border-accent/40">
            <p className="text-sm font-medium text-cream">想先看场景？</p>
            <p className="mt-1 text-xs text-muted">场景模式给你中文工作情境，选最自然的一句。</p>
          </Link>
          <Link to="/library" className="card-surface p-4 hover:border-accent/40">
            <p className="text-sm font-medium text-cream">想先看语料？</p>
            <p className="mt-1 text-xs text-muted">按章节浏览对话、表达、词汇和发音。</p>
          </Link>
        </div>
      </div>
    )
  }

  if (phase === 'summary') {
    const correct = results.filter((row) => row.correct).length
    const total = results.length || 1
    const durations = results.map((row) => row.responseMs).filter((value) => value > 0)
    const fastest = durations.length ? Math.min(...durations) : 0
    const weak = results.filter((row) => row.rating <= 2)
    return (
      <div className="mx-auto max-w-3xl space-y-6 py-6">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-muted">Session Complete</p>
          <h1 className="mt-2 text-3xl font-semibold">这一组练完了</h1>
          <p className="mt-2 text-sm text-muted">
            {correct}/{results.length} 张答对 · 正确率 {percent(correct / total)}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SummaryStat label="复习卡片" value={`${results.length}`} />
          <SummaryStat label="中位反应" value={durations.length ? formatMs(median(durations)) : '—'} />
          <SummaryStat label="最快反应" value={fastest ? formatMs(fastest) : '—'} />
          <SummaryStat label="新卡" value={`${results.filter((row) => row.newCard).length}`} />
        </div>

        {weak.length > 0 && (
          <div className="card-surface p-5">
            <h2 className="text-sm font-medium text-cream">需要再练的卡</h2>
            <div className="mt-3 space-y-2">
              {weak.slice(0, 8).map((row) => (
                <div key={`${row.cardId}-${row.rating}`} className="rounded-xl border border-line/70 bg-ink/40 p-3">
                  <p className="text-xs text-muted">{row.promptZh}</p>
                  <p className="mt-1 text-sm text-cream">{row.answer}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap justify-center gap-3">
          <Button variant="primary" onClick={() => startSession('due')}>
            <Sparkles size={16} /> 再来一组
          </Button>
          {weak.length > 0 && (
            <Button
              variant="secondary"
              onClick={() => {
                const cardIds = new Set(weak.map((row) => row.cardId))
                const cards = index.allCards.filter((card) => cardIds.has(card.id))
                if (!cards.length) return
                setQueue(cards)
                setCardIndex(0)
                setResults([])
                setPhase('prompt')
                shownAtRef.current = performance.now()
              }}
            >
              <RotateCcw size={16} /> 只练错题
            </Button>
          )}
          <Link to="/">
            <Button variant="ghost">回首页</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (!current) {
    return <div className="py-24 text-center text-muted">没有卡片了。</div>
  }

  const progressValue = queue.length ? (cardIndex + 1) / queue.length : 0
  const timerValue = settings.timerSec > 0 ? (remaining ?? 0) / (settings.timerSec * 1000) : 1
  const suggestedGrade: GradeValue | null =
    timedOut || (match && !match.almost)
      ? 1
      : match?.correct && responseMs < 2000
        ? 4
        : match?.correct
          ? 3
          : match?.almost
            ? 2
            : null

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-4 py-5 md:py-8">
      <div className="flex items-center justify-between gap-3">
        <button onClick={finishNow} className="inline-flex items-center gap-1 text-sm text-muted hover:text-cream">
          <ArrowLeft size={16} /> 结束
        </button>
        <div className="flex items-center gap-2">
          <Badge tone="accent">{index.chapterById.get(current.chapterId ?? '')?.titleZh ?? current.kind}</Badge>
          {currentIsNew && <Badge tone="warn">新卡</Badge>}
          <span className="text-xs text-muted">
            {cardIndex + 1}/{queue.length}
          </span>
        </div>
        <button onClick={skip} className="inline-flex items-center gap-1 text-sm text-muted hover:text-cream">
          跳过 <SkipForward size={15} />
        </button>
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-panel-2">
        <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${progressValue * 100}%` }} />
      </div>

      <div className="flex flex-1 flex-col justify-center py-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            {current.contextZh && <p className="mb-2 text-xs leading-5 text-muted">场景：{current.contextZh}</p>}
            <p className="text-2xl font-medium leading-snug text-cream md:text-3xl">{current.promptZh}</p>
          </div>
          {settings.timerSec > 0 && (
            <ProgressRing
              value={timerValue}
              size={62}
              stroke={5}
              tone={timerValue < 0.3 ? 'danger' : timerValue < 0.6 ? 'warn' : 'accent'}
            >
              <span className="text-sm font-semibold text-cream">
                {phase === 'prompt' ? Math.ceil((remaining ?? 0) / 1000) : '✓'}
              </span>
            </ProgressRing>
          )}
        </div>

        {phase === 'prompt' ? (
          <div className="space-y-4">
            <div className="relative">
              <input
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="先大声说出来，或在这里打出英文…"
                className="w-full rounded-2xl border border-line bg-panel px-4 py-4 text-lg text-cream outline-none transition-colors placeholder:text-muted/60 focus:border-accent/60"
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
              />
              {settings.asrEnabled && (
                <button
                  onClick={startAsr}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-line bg-panel-2 p-2 text-muted hover:text-accent"
                  aria-label="语音输入"
                >
                  {listening ? <MicOff size={18} className="text-danger" /> : <Mic size={18} />}
                </button>
              )}
            </div>
            {asrTranscript && <p className="text-xs text-muted">识别：{asrTranscript}</p>}
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary" onClick={() => reveal(false)}>
                <ChevronRight size={16} /> 揭示答案
              </Button>
              <Button variant="ghost" onClick={replay}>
                <Volume2 size={16} /> 先听一遍
              </Button>
              <span className="text-xs text-muted">按 Enter 或空格揭示</span>
            </div>
            {message && <p className="text-xs text-warn">{message}</p>}
          </div>
        ) : (
          <div className="animate-fade-up space-y-5">
            <div className="rounded-2xl border border-accent/20 bg-accent/5 p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-accent">Your line</p>
              <p className="mt-2 text-3xl font-semibold leading-tight text-cream md:text-4xl">{current.primaryAnswer}</p>
              {current.acceptedAnswers.length > 1 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {current.acceptedAnswers.slice(1).map((answer) => (
                    <span key={answer} className="rounded-full border border-line bg-ink/40 px-2.5 py-1 text-xs text-muted">
                      {answer}
                    </span>
                  ))}
                </div>
              )}
              {current.explanationZh && <p className="mt-3 text-sm leading-6 text-muted">{current.explanationZh}</p>}
              <div className="mt-4 flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={replay}>
                  <Volume2 size={15} /> 重播
                </Button>
                {responseMs > 0 && (
                  <span className="text-xs text-muted">
                    反应 {formatMs(responseMs)} {timedOut && '· 超时'}
                  </span>
                )}
              </div>
            </div>

            {match && (
              <div className="rounded-xl border border-line bg-panel p-4">
                <p className="text-xs text-muted">你的输入</p>
                <div className="mt-2 flex flex-wrap gap-x-1 gap-y-1 text-sm">
                  {match.diff.map((token, i) => (
                    <span
                      key={`${token.token}-${i}`}
                      className={
                        token.status === 'same'
                          ? 'text-cream'
                          : token.status === 'missing'
                            ? 'rounded bg-warn/15 px-1 text-warn'
                            : 'rounded bg-danger/15 px-1 text-danger line-through'
                      }
                    >
                      {token.token}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {GRADES.map((item) => (
                <button
                  key={item.value}
                  onClick={() => grade(item.value)}
                  className={`relative rounded-xl border p-3 text-left transition-colors ${
                    item.value === suggestedGrade
                      ? 'border-accent/50 bg-accent/10'
                      : 'border-line bg-panel hover:border-muted/50'
                  }`}
                >
                  <p className="text-sm font-medium text-cream">{item.label}</p>
                  <p className="mt-0.5 text-xs text-muted">{item.hint}</p>
                  <span className="absolute right-2 top-2 text-2xs text-muted">{item.value}</span>
                  {item.value === suggestedGrade && (
                    <span className="absolute bottom-2 right-2 text-2xs text-accent">建议</span>
                  )}
                </button>
              ))}
            </div>
            <p className="text-center text-xs text-muted">
              按 1-4 评分 · Enter 下一张 · R 重播
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card-surface p-4 text-center">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-xl font-semibold text-cream">{value}</p>
    </div>
  )
}
