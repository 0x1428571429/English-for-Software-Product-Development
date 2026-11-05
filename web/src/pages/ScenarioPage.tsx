import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Check, RotateCcw, Volume2, X } from 'lucide-react'
import { useCorpus } from '../data/CorpusContext'
import { useSettingsStore } from '../store/useSettingsStore'
import { speak } from '../lib/speech'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'

function shuffle<T>(items: T[], seed = Date.now()): T[] {
  const result = [...items]
  let state = seed >>> 0
  for (let i = result.length - 1; i > 0; i -= 1) {
    state = (state * 1664525 + 1013904223) >>> 0
    const j = state % (i + 1)
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export function ScenarioPage() {
  const { corpus, index, loading } = useCorpus()
  const settings = useSettingsStore()
  const [chapterFilter, setChapterFilter] = useState<string>('all')
  const [round, setRound] = useState(0)

  const pool = useMemo(() => {
    if (!corpus) return []
    return shuffle(
      corpus.scenarios.filter(
        (scenario) =>
          scenario.options?.length === 4 &&
          (chapterFilter === 'all' || scenario.chapterId === chapterFilter),
      ),
      round + 1,
    ).slice(0, 20)
  }, [corpus, chapterFilter, round])

  const [step, setStep] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [score, setScore] = useState({ correct: 0, total: 0 })
  const [finished, setFinished] = useState(false)
  const current = pool[step]

  useEffect(() => {
    setStep(0)
    setSelected(null)
    setScore({ correct: 0, total: 0 })
    setFinished(false)
  }, [chapterFilter, round])

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (finished) return
      if (!current) return
      if (event.key >= '1' && event.key <= '4' && selected === null) {
        event.preventDefault()
        choose(Number(event.key) - 1)
      } else if (event.key === 'Enter' && selected !== null) {
        event.preventDefault()
        next()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  })

  if (loading || !corpus || !index) {
    return <div className="py-24 text-center text-muted">正在加载语料…</div>
  }

  const choose = (optionIndex: number) => {
    if (!current || selected !== null) return
    const option = current.options?.[optionIndex]
    if (!option) return
    setSelected(optionIndex)
    setScore((value) => ({
      correct: value.correct + (option.correct ? 1 : 0),
      total: value.total + 1,
    }))
    if (settings.autoPlay && option.correct) {
      void speak(current.referenceAnswer ?? option.en, { rate: settings.ttsRate, voiceURI: settings.ttsVoiceURI })
    }
  }

  const next = () => {
    setSelected(null)
    if (step + 1 >= pool.length) {
      setFinished(true)
    } else {
      setStep((value) => value + 1)
    }
  }

  const restart = () => {
    setRound((value) => value + 1)
  }

  if (!pool.length) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center">
        <p className="text-sm text-muted">这个章节暂时没有可用的场景题。</p>
        <Button className="mt-4" variant="secondary" onClick={() => setChapterFilter('all')}>
          看全部章节
        </Button>
      </div>
    )
  }

  if (finished) {
    const accuracy = score.total ? score.correct / score.total : 0
    return (
      <div className="mx-auto max-w-2xl space-y-6 py-8 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-muted">Scenario Complete</p>
        <h1 className="text-3xl font-semibold">场景反应练完了</h1>
        <p className="text-sm text-muted">
          {score.correct}/{score.total} 题正确 · {Math.round(accuracy * 100)}%
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button variant="primary" onClick={restart}>
            <RotateCcw size={16} /> 再来一组
          </Button>
          <Link to="/">
            <Button variant="ghost">回首页</Button>
          </Link>
        </div>
      </div>
    )
  }

  const option = selected !== null ? current.options?.[selected] : null
  const correctOption = current.options?.find((item) => item.correct)

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-center justify-between gap-3">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted hover:text-cream">
          <ArrowLeft size={16} /> 返回
        </Link>
        <div className="flex items-center gap-2">
          <select
            value={chapterFilter}
            onChange={(event) => setChapterFilter(event.target.value)}
            className="rounded-lg border border-line bg-panel px-2 py-1.5 text-xs text-cream outline-none"
          >
            <option value="all">全部章节</option>
            {corpus.chapters.map((chapter) => (
              <option key={chapter.id} value={chapter.id}>{chapter.titleZh}</option>
            ))}
          </select>
          <span className="text-xs text-muted">{step + 1}/{pool.length}</span>
        </div>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-panel-2">
        <div className="h-full bg-accent transition-all" style={{ width: `${((step + (selected !== null ? 1 : 0)) / pool.length) * 100}%` }} />
      </div>

      <div className="card-surface p-5 md:p-6">
        <div className="flex flex-wrap gap-1.5">
          <Badge tone="accent">场景</Badge>
          {current.chapterId && <Badge>{index.chapterById.get(current.chapterId)?.titleZh}</Badge>}
          <Badge tone="muted">选最自然的一句</Badge>
        </div>
        <h1 className="mt-4 text-2xl font-medium leading-snug text-cream md:text-3xl">{current.promptZh}</h1>
        <p className="mt-2 text-xs text-muted">真实工程师会怎么说？</p>

        <div className="mt-5 grid gap-2">
          {current.options?.map((option, optionIndex) => {
            const chosen = selected === optionIndex
            const revealCorrect = selected !== null && option.correct
            const revealWrong = chosen && !option.correct
            return (
              <button
                key={`${option.en}-${optionIndex}`}
                onClick={() => choose(optionIndex)}
                disabled={selected !== null}
                className={`flex items-start gap-3 rounded-xl border p-3.5 text-left transition-colors ${
                  revealCorrect
                    ? 'border-accent/60 bg-accent/10'
                    : revealWrong
                      ? 'border-danger/60 bg-danger/10'
                      : selected !== null
                        ? 'border-line bg-panel/60 opacity-60'
                        : 'border-line bg-panel hover:border-accent/40'
                }`}
              >
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-line text-xs text-muted">
                  {String.fromCharCode(65 + optionIndex)}
                </span>
                <span className="text-sm leading-6 text-cream">{option.en}</span>
                {revealCorrect && <Check size={16} className="ml-auto mt-1 shrink-0 text-accent" />}
                {revealWrong && <X size={16} className="ml-auto mt-1 shrink-0 text-danger" />}
              </button>
            )
          })}
        </div>

        {selected !== null && option && (
          <div className="animate-fade-up mt-4 rounded-xl border border-line bg-ink/40 p-4">
            <p className={`text-sm font-medium ${option.correct ? 'text-accent' : 'text-danger'}`}>
              {option.correct ? '对，就是这个感觉。' : '再想想。更地道的说法是：'}
            </p>
            {!option.correct && correctOption && (
              <p className="mt-1 text-lg text-cream">{correctOption.en}</p>
            )}
            {current.examples.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {current.examples.map((example) => (
                  <span key={example} className="rounded-full border border-line px-2 py-0.5 text-xs text-muted">
                    {example}
                  </span>
                ))}
              </div>
            )}
            <div className="mt-3 flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => void speak(correctOption?.en ?? '', { rate: settings.ttsRate, voiceURI: settings.ttsVoiceURI })}>
                <Volume2 size={14} /> 听一遍
              </Button>
              <Button variant="primary" size="sm" onClick={next} className="ml-auto">
                下一题
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="text-center text-xs text-muted">
        键盘 1-4 选择 · Enter 下一题 · 当前 {score.correct}/{score.total}
      </div>
    </div>
  )
}
