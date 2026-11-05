import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, BookOpenText, MessageCircle, Play, Users } from 'lucide-react'
import { useCorpus } from '../data/CorpusContext'
import { DialogueView } from '../components/dialogue/DialogueView'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { useSettingsStore } from '../store/useSettingsStore'
import { speak } from '../lib/speech'
import type { Dialogue } from '../data/types'

export function DialoguePage() {
  const { chapterId } = useParams()
  const { corpus, index, loading } = useCorpus()
  const settings = useSettingsStore()

  if (loading || !corpus || !index) {
    return <div className="py-24 text-center text-muted">正在加载语料…</div>
  }

  if (!chapterId) {
    return (
      <div className="space-y-5">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-muted">Roleplay</p>
          <h1 className="mt-1 text-3xl font-semibold">对话角色扮演</h1>
          <p className="mt-2 text-sm text-muted">
            选一个角色，隐藏自己的台词，按真实对话节奏一句句说出来。
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {corpus.chapters.map((chapter) => {
            const dialogue = index.dialogueByChapter.get(chapter.id)
            const lines = dialogue?.lines.filter((line) => !line.isChannel && !line.isStage) ?? []
            const translated = lines.filter((line) => line.zh).length
            return (
              <Link
                key={chapter.id}
                to={`/dialogue/${chapter.id}`}
                className="card-surface group p-4 transition-colors hover:border-accent/40"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] text-muted">{String(chapter.order).padStart(2, '0')}</p>
                    <h2 className="mt-0.5 text-base font-medium text-cream">{chapter.titleZh}</h2>
                    <p className="mt-0.5 text-xs text-muted">{chapter.titleEn}</p>
                  </div>
                  <span className="rounded-lg border border-line bg-panel-2 p-1.5 text-muted group-hover:text-accent">
                    <MessageCircle size={15} />
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  <Badge>{lines.length} 句</Badge>
                  <Badge>{dialogue?.format === 'chat' ? '聊天' : '口语'}</Badge>
                  {translated / Math.max(1, lines.length) < 0.5 && <Badge tone="warn">翻译少</Badge>}
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    )
  }

  const chapter = index.chapterById.get(chapterId)
  const dialogue = index.dialogueByChapter.get(chapterId)
  if (!chapter || !dialogue) {
    return <div className="py-24 text-center text-muted">没有找到这一章的对话。</div>
  }

  return (
    <DialogueDetail
      chapter={chapter.titleZh}
      chapterId={chapter.id}
      dialogue={dialogue}
      ttsRate={settings.ttsRate}
      ttsVoiceURI={settings.ttsVoiceURI}
    />
  )
}

function DialogueDetail({
  chapter,
  chapterId,
  dialogue,
  ttsRate,
  ttsVoiceURI,
}: {
  chapter: string
  chapterId: string
  dialogue: Dialogue
  ttsRate: number
  ttsVoiceURI: string | null
}) {
  const [mode, setMode] = useState<'read' | 'roleplay'>('read')
  const [showTranslation, setShowTranslation] = useState(true)
  const playable = dialogue.lines.filter((line) => !line.isChannel && !line.isStage)
  const speakers = useMemo(() => {
    const set = new Set(playable.map((line) => line.speaker).filter((speaker) => speaker !== '?'))
    return [...set]
  }, [playable])

  return (
    <div className="space-y-5">
      <Link to="/dialogue" className="inline-flex items-center gap-1 text-sm text-muted hover:text-cream">
        <ArrowLeft size={16} /> 对话列表
      </Link>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs text-muted">{dialogue.format === 'chat' ? '聊天记录' : '口语对话'}</p>
          <h1 className="mt-1 text-3xl font-semibold">{chapter}</h1>
          <p className="mt-1 text-sm text-muted">{playable.length} 句 · {speakers.length} 个说话人</p>
        </div>
        <div className="flex gap-1 rounded-xl border border-line bg-panel p-1">
          <button
            onClick={() => setMode('read')}
            className={`rounded-lg px-3 py-1.5 text-sm ${mode === 'read' ? 'bg-accent/15 text-accent' : 'text-muted'}`}
          >
            <BookOpenText size={14} className="mr-1 inline" /> 阅读
          </button>
          <button
            onClick={() => setMode('roleplay')}
            className={`rounded-lg px-3 py-1.5 text-sm ${mode === 'roleplay' ? 'bg-accent/15 text-accent' : 'text-muted'}`}
          >
            <Users size={14} className="mr-1 inline" /> 角色扮演
          </button>
        </div>
      </div>

      {mode === 'read' ? (
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
          <DialogueView dialogue={dialogue} showTranslation={showTranslation} />
        </div>
      ) : (
        <Roleplay
          dialogue={dialogue}
          speakers={speakers}
          showTranslation={showTranslation}
          onToggleTranslation={() => setShowTranslation((value) => !value)}
          ttsRate={ttsRate}
          ttsVoiceURI={ttsVoiceURI}
          chapterId={chapterId}
        />
      )}
    </div>
  )
}

function Roleplay({
  dialogue,
  speakers,
  showTranslation,
  onToggleTranslation,
  ttsRate,
  ttsVoiceURI,
  chapterId,
}: {
  dialogue: Dialogue
  speakers: string[]
  showTranslation: boolean
  onToggleTranslation: () => void
  ttsRate: number
  ttsVoiceURI: string | null
  chapterId: string
}) {
  const playable = dialogue.lines.filter((line) => !line.isChannel && !line.isStage)
  const [role, setRole] = useState(speakers[speakers.length - 1] ?? 'B')
  const [step, setStep] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const current = playable[step]
  const isMyLine = current?.speaker === role
  const previous = step > 0 ? playable[step - 1] : null

  const next = () => {
    setRevealed(false)
    setStep((value) => Math.min(playable.length, value + 1))
  }
  const restart = () => {
    setStep(0)
    setRevealed(false)
  }

  if (!playable.length) return <p className="text-sm text-muted">没有可练习的台词。</p>

  if (step >= playable.length) {
    return (
      <div className="card-surface p-6 text-center">
        <p className="text-sm text-muted">这一章练完了。</p>
        <h2 className="mt-2 text-2xl font-semibold">Nice work.</h2>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <Button variant="primary" onClick={restart}>再来一遍</Button>
          <Link to={`/drill?chapter=${chapterId}&focus=1`}>
            <Button variant="secondary">去反射训练</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="card-surface flex flex-wrap items-center gap-3 p-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted">我的角色</span>
          <select
            value={role}
            onChange={(event) => {
              setRole(event.target.value)
              setStep(0)
              setRevealed(false)
            }}
            className="rounded-lg border border-line bg-panel px-2 py-1.5 text-sm text-cream outline-none"
          >
            {speakers.map((speaker) => (
              <option key={speaker} value={speaker}>{speaker}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted">
          <span>{step + 1}/{playable.length}</span>
          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-panel-2">
            <div className="h-full bg-accent" style={{ width: `${((step + 1) / playable.length) * 100}%` }} />
          </div>
        </div>
        <div className="ml-auto flex gap-2">
          <button onClick={onToggleTranslation} className="rounded-lg border border-line px-2.5 py-1 text-xs text-muted hover:text-cream">
            {showTranslation ? '隐藏中文' : '显示中文'}
          </button>
          <button onClick={restart} className="rounded-lg border border-line px-2.5 py-1 text-xs text-muted hover:text-cream">
            重来
          </button>
        </div>
      </div>

      {previous && (
        <div className="rounded-xl border border-line/60 bg-ink/40 p-3 text-sm">
          <p className="text-[11px] text-muted">{previous.speaker}</p>
          <p className="mt-0.5 text-cream/90">{previous.text}</p>
          {showTranslation && previous.zh && <p className="mt-0.5 text-xs text-muted">{previous.zh}</p>}
        </div>
      )}

      <div className={`card-surface p-5 ${isMyLine ? 'border-accent/30' : ''}`}>
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted">
            {isMyLine ? '轮到你 · ' : ''}{current.speaker}
          </p>
          {!isMyLine && (
            <button
              onClick={() => void speak(current.text, { rate: ttsRate, voiceURI: ttsVoiceURI })}
              className="rounded p-1 text-muted hover:text-accent"
              aria-label="播放"
            >
              <Play size={15} />
            </button>
          )}
        </div>
        {isMyLine ? (
          <div className="mt-3">
            {!revealed ? (
              <>
                <p className="text-lg leading-8 text-cream">
                  {showTranslation && current.zh ? current.zh : '先自己说一遍，再揭示原文。'}
                </p>
                <div className="mt-4 flex gap-2">
                  <Button variant="primary" onClick={() => setRevealed(true)}>揭示我的台词</Button>
                  <Button variant="ghost" onClick={next}>跳过</Button>
                </div>
              </>
            ) : (
              <>
                <p className="text-xl font-medium leading-8 text-cream">{current.text}</p>
                {showTranslation && current.zh && <p className="mt-1 text-sm text-muted">{current.zh}</p>}
                <div className="mt-4 flex gap-2">
                  <Button variant="primary" onClick={next}>下一句</Button>
                  <Button variant="ghost" onClick={() => void speak(current.text, { rate: ttsRate, voiceURI: ttsVoiceURI })}>
                    听一遍
                  </Button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="mt-3">
            <p className="text-xl leading-8 text-cream">{current.text}</p>
            {showTranslation && <p className="mt-1 text-sm text-muted">{current.zh ?? '暂无翻译'}</p>}
            <div className="mt-4">
              <Button variant="secondary" onClick={next}>下一句</Button>
            </div>
          </div>
        )}
      </div>

      <div className="text-center text-xs text-muted">
        建议：先听对方怎么说，再模仿语气回答。按 Enter 继续。
      </div>
    </div>
  )
}
