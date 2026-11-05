import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Keyboard,
  Lightbulb,
  RotateCcw,
  Sparkles,
  SkipForward,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { useCorpus } from '../../data/CorpusContext'
import type { Card } from '../../data/types'
import { useProgressStore } from '../../store/useProgressStore'
import { useSettingsStore } from '../../store/useSettingsStore'
import { buildQueue, type QueueMode } from '../../lib/session'
import { GRADES, isNew, type GradeValue } from '../../lib/srs'
import { formatMs, matchAnswer, type MatchResult } from '../../lib/textMatch'
import { speak } from '../../lib/speech'
import { median, percent, todayStat } from '../../lib/stats'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import {
  buildCloze,
  checkCloze,
  hashString,
  maskWord,
  suggestTypingGrade,
  type ClozeCheck,
  type ClozePrompt,
} from './cloze'
import {
  classifyTypingKey,
  configureTypingSound,
  playTypingKey,
  primeTypingSound,
} from './sound'

type TypingMode = 'cloze' | 'sentence'
type Phase = 'setup' | 'drill' | 'summary'

interface TypingResult {
  cardId: string
  promptZh: string
  answer: string
  rating: GradeValue
  correct: boolean
  responseMs: number
  attempts: number
  newCard: boolean
  revealed: boolean
  mode: TypingMode
}

/**
 * 打字 / 填字训练页。
 *
 * 这一页只做会话编排：抽卡、展示、校验、评分、结算。
 * 挖空规则、答案比较、提示和评分建议都在 `cloze.ts` 里，方便单独测试和以后重构。
 */
export function TypingPage() {
  const { corpus, index, loading } = useCorpus()
  const settings = useSettingsStore()
  const progress = useProgressStore((state) => state.cards)
  const daily = useProgressStore((state) => state.daily)
  const recordReview = useProgressStore((state) => state.recordReview)
  const finishSession = useProgressStore((state) => state.finishSession)

  const [phase, setPhase] = useState<Phase>('setup')
  const [typingMode, setTypingMode] = useState<TypingMode>('cloze')
  const [queue, setQueue] = useState<Card[]>([])
  const [cardIndex, setCardIndex] = useState(0)
  const [sessionSeed, setSessionSeed] = useState(1)
  const [values, setValues] = useState<string[]>([])
  const [sentenceInput, setSentenceInput] = useState('')
  const [check, setCheck] = useState<ClozeCheck | null>(null)
  const [sentenceMatch, setSentenceMatch] = useState<MatchResult | null>(null)
  const [attempts, setAttempts] = useState(0)
  const [hintLevel, setHintLevel] = useState(0)
  const [hintsUsed, setHintsUsed] = useState(0)
  const [solved, setSolved] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [responseMs, setResponseMs] = useState(0)
  const [results, setResults] = useState<TypingResult[]>([])
  const [message, setMessage] = useState<string | null>(null)

  const shownAtRef = useRef(0)
  const blankRefs = useRef<Array<HTMLInputElement | null>>([])
  const sentenceRef = useRef<HTMLInputElement>(null)
  const current = queue[cardIndex]
  const today = todayStat(daily)

  const cloze = useMemo<ClozePrompt | null>(() => {
    if (!current) return null
    return buildCloze(current.primaryAnswer, {
      seed: hashString(`${current.id}:${sessionSeed}`),
      maxBlanks: 3,
    })
  }, [current, sessionSeed])

  const currentIsNew = current ? isNew(progress[current.id]?.fsrs) : false
  const suggestedGrade: GradeValue | null = solved
    ? suggestTypingGrade({ revealed, attempts, hintsUsed, elapsedMs: responseMs })
    : null

  const resetCardState = useCallback(() => {
    setValues([])
    setSentenceInput('')
    setCheck(null)
    setSentenceMatch(null)
    setAttempts(0)
    setHintLevel(0)
    setHintsUsed(0)
    setSolved(false)
    setRevealed(false)
    setResponseMs(0)
    setMessage(null)
    shownAtRef.current = performance.now()
  }, [])

  useEffect(() => {
    if (phase !== 'drill' || !current) return
    resetCardState()
    const focusTimer = window.setTimeout(() => {
      if (typingMode === 'cloze') blankRefs.current[0]?.focus()
      else sentenceRef.current?.focus()
    }, 40)
    return () => window.clearTimeout(focusTimer)
    // 只在切换卡片时重置；typingMode 在会话中不变。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, current?.id])

  useEffect(() => {
    configureTypingSound({
      enabled: settings.typingSoundEnabled,
      volume: settings.typingSoundVolume,
      pack: settings.typingSoundPack,
    })
  }, [settings.typingSoundEnabled, settings.typingSoundVolume, settings.typingSoundPack])

  useEffect(() => {
    if (phase !== 'drill' || !settings.typingSoundEnabled) return
    const isField = (target: EventTarget | null) =>
      target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || event.isComposing || event.metaKey || event.ctrlKey || event.altKey) return
      if (!isField(event.target)) return
      const kind = classifyTypingKey(event.key)
      if (kind) playTypingKey(kind, 'down')
    }
    const onKeyUp = (event: KeyboardEvent) => {
      if (!isField(event.target)) return
      const kind = classifyTypingKey(event.key)
      if (kind) playTypingKey(kind, 'up')
    }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('keyup', onKeyUp)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('keyup', onKeyUp)
    }
  }, [phase, settings.typingSoundEnabled])

  const startSession = (mode: QueueMode = 'due') => {
    if (!index) return
    const seed = Date.now()
    const nextQueue = buildQueue({
      cards: index.allCards,
      progress,
      dailyNewCards: today.newCards,
      newCardsPerDay: settings.newCardsPerDay,
      sessionSize: settings.sessionSize,
      mode,
      seed,
    })
    if (!nextQueue.length) {
      setMessage('这个范围暂时没有卡片。试试「随机混练」，或先完成一组反射训练。')
      setPhase('setup')
      return
    }
    if (settings.typingSoundEnabled) void primeTypingSound(settings.typingSoundPack)
    setSessionSeed(seed)
    setQueue(nextQueue)
    setCardIndex(0)
    setResults([])
    setPhase('drill')
  }

  const toggleTypingSound = () => {
    const enabled = !settings.typingSoundEnabled
    settings.update({ typingSoundEnabled: enabled })
    configureTypingSound({ enabled })
    if (enabled) void primeTypingSound(settings.typingSoundPack)
  }

  const solve = (wasRevealed: boolean) => {
    if (!current || solved) return
    setSolved(true)
    setRevealed(wasRevealed)
    setResponseMs(performance.now() - shownAtRef.current)
    setMessage(null)
    if (settings.autoPlay) {
      void speak(current.primaryAnswer, { rate: settings.ttsRate, voiceURI: settings.ttsVoiceURI })
    }
  }

  const revealAnswer = () => {
    if (!current || solved) return
    if (typingMode === 'cloze' && cloze) {
      setValues(cloze.blanks.map((blank) => blank.answer))
      setCheck({ correct: true, perBlank: cloze.blanks.map(() => true), firstWrong: -1 })
    } else {
      setSentenceInput(current.primaryAnswer)
    }
    solve(true)
  }

  const showHint = () => {
    if (solved) return
    setHintsUsed((value) => value + 1)
    setHintLevel((value) => Math.min(2, value + 1))
  }

  const checkNow = () => {
    if (!current || !cloze || solved) return
    if (values.length < cloze.blanks.length || values.some((value) => !value.trim())) {
      setMessage('先把每个空都填上。')
      return
    }
    const result = checkCloze(cloze, values)
    setCheck(result)
    if (result.correct) {
      solve(false)
      return
    }
    setAttempts((value) => value + 1)
    setMessage('红色的空还不对。再想想，或者点「提示」。')
    blankRefs.current[result.firstWrong]?.focus()
  }

  const updateBlank = (blankIndex: number, value: string) => {
    if (solved || !cloze) return
    const next = [...values]
    while (next.length < cloze.blanks.length) next.push('')
    next[blankIndex] = value
    setValues(next)
    if (next.every((item) => item.trim()) && checkCloze(cloze, next).correct) {
      solve(false)
    }
  }

  const submitSentence = () => {
    if (!current || solved) return
    if (!sentenceInput.trim()) {
      setMessage('先把整句英文打出来。')
      return
    }
    const result = matchAnswer(sentenceInput, [current.primaryAnswer, ...current.acceptedAnswers])
    setSentenceMatch(result)
    if (result.correct) {
      solve(false)
      return
    }
    setAttempts((value) => value + 1)
    setMessage(
      result.almost
        ? '很接近了。对照下面的逐词差异，把漏掉或打错的词补上。'
        : '还不太对。对照逐词差异再试一次，或者点「显示答案」。',
    )
  }

  const finishNow = (rows = results) => {
    if (rows.length) {
      finishSession({
        mode: 'typing',
        cards: rows.length,
        correct: rows.filter((row) => row.correct).length,
        medianMs: Math.round(median(rows.map((row) => row.responseMs).filter(Boolean))),
        newCards: rows.filter((row) => row.newCard).length,
        grades: rows.map((row) => row.rating),
      })
    }
    setPhase('summary')
  }

  const grade = (rating: GradeValue) => {
    if (!current || !solved) return
    recordReview({
      cardId: current.id,
      rating,
      responseMs: responseMs || performance.now() - shownAtRef.current,
      mode: 'typing',
    })
    const row: TypingResult = {
      cardId: current.id,
      promptZh: current.promptZh,
      answer: current.primaryAnswer,
      rating,
      correct: rating >= 3 && !revealed,
      responseMs,
      attempts,
      newCard: currentIsNew,
      revealed,
      mode: typingMode,
    }
    const rows = [...results, row]
    setResults(rows)
    if (cardIndex + 1 >= queue.length) {
      finishNow(rows)
    } else {
      setCardIndex((value) => value + 1)
    }
  }

  const skip = () => {
    if (!current) return
    const row: TypingResult = {
      cardId: current.id,
      promptZh: current.promptZh,
      answer: current.primaryAnswer,
      rating: 1,
      correct: false,
      responseMs: 0,
      attempts,
      newCard: currentIsNew,
      revealed: true,
      mode: typingMode,
    }
    const rows = [...results, row]
    setResults(rows)
    if (cardIndex + 1 >= queue.length) {
      finishNow(rows)
    } else {
      setCardIndex((value) => value + 1)
    }
  }

  const replay = () => {
    if (current) void speak(current.primaryAnswer, { rate: settings.ttsRate, voiceURI: settings.ttsVoiceURI })
  }

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (phase !== 'drill') return
      if (event.key === 'Escape') {
        event.preventDefault()
        finishNow()
        return
      }
      if (!solved) return
      if (event.key === '1' || event.key === '2' || event.key === '3' || event.key === '4') {
        event.preventDefault()
        grade(Number(event.key) as GradeValue)
      } else if (event.key === 'Enter') {
        event.preventDefault()
        grade(suggestedGrade ?? 3)
      } else if (event.key.toLowerCase() === 'r') {
        event.preventDefault()
        replay()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, solved, suggestedGrade, results, cardIndex, responseMs, revealed, attempts, hintsUsed])

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
          <p className="text-xs uppercase tracking-[0.2em] text-muted">Type & Recall</p>
          <h1 className="mt-1 text-3xl font-semibold">打字 · 填字</h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            看见中文先想英文，再把它打出来。填字练关键词，整句打字练完整输出；拼写的过程会让记忆更牢。
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <ModeOption
            active={typingMode === 'cloze'}
            title="填字模式"
            description="英文句子挖掉 1–3 个关键词。看中文提示，把空补全。"
            badge="推荐先练"
            onClick={() => setTypingMode('cloze')}
          />
          <ModeOption
            active={typingMode === 'sentence'}
            title="整句打字"
            description="只给中文，不看英文，把整句打出来；逐词对照差异。"
            badge="进阶"
            onClick={() => setTypingMode('sentence')}
          />
        </div>

        <div className="card-surface space-y-4 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="accent">{index.allCards.length} 张可用卡</Badge>
            <Badge tone="warn">{today.reviews} 张今日已练</Badge>
            <Badge>{settings.sessionSize} 张一组</Badge>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Button variant="primary" size="lg" onClick={() => startSession('due')}>
              <Keyboard size={18} /> 开始（到期优先）
            </Button>
            <Button variant="secondary" size="lg" onClick={() => startSession('all')}>
              随机混练
            </Button>
            <Button variant="secondary" size="lg" onClick={() => startSession('new')}>
              只练新卡
            </Button>
            <Button variant="secondary" size="lg" onClick={() => startSession('weak')}>
              只练弱项
            </Button>
          </div>
          {message && <p className="text-sm text-warn">{message}</p>}
          <div className="grid gap-2 text-xs text-muted sm:grid-cols-2">
            <p>· 填错不会直接跳过，可以改到对为止</p>
            <p>· 提示会降低评分建议，但不影响你自己选</p>
            <p>· Enter 检查 / 下一空 · 1–4 评分 · Esc 结束</p>
            <p>· 拼写结果会计入 FSRS 复习节奏</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Link to="/drill" className="card-surface p-4 hover:border-accent/40">
            <p className="text-sm font-medium text-cream">想练速度？</p>
            <p className="mt-1 text-xs text-muted">限时反射训练：先开口，再揭示，5 秒内说出来。</p>
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
    const weak = results.filter((row) => !row.correct)
    return (
      <div className="mx-auto max-w-3xl space-y-6 py-6">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-muted">Typing Complete</p>
          <h1 className="mt-2 text-3xl font-semibold">这一组打完了</h1>
          <p className="mt-2 text-sm text-muted">
            {correct}/{results.length} 张独立完成 · 正确率 {percent(correct / total)}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SummaryStat label="练习卡片" value={`${results.length}`} />
          <SummaryStat label="中位用时" value={durations.length ? formatMs(median(durations)) : '—'} />
          <SummaryStat label="需要重练" value={`${weak.length}`} />
          <SummaryStat
            label="看答案"
            value={`${results.filter((row) => row.revealed).length}`}
          />
        </div>

        {weak.length > 0 && (
          <div className="card-surface p-5">
            <h2 className="text-sm font-medium text-cream">这些句子再打一遍</h2>
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
                setSessionSeed(Date.now())
                setPhase('drill')
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
  const chapterTitle = index.chapterById.get(current.chapterId ?? '')?.titleZh ?? current.kind
  const hintLabel = hintLevel === 0 ? '提示首字母' : hintLevel === 1 ? '再露一个字母' : '提示已用完'

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-4 py-5 md:py-8">
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => finishNow()}
          className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-sm text-muted hover:text-cream"
        >
          <ArrowLeft size={16} /> 结束
        </button>
        <div className="flex min-w-0 items-center gap-2">
          <Badge tone="accent">{typingMode === 'cloze' ? '填字' : '整句'}</Badge>
          <Badge className="max-sm:hidden">{chapterTitle}</Badge>
          {currentIsNew && (
            <Badge tone="warn" className="max-sm:hidden">
              新卡
            </Badge>
          )}
          <span className="whitespace-nowrap text-xs text-muted">
            {cardIndex + 1}/{queue.length}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <button
            onClick={toggleTypingSound}
            aria-label={settings.typingSoundEnabled ? '关闭打字音效' : '打开打字音效'}
            title={settings.typingSoundEnabled ? '关闭打字音效' : '打开打字音效'}
            className="text-muted transition-colors hover:text-cream"
          >
            {settings.typingSoundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
          <button
            onClick={skip}
            className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-sm text-muted hover:text-cream"
          >
            跳过 <SkipForward size={15} />
          </button>
        </div>
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-panel-2">
        <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${progressValue * 100}%` }} />
      </div>

      <div className="flex flex-1 flex-col justify-center py-6">
        <div className="mb-5">
          {current.contextZh && <p className="mb-2 text-xs leading-5 text-muted">场景：{current.contextZh}</p>}
          <p className="text-2xl font-medium leading-snug text-cream md:text-3xl">{current.promptZh}</p>
        </div>

        {!solved && typingMode === 'cloze' && cloze && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-line bg-panel p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-muted">Fill in the blanks</p>
              <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-3 text-xl leading-relaxed text-cream md:text-2xl">
                {cloze.tokens.map((token, tokenIndex) =>
                  token.blankIndex === null ? (
                    <span key={`${token.text}-${tokenIndex}`}>{token.text}</span>
                  ) : (
                    <span key={`${token.text}-${tokenIndex}`} className="inline-flex items-baseline">
                      {token.prefix && <span>{token.prefix}</span>}
                      <input
                        ref={(element) => {
                          blankRefs.current[token.blankIndex!] = element
                        }}
                        value={values[token.blankIndex] ?? ''}
                        onChange={(event) => updateBlank(token.blankIndex!, event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key !== 'Enter' || event.nativeEvent.isComposing) return
                          event.preventDefault()
                          if (token.blankIndex! + 1 < cloze.blanks.length) {
                            blankRefs.current[token.blankIndex! + 1]?.focus()
                          } else {
                            checkNow()
                          }
                        }}
                        placeholder={maskWord(cloze.blanks[token.blankIndex].answer, hintLevel)}
                        aria-label={`第 ${token.blankIndex + 1} 个空`}
                        autoComplete="off"
                        autoCapitalize="off"
                        spellCheck={false}
                        style={{ width: `${Math.max(5, Math.min(16, cloze.blanks[token.blankIndex].length + 2))}ch` }}
                        className={`mx-0.5 rounded-lg border-b-2 bg-transparent px-1 text-center font-semibold outline-none transition-colors placeholder:font-normal placeholder:text-muted/60 ${
                          check?.perBlank[token.blankIndex] === false
                            ? 'border-danger text-danger'
                            : check?.perBlank[token.blankIndex] === true
                              ? 'border-accent text-accent'
                              : 'border-line text-accent focus:border-accent'
                        }`}
                      />
                      {token.suffix && <span>{token.suffix}</span>}
                    </span>
                  ),
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary" onClick={checkNow}>
                <Check size={16} /> 检查
              </Button>
              <Button variant="ghost" onClick={showHint} disabled={hintLevel >= 2}>
                <Lightbulb size={16} /> {hintLabel}
              </Button>
              <Button variant="ghost" onClick={revealAnswer}>
                显示答案
              </Button>
              <span className="text-xs text-muted">Enter 检查 / 下一空</span>
            </div>
            {message && <p className="text-xs text-warn">{message}</p>}
          </div>
        )}

        {!solved && typingMode === 'sentence' && (
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault()
              submitSentence()
            }}
          >
            <input
              ref={sentenceRef}
              value={sentenceInput}
              onChange={(event) => setSentenceInput(event.target.value)}
              placeholder="把完整英文句子打出来…"
              className="w-full rounded-2xl border border-line bg-panel px-4 py-4 text-lg text-cream outline-none transition-colors placeholder:text-muted/60 focus:border-accent/60"
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
            />
            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" variant="primary">
                <ChevronRight size={16} /> 检查
              </Button>
              <Button type="button" variant="ghost" onClick={revealAnswer}>
                显示答案
              </Button>
              <span className="text-xs text-muted">Enter 检查 · 错了可以继续改</span>
            </div>
            {sentenceMatch && !sentenceMatch.correct && (
              <div className="rounded-xl border border-line bg-panel p-4">
                <p className="text-xs text-muted">逐词差异（红色删除线 = 多打，黄色 = 漏打）</p>
                <div className="mt-2 flex flex-wrap gap-x-1 gap-y-1 text-sm">
                  {sentenceMatch.diff.map((token, i) => (
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
            {message && <p className="text-xs text-warn">{message}</p>}
          </form>
        )}

        {solved && (
          <div className="animate-fade-up space-y-5">
            <div className="rounded-2xl border border-accent/20 bg-accent/5 p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-accent">
                {revealed ? 'Answer revealed' : 'Correct'}
              </p>
              <p className="mt-2 text-2xl font-semibold leading-tight text-cream md:text-3xl">
                {current.primaryAnswer}
              </p>
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
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Button variant="ghost" size="sm" onClick={replay}>
                  <Volume2 size={15} /> 重播
                </Button>
                {responseMs > 0 && (
                  <span className="text-xs text-muted">
                    用时 {formatMs(responseMs)}
                    {attempts > 0 && ` · 改了 ${attempts} 次`}
                    {hintsUsed > 0 && ` · 用了 ${hintsUsed} 次提示`}
                  </span>
                )}
              </div>
            </div>

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
            <p className="text-center text-xs text-muted">按 1–4 评分 · Enter 接受建议 · R 重播</p>
          </div>
        )}
      </div>
    </div>
  )
}

function ModeOption({
  active,
  title,
  description,
  badge,
  onClick,
}: {
  active: boolean
  title: string
  description: string
  badge: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-2xl border p-4 text-left transition-colors ${
        active ? 'border-accent/50 bg-accent/10' : 'border-line bg-panel hover:border-muted/50'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-cream">{title}</p>
        <Badge tone={active ? 'accent' : 'neutral'}>{badge}</Badge>
      </div>
      <p className="mt-2 text-xs leading-5 text-muted">{description}</p>
    </button>
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
