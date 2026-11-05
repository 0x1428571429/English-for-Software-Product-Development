import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Sparkles, Volume2 } from 'lucide-react'
import { useCorpus } from '../data/CorpusContext'
import { DialogueView } from '../components/dialogue/DialogueView'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { useSettingsStore } from '../store/useSettingsStore'
import { speak } from '../lib/speech'

type Tab = 'dialogue' | 'expressions' | 'vocab' | 'pronunciation'

export function ChapterPage() {
  const { chapterId } = useParams()
  const { corpus, index, loading } = useCorpus()
  const [tab, setTab] = useState<Tab>('dialogue')
  const [showTranslation, setShowTranslation] = useState(true)
  const settings = useSettingsStore()

  if (loading || !corpus || !index) {
    return <div className="py-24 text-center text-muted">正在加载语料…</div>
  }
  if (!chapterId) {
    return <div className="py-24 text-center text-muted">章节不存在。</div>
  }
  const chapter = index.chapterById.get(chapterId)
  const dialogue = index.dialogueByChapter.get(chapterId)
  const expressions = index.expressionsByChapter.get(chapterId) ?? []
  const vocab = index.vocabByChapter.get(chapterId) ?? []
  const pronunciation = index.pronunciationByChapter.get(chapterId) ?? []
  const cards = index.cardsByChapter.get(chapterId) ?? []
  const report = corpus.report.perChapter.find((row) => row.chapterId === chapterId)

  if (!chapter) {
    return <div className="py-24 text-center text-muted">章节不存在。</div>
  }

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'dialogue', label: '对话', count: dialogue?.lines.filter((line) => !line.isChannel).length ?? 0 },
    { key: 'expressions', label: '表达', count: expressions.length },
    { key: 'vocab', label: '词汇', count: vocab.length },
    { key: 'pronunciation', label: '发音', count: pronunciation.length },
  ]

  return (
    <div className="space-y-5">
      <Link to="/library" className="inline-flex items-center gap-1 text-sm text-muted hover:text-cream">
        <ArrowLeft size={16} /> 语料库
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted">{chapter.titleEn}</p>
          <h1 className="mt-1 text-3xl font-semibold">{chapter.titleZh}</h1>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge tone="accent">{cards.length} 张卡</Badge>
            <Badge>{expressions.length} 个表达</Badge>
            <Badge>{vocab.length} 个词汇</Badge>
            {report && <Badge tone={report.coverage < 50 ? 'warn' : 'neutral'}>对话翻译 {report.coverage}%</Badge>}
          </div>
        </div>
        <Link to={`/drill?chapter=${chapterId}&focus=1`}>
          <Button variant="primary">
            <Sparkles size={16} /> 练这一章
          </Button>
        </Link>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-line pb-px no-scrollbar">
        {tabs.map((item) => (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            className={`shrink-0 rounded-t-lg px-3 py-2 text-sm transition-colors ${
              tab === item.key ? 'border-b-2 border-accent text-cream' : 'text-muted hover:text-cream'
            }`}
          >
            {item.label} <span className="text-xs text-muted">{item.count}</span>
          </button>
        ))}
      </div>

      {tab === 'dialogue' && (
        <div className="card-surface p-4 md:p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs text-muted">点任意台词播放 · 悬停显示中文</p>
            <button
              onClick={() => setShowTranslation((value) => !value)}
              className="rounded-lg border border-line px-2.5 py-1 text-xs text-muted hover:text-cream"
            >
              {showTranslation ? '隐藏中文' : '显示中文'}
            </button>
          </div>
          {dialogue ? (
            <DialogueView dialogue={dialogue} showTranslation={showTranslation} />
          ) : (
            <p className="text-sm text-muted">这一章没有对话文件。</p>
          )}
        </div>
      )}

      {tab === 'expressions' && (
        <div className="space-y-3">
          {expressions.map((expression) => (
            <details key={expression.id} className="card-surface group p-4">
              <summary className="cursor-pointer list-none">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-cream">{expression.titleEn}</p>
                    <p className="mt-1 text-xs leading-5 text-muted">{expression.meaningZh ?? '暂无中文释义'}</p>
                  </div>
                  <button
                    onClick={(event) => {
                      event.preventDefault()
                      void speak(expression.titleEn, { rate: settings.ttsRate, voiceURI: settings.ttsVoiceURI })
                    }}
                    className="rounded p-1 text-muted hover:text-accent"
                    aria-label="播放"
                  >
                    <Volume2 size={15} />
                  </button>
                </div>
              </summary>
              {expression.alternatives.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs uppercase tracking-wide text-muted">也可以说</p>
                  <ul className="mt-1 space-y-1">
                    {expression.alternatives.map((alternative) => (
                      <li key={alternative} className="text-sm text-cream/90">
                        · {alternative}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {expression.usageZh.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs uppercase tracking-wide text-muted">什么时候说</p>
                  <ul className="mt-1 space-y-1">
                    {expression.usageZh.map((usage) => (
                      <li key={usage} className="text-xs text-muted">
                        · {usage}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {expression.related.length > 0 && (
                <div className="mt-3 space-y-1.5 rounded-xl border border-line/70 bg-ink/40 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted">关联对话</p>
                  {expression.related.map((line, i) => (
                    <div key={`${line.en}-${i}`} className="text-sm">
                      <span className="text-muted">{line.speaker ? `${line.speaker}: ` : ''}</span>
                      <span className="text-cream">{line.en}</span>
                      {line.zh && <span className="ml-2 text-xs text-muted">{line.zh}</span>}
                    </div>
                  ))}
                </div>
              )}
              {expression.pairs.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs uppercase tracking-wide text-muted">更多说法</p>
                  <ul className="mt-1 space-y-1">
                    {expression.pairs.map((pair) => (
                      <li key={`${pair.en}-${pair.zh}`} className="text-xs">
                        <span className="text-cream/90">{pair.en}</span>
                        <span className="ml-2 text-muted">{pair.zh}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </details>
          ))}
        </div>
      )}

      {tab === 'vocab' && (
        <div className="card-surface divide-y divide-line/60">
          {vocab.map((item) => (
            <div key={item.id} className="flex items-start justify-between gap-4 p-3.5">
              <div>
                <p className="text-sm font-medium text-cream">{item.term}</p>
                <p className="mt-0.5 text-xs text-muted">{item.meaningZh}</p>
                {item.exampleRaw && <p className="mt-1 text-xs text-cream/70">{item.exampleRaw}</p>}
              </div>
              <button
                onClick={() => void speak(item.term, { rate: settings.ttsRate, voiceURI: settings.ttsVoiceURI })}
                className="rounded p-1 text-muted hover:text-accent"
                aria-label="播放"
              >
                <Volume2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === 'pronunciation' && (
        <div className="card-surface overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
                <th className="px-3 py-2 font-medium">单词</th>
                <th className="px-3 py-2 font-medium">常见误读</th>
                <th className="px-3 py-2 font-medium">正确发音</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {pronunciation.map((item) => (
                <tr key={item.id} className="border-b border-line/50 last:border-0">
                  <td className="px-3 py-2.5 font-medium text-cream">{item.word}</td>
                  <td className="px-3 py-2.5 text-xs text-muted">{item.wrong}</td>
                  <td className="px-3 py-2.5 font-mono text-xs text-accent">{item.correct}</td>
                  <td className="px-3 py-2.5 text-right">
                    <button
                      onClick={() => void speak(item.word, { rate: settings.ttsRate, voiceURI: settings.ttsVoiceURI })}
                      className="rounded p-1 text-muted hover:text-accent"
                      aria-label="播放"
                    >
                      <Volume2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {pronunciation.length === 0 && <p className="p-4 text-sm text-muted">这一章没有发音表。</p>}
        </div>
      )}
    </div>
  )
}
