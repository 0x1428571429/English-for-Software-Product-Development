import { useMemo, useState } from 'react'
import { Headphones, Play, RotateCcw, Volume2, Check } from 'lucide-react'
import { useCorpus } from '../data/CorpusContext'
import { useSettingsStore } from '../store/useSettingsStore'
import { speak, speakWord } from '../lib/speech'
import { matchAnswer, type MatchResult } from '../lib/textMatch'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'

type Tab = 'dictation' | 'pronunciation' | 'mistakes'

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

export function ListeningPage() {
  const { corpus, index, loading } = useCorpus()
  const settings = useSettingsStore()
  const [tab, setTab] = useState<Tab>('dictation')
  const [chapterFilter, setChapterFilter] = useState('all')
  const [round, setRound] = useState(0)

  const lines = useMemo(() => {
    if (!corpus) return []
    const all = corpus.dialogues.flatMap((dialogue) =>
      dialogue.lines
        .filter((line) => !line.isChannel && !line.isStage && line.text.length >= 8)
        .map((line) => ({ ...line, chapterId: dialogue.chapterId })),
    )
    return shuffle(
      all.filter((line) => chapterFilter === 'all' || line.chapterId === chapterFilter),
      round + 1,
    ).slice(0, 20)
  }, [corpus, chapterFilter, round])

  const [step, setStep] = useState(0)
  const [input, setInput] = useState('')
  const [result, setResult] = useState<MatchResult | null>(null)
  const [score, setScore] = useState({ correct: 0, total: 0 })
  const [practiced, setPracticed] = useState<Set<string>>(new Set())
  const current = lines[step]

  if (loading || !corpus || !index) {
    return <div className="py-24 text-center text-muted">正在加载语料…</div>
  }

  const replay = () => {
    if (current) void speak(current.text, { rate: settings.ttsRate, voiceURI: settings.ttsVoiceURI })
  }

  const check = () => {
    if (!current || !input.trim()) return
    const match = matchAnswer(input, [current.text])
    setResult(match)
    setScore((value) => ({ correct: value.correct + (match.correct ? 1 : 0), total: value.total + 1 }))
  }

  const next = () => {
    setInput('')
    setResult(null)
    if (step + 1 >= lines.length) {
      setRound((value) => value + 1)
      setStep(0)
      setScore({ correct: 0, total: 0 })
    } else {
      setStep((value) => value + 1)
    }
  }

  const pronunciation = chapterFilter === 'all'
    ? corpus.pronunciation
    : corpus.pronunciation.filter((item) => item.chapterIds.includes(chapterFilter))

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-muted">Listening & Pronunciation</p>
        <h1 className="mt-1 text-3xl font-semibold">听力与发音</h1>
        <p className="mt-2 text-sm text-muted">先听再写，或者跟着发音表把容易读错的词说顺。</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1 rounded-xl border border-line bg-panel p-1">
          {([
            ['dictation', '听写'],
            ['pronunciation', '发音'],
            ['mistakes', '易错'],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`rounded-lg px-3 py-1.5 text-sm ${tab === key ? 'bg-accent/15 text-accent' : 'text-muted'}`}
            >
              {label}
            </button>
          ))}
        </div>
        <select
          value={chapterFilter}
          onChange={(event) => {
            setChapterFilter(event.target.value)
            setStep(0)
            setInput('')
            setResult(null)
          }}
          className="rounded-lg border border-line bg-panel px-2 py-1.5 text-xs text-cream outline-none"
        >
          <option value="all">全部章节</option>
          {corpus.chapters.map((chapter) => (
            <option key={chapter.id} value={chapter.id}>{chapter.titleZh}</option>
          ))}
        </select>
        {tab === 'dictation' && (
          <span className="ml-auto text-xs text-muted">{step + 1}/{lines.length} · {score.correct}/{score.total}</span>
        )}
      </div>

      {tab === 'dictation' && (
        <div className="mx-auto max-w-3xl space-y-4">
          {current ? (
            <div className="card-surface p-5 md:p-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="accent"><Headphones size={12} /> 听写</Badge>
                {index.chapterById.get(current.chapterId) && (
                  <Badge>{index.chapterById.get(current.chapterId)!.titleZh}</Badge>
                )}
                <Badge tone="muted">{current.speaker}</Badge>
              </div>
              <div className="mt-5 flex items-center gap-3">
                <Button variant="primary" onClick={replay}>
                  <Play size={16} /> 播放
                </Button>
                <Button variant="ghost" onClick={replay}>
                  <Volume2 size={16} /> 再听一遍
                </Button>
                <span className="text-xs text-muted">听不清就多听两遍，再写下你听到的英文。</span>
              </div>
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
                    event.preventDefault()
                    if (result) next()
                    else check()
                  }
                }}
                placeholder="Type what you hear…"
                className="mt-4 w-full rounded-xl border border-line bg-panel px-4 py-3 text-base text-cream outline-none placeholder:text-muted/60 focus:border-accent/60"
                autoComplete="off"
                spellCheck={false}
              />
              {result && (
                <div className="animate-fade-up mt-4 rounded-xl border border-line bg-ink/40 p-4">
                  <p className={`text-sm font-medium ${result.correct ? 'text-accent' : result.almost ? 'text-warn' : 'text-danger'}`}>
                    {result.correct ? '听对了。' : result.almost ? '很接近了。' : '再听一遍？'}
                  </p>
                  <p className="mt-2 text-lg leading-7 text-cream">{current.text}</p>
                  {current.zh && <p className="mt-1 text-sm text-muted">{current.zh}</p>}
                  <p className="mt-2 text-xs text-muted">你的输入：{input}</p>
                </div>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                {result ? (
                  <Button variant="primary" onClick={next}>下一句</Button>
                ) : (
                  <Button variant="primary" onClick={check} disabled={!input.trim()}>检查</Button>
                )}
                <Button variant="ghost" onClick={next}>跳过</Button>
                <Button variant="ghost" onClick={() => { setRound((value) => value + 1); setStep(0); setResult(null); setInput('') }}>
                  <RotateCcw size={14} /> 换一组
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted">这一组听写完成了。</p>
          )}
        </div>
      )}

      {tab === 'pronunciation' && (
        <div className="card-surface overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-[11px] uppercase tracking-wide text-muted">
                <th className="px-3 py-2 font-medium">单词</th>
                <th className="px-3 py-2 font-medium">常见误读</th>
                <th className="px-3 py-2 font-medium">正确发音</th>
                <th className="px-3 py-2 font-medium">跟读</th>
              </tr>
            </thead>
            <tbody>
              {pronunciation.map((item) => (
                <tr key={item.id} className="border-b border-line/50 last:border-0">
                  <td className="px-3 py-2.5 font-medium text-cream">{item.word}</td>
                  <td className="px-3 py-2.5 text-xs text-muted">{item.wrong}</td>
                  <td className="px-3 py-2.5 font-mono text-xs text-accent">{item.correct}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => void speakWord(item.word, { rate: 0.85, voiceURI: settings.ttsVoiceURI })}
                        className="rounded p-1 text-muted hover:text-accent"
                        aria-label="播放发音"
                        title="单词优先用有道词典发音，失败时回退到所选引擎"
                      >
                        <Volume2 size={15} />
                      </button>
                      <button
                        onClick={() => {
                          setPracticed((set) => {
                            const nextSet = new Set(set)
                            if (nextSet.has(item.id)) nextSet.delete(item.id)
                            else nextSet.add(item.id)
                            return nextSet
                          })
                        }}
                        className={`rounded-full border px-2 py-0.5 text-[11px] ${
                          practiced.has(item.id)
                            ? 'border-accent/40 bg-accent/10 text-accent'
                            : 'border-line text-muted hover:text-cream'
                        }`}
                      >
                        {practiced.has(item.id) ? <><Check size={11} className="mr-1 inline" />已跟读</> : '标记跟读'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {pronunciation.length === 0 && <p className="p-4 text-sm text-muted">这一章没有发音表。</p>}
        </div>
      )}

      {tab === 'mistakes' && (
        <div className="space-y-2">
          {corpus.mistakes.map((item) => (
            <div key={item.id} className="card-surface p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="danger">❌</Badge>
                <p className="text-sm text-danger line-through">{item.wrong}</p>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge tone="accent">✅</Badge>
                <p className="text-sm text-cream">{item.answers[0]}</p>
                <button
                  onClick={() => void speak(item.answers[0], { rate: settings.ttsRate, voiceURI: settings.ttsVoiceURI })}
                  className="rounded p-1 text-muted hover:text-accent"
                  aria-label="播放"
                >
                  <Volume2 size={14} />
                </button>
              </div>
              {item.noteZh && <p className="mt-1.5 text-xs text-muted">{item.noteZh}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
