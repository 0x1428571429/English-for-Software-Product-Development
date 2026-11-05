import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  Eye,
  EyeOff,
  GraduationCap,
  Heart,
  Lock,
  RotateCcw,
  Sparkles,
  Target,
  Trophy,
  Volume2,
  X,
} from 'lucide-react'
import {
  STORY_EPISODES,
  careerRank,
  challengePassed,
  choiceScore,
  endingFor,
  episodeChoiceCount,
  episodeLock,
  storyEpisodeById,
  type StoryChoice,
  type StoryEnding,
  type StoryEpisode,
  type StoryQuality,
} from '../data/story'
import { StoryBackdrop } from '../components/story/StoryBackdrop'
import { StoryPortrait } from '../components/story/StoryPortrait'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { useSettingsStore } from '../store/useSettingsStore'
import { useStoryStore, type StoryReward } from '../store/useStoryStore'
import { cancelSpeech, speak } from '../lib/speech'

const QUALITY_LABEL: Record<StoryQuality, string> = {
  good: '好选择',
  ok: '还行',
  bad: '有风险',
}

export function StoryEpisodePage() {
  const { episodeId } = useParams()
  const episode = storyEpisodeById(episodeId)
  const [run, setRun] = useState(0)

  if (!episode) {
    return (
      <div className="grid min-h-[70vh] place-items-center px-4">
        <div className="card-surface max-w-md p-6 text-center">
          <p className="text-sm text-muted">没有找到这一集。</p>
          <Link to="/story" className="mt-4 inline-block">
            <Button variant="primary">回到剧情列表</Button>
          </Link>
        </div>
      </div>
    )
  }

  return <StoryGate key={`${episode.id}-${run}`} episode={episode} onRestart={() => setRun((value) => value + 1)} />
}

function StoryGate({ episode, onRestart }: { episode: StoryEpisode; onRestart: () => void }) {
  const careerPoints = useStoryStore((state) => state.careerPoints)
  const rankLevel = useStoryStore((state) => state.rankLevel)
  const records = useStoryStore((state) => state.records)
  const careerTrack = useStoryStore((state) => state.careerTrack)
  const lock = episodeLock(episode, {
    rankLevel,
    careerPoints,
    careerTrack,
    completedIds: Object.keys(records),
  })
  const track = careerTrack ?? 'frontend'

  if (lock) {
    const title =
      lock.kind === 'track'
        ? '不是你的路径'
        : lock.kind === 'rank'
          ? '职级不够'
          : lock.kind === 'points'
            ? '绩效点不够'
            : lock.kind === 'track-episode'
              ? '先完成专精剧集'
              : '前置剧集未完成'
    const body =
      lock.kind === 'track'
        ? lock.needsChoice
          ? '先回到剧情列表，选择前端或全栈路径。'
          : '这一集属于另一条 VP 路径。本季只能在剧情列表里查看。'
        : lock.kind === 'rank'
          ? `这一集需要 ${lock.rank.titleZh}。你现在的职级是 ${careerRank(rankLevel, track).titleZh}。`
          : lock.kind === 'points'
            ? `这一集需要 ${episode.unlockAt} 绩效点。你现在有 ${careerPoints} 点，还差 ${lock.missing} 点。`
            : lock.kind === 'track-episode'
              ? 'VP 挑战要求先完成本路径的专精剧集。先回剧情列表，把专精集打完。'
              : '先完成前置剧集，再回来。'

    return (
      <div className="relative grid min-h-[100dvh] place-items-center overflow-hidden px-4">
        <StoryBackdrop scene={episode.scene} />
        <div className="relative z-10 w-full max-w-md rounded-2xl border border-line bg-panel/95 p-6 text-center shadow-2xl backdrop-blur">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-line bg-ink/60">
            <Lock size={22} className="text-muted" />
          </div>
          <p className="mt-4 text-[11px] uppercase tracking-[0.22em] text-warn">Episode locked</p>
          <h1 className="mt-2 text-2xl font-semibold text-cream">{episode.titleZh}</h1>
          <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-muted">{title}</p>
          <p className="mt-2 text-sm leading-6 text-muted">{body}</p>
          <p className="mt-3 rounded-xl border border-line/70 bg-ink/40 p-3 text-xs leading-5 text-cream/75">
            先把前面的剧集打完。每集首通 +20，挑战通过再 +20。重玩不会重复刷分。
          </p>
          <Link to="/story" className="mt-5 inline-block">
            <Button variant="primary">回到剧情列表</Button>
          </Link>
        </div>
      </div>
    )
  }

  return <StoryPlayer episode={episode} onRestart={onRestart} />
}

function StoryPlayer({ episode, onRestart }: { episode: StoryEpisode; onRestart: () => void }) {
  const navigate = useNavigate()
  const settings = useSettingsStore()
  const recordEnding = useStoryStore((state) => state.recordEnding)
  const checkIn = useStoryStore((state) => state.checkIn)
  const insight = useStoryStore((state) => state.insight)
  const learnInsight = useStoryStore((state) => state.learnInsight)
  const [beatId, setBeatId] = useState(episode.start)
  const [trust, setTrust] = useState<Record<string, number>>(() =>
    Object.fromEntries(episode.characters.map((character) => [character.id, 50])),
  )
  const [history, setHistory] = useState<StoryChoice[]>([])
  const [selected, setSelected] = useState<StoryChoice | null>(null)
  const [ending, setEnding] = useState<StoryEnding | null>(null)
  const [reward, setReward] = useState<StoryReward | null>(null)
  const [showZh, setShowZh] = useState(true)
  const [autoVoice, setAutoVoice] = useState(false)
  const [feedback, setFeedback] = useState<StoryChoice | null>(null)
  const [insightGain, setInsightGain] = useState(0)
  const [briefing, setBriefing] = useState(true)
  const [reading, setReading] = useState(false)
  const recorded = useRef(false)

  const beat = episode.beats[beatId] ?? episode.beats[episode.start]
  const typed = useTypewriter(briefing || reading ? '' : beat.en)
  const totalChoices = useMemo(() => episodeChoiceCount(episode), [episode])
  const script = useMemo(() => Object.values(episode.beats), [episode])

  const finish = useCallback(() => {
    const score = history.reduce((sum, choice) => sum + choiceScore(choice.quality), 0)
    const result = endingFor(episode, score)
    const passed = challengePassed(episode, history, trust)
    setEnding(result)
    cancelSpeech()
    if (!recorded.current) {
      recorded.current = true
      const earned = recordEnding(
        {
          episodeId: episode.id,
          endingId: result.tone,
          endingTitleZh: result.titleZh,
          score,
          goodChoices: history.filter((choice) => choice.quality === 'good').length,
          totalChoices: history.length,
          completedAt: new Date().toISOString(),
          challengePassed: passed,
          careerPointsEarned: 0,
          fired: result.fired,
        },
        episode.careerPoints,
        episode.promotionTo,
      )
      setReward(earned)
      checkIn()
    }
  }, [checkIn, episode, history, recordEnding, trust])

  const go = useCallback((nextId: string) => {
    setSelected(null)
    setFeedback(null)
    setInsightGain(0)
    setBeatId(nextId)
  }, [])

  const advance = useCallback(() => {
    if (ending || briefing || reading) return
    if (!typed.done) {
      typed.skip()
      return
    }
    if (selected) {
      go(selected.next)
      return
    }
    if (beat.choices?.length) return
    if (beat.ending === 'auto') {
      finish()
      return
    }
    if (beat.next) go(beat.next)
  }, [beat, briefing, ending, finish, go, reading, selected, typed])

  const choose = useCallback(
    (choice: StoryChoice) => {
      if (selected) return
      if (choice.requiresInsight && insight < choice.requiresInsight) return
      setSelected(choice)
      setFeedback(choice)
      setHistory((items) => [...items, choice])
      const gained = learnInsight(`${episode.id}:${choice.id}`, choice.insight ?? 0)
      setInsightGain(gained)
      setTrust((current) => {
        const next = { ...current }
        for (const [characterId, delta] of Object.entries(choice.trust ?? {})) {
          next[characterId] = Math.max(0, Math.min(100, (next[characterId] ?? 50) + delta))
        }
        return next
      })
      void speak(choice.en, { rate: settings.ttsRate, voiceURI: settings.ttsVoiceURI })
    },
    [episode.id, insight, learnInsight, selected, settings.ttsRate, settings.ttsVoiceURI],
  )

  useEffect(() => {
    if (!autoVoice || beat.speaker === 'narration' || briefing || reading) return
    void speak(beat.en, { rate: settings.ttsRate, voiceURI: settings.ttsVoiceURI })
    return () => cancelSpeech()
  }, [autoVoice, beat.en, beat.speaker, briefing, reading, settings.ttsRate, settings.ttsVoiceURI])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const onControl = target?.closest('button, a, input, textarea, select')
      if (event.key === 'Escape') {
        if (reading) {
          setReading(false)
          return
        }
        if (briefing) return
        navigate('/story')
        return
      }
      if (ending) return
      if (onControl) return
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault()
        advance()
        return
      }
      if (/^[1-9]$/.test(event.key) && typed.done && beat.choices?.length && !selected) {
        const choice = beat.choices[Number(event.key) - 1]
        if (choice) choose(choice)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [advance, beat.choices, briefing, choose, ending, navigate, reading, selected, typed.done])

  const speaking = episode.characters.find((character) => character.id === beat.speaker)
  const scene = beat.scene ?? episode.scene
  const dim = Boolean(beat.choices?.length && typed.done && !selected)

  return (
    <div className="relative h-[100dvh] min-h-[620px] overflow-hidden bg-ink">
      <div key={scene} className="story-scene-in absolute inset-0">
        <StoryBackdrop scene={scene} dim={dim} />
      </div>

      <div className="absolute inset-0 z-10 flex flex-col">
        <header className="flex items-center gap-2 px-3 pt-3 sm:gap-3 sm:px-6 sm:pt-5">
          <Link
            to="/story"
            className="rounded-full border border-line/80 bg-ink/55 p-2 text-muted backdrop-blur transition-colors hover:text-cream"
            aria-label="回到剧情列表"
          >
            <ArrowLeft size={18} />
          </Link>
          <div className="min-w-0">
            <p className="truncate text-[10px] uppercase tracking-[0.2em] text-muted">
              EP.{String(episode.order).padStart(2, '0')} · {episode.titleEn}
            </p>
            <h1 className="truncate text-sm font-medium text-cream sm:text-base">{episode.titleZh}</h1>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <IconToggle active={reading} onClick={() => setReading(true)} label="阅读剧本" icon={BookOpen} />
            <IconToggle
              active={showZh}
              onClick={() => setShowZh((value) => !value)}
              label={showZh ? '隐藏中文' : '显示中文'}
              icon={showZh ? Eye : EyeOff}
            />
            <IconToggle
              active={autoVoice}
              onClick={() => {
                setAutoVoice((value) => {
                  if (!value) {
                    void speak(beat.en, { rate: settings.ttsRate, voiceURI: settings.ttsVoiceURI })
                  } else {
                    cancelSpeech()
                  }
                  return !value
                })
              }}
              label={autoVoice ? '关闭自动朗读' : '自动朗读'}
              icon={Volume2}
            />
          </div>
        </header>

        <div className="flex items-center gap-2 px-3 pt-3 sm:px-6">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-ink/60">
            <div
              className="h-full rounded-full bg-accent transition-all duration-500"
              style={{ width: `${Math.min(100, (history.length / Math.max(1, totalChoices)) * 100)}%` }}
            />
          </div>
          <span className="flex items-center gap-1.5 text-[10px] text-muted">
            <span>{history.length}/{totalChoices} 选择</span>
            <span className="rounded-full border border-accent/30 bg-accent/10 px-1.5 py-0.5 text-accent">
              认知 {insight}
            </span>
          </span>
        </div>

        <div className="hidden justify-center px-3 pt-2 sm:flex">
          <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-line/60 bg-ink/45 px-2.5 py-1 text-[10px] text-muted backdrop-blur">
            <Target size={11} className="shrink-0 text-warn" />
            <span className="truncate">{episode.challenge.zh}</span>
          </span>
        </div>

        <div className="relative flex-1">
          {episode.characters.map((character) => {
            const active = beat.speaker === character.id
            const side = episode.positions?.[character.id] ?? character.side
            const position =
              side === 'far-left'
                ? 'left-[-4%] sm:left-0'
                : side === 'inner-left'
                  ? 'left-[18%] sm:left-[22%]'
                  : side === 'left'
                    ? 'left-[-2%] sm:left-[2%]'
                    : side === 'inner-right'
                      ? 'right-[18%] sm:right-[22%]'
                      : side === 'right'
                        ? 'right-[-2%] sm:right-[2%]'
                        : side === 'far-right'
                          ? 'right-[-4%] sm:right-0'
                          : 'left-1/2 -translate-x-1/2'
            const crowded = episode.characters.length > 3
            const height = crowded
              ? side === 'center'
                ? 'h-[30%] sm:h-[38%]'
                : 'h-[32%] sm:h-[44%]'
              : side === 'center'
                ? 'h-[34%] sm:h-[44%]'
                : 'h-[36%] sm:h-[52%]'
            return (
              <div
                key={character.id}
                className={`absolute bottom-[30%] ${position} ${height} transition-all duration-500 ${
                  side === 'center' ? 'z-0 opacity-70' : 'z-10'
                } ${active ? 'scale-105' : 'scale-100'}`}
              >
                <StoryPortrait character={character} mood={active ? beat.mood : 'neutral'} active={active} />
              </div>
            )
          })}
        </div>

        <div className="relative z-20 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6 sm:pb-5">
          <div className="mx-auto max-w-4xl">
            <TrustBar episode={episode} trust={trust} visible={!ending} />
            <div className="mt-2 rounded-2xl border border-line/80 bg-panel/90 p-4 shadow-2xl backdrop-blur-xl sm:p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: speaking?.color ?? 'var(--color-accent)' }}
                />
                <span className="text-sm font-medium text-cream">
                  {beat.speaker === 'narration' ? '旁白' : beat.speaker === 'you' ? '你' : speaking?.name}
                </span>
                {speaking && <span className="text-[11px] text-muted">{speaking.roleZh}</span>}
                {beat.speaker !== 'narration' && (
                  <button
                    onClick={(event) => {
                      event.stopPropagation()
                      void speak(beat.en, { rate: settings.ttsRate, voiceURI: settings.ttsVoiceURI })
                    }}
                    className="ml-auto rounded-full border border-line/80 p-1.5 text-muted transition-colors hover:text-accent"
                    aria-label="朗读这句"
                  >
                    <Volume2 size={14} />
                  </button>
                )}
              </div>

              <div
                className="mt-2 cursor-pointer select-none"
                onClick={advance}
                role="button"
                tabIndex={0}
                aria-label="点击继续"
              >
                <p className="min-h-[3.5rem] text-lg font-medium leading-8 tracking-[0.01em] text-cream sm:min-h-[4rem] sm:text-xl">
                  {typed.shown}
                  {!typed.done && <span className="story-caret" />}
                </p>
                {showZh && <p className="mt-1 text-sm leading-6 text-muted">{beat.zh}</p>}
              </div>

              {beat.choices?.length && typed.done && !selected && (
                <div className="animate-fade-up mt-4 grid gap-2" onClick={(event) => event.stopPropagation()}>
                  {beat.choices.map((choice, index) => {
                    const insightLocked = Boolean(
                      choice.requiresInsight && insight < choice.requiresInsight,
                    )
                    return (
                      <button
                        key={choice.id}
                        onClick={() => choose(choice)}
                        disabled={insightLocked}
                        style={{ animationDelay: `${index * 45}ms` }}
                        className={`group animate-fade-up flex items-start gap-3 rounded-xl border border-line bg-ink/45 px-3 py-2.5 text-left transition-colors ${
                          insightLocked
                            ? 'cursor-not-allowed opacity-55'
                            : 'hover:border-accent/60 hover:bg-accent/[0.06]'
                        }`}
                      >
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-line text-[10px] text-muted group-hover:border-accent/50 group-hover:text-accent">
                          {insightLocked ? <Lock size={10} /> : index + 1}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-medium leading-5 text-cream">{choice.en}</span>
                          {showZh && <span className="mt-0.5 block text-[11px] leading-4 text-muted">{choice.zh}</span>}
                          {insightLocked && (
                            <span className="mt-1 inline-block rounded-full border border-warn/40 bg-warn/10 px-1.5 py-0.5 text-[10px] text-warn">
                              需要认知 {choice.requiresInsight}
                            </span>
                          )}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}

              {selected && feedback && (
                <div className="animate-fade-up mt-4" onClick={(event) => event.stopPropagation()}>
                  <div
                    className={`rounded-xl border p-3 ${
                      feedback.quality === 'good'
                        ? 'border-accent/40 bg-accent/[0.08]'
                        : feedback.quality === 'ok'
                          ? 'border-warn/40 bg-warn/[0.07]'
                          : 'border-danger/40 bg-danger/[0.07]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {feedback.quality === 'good' ? (
                        <Check size={15} className="text-accent" />
                      ) : feedback.quality === 'bad' ? (
                        <X size={15} className="text-danger" />
                      ) : (
                        <Sparkles size={15} className="text-warn" />
                      )}
                      <span
                        className={`text-xs font-medium ${
                          feedback.quality === 'good'
                            ? 'text-accent'
                            : feedback.quality === 'bad'
                              ? 'text-danger'
                              : 'text-warn'
                        }`}
                      >
                        {QUALITY_LABEL[feedback.quality]}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs leading-5 text-cream/80">{feedback.noteZh}</p>
                    {insightGain > 0 && (
                      <p className="mt-1 text-[11px] text-accent">+{insightGain} 认知 · 这个道理你记住了</p>
                    )}
                    {feedback.insight && insightGain === 0 && (
                      <p className="mt-1 text-[11px] text-muted">这条道理你已经学过，不再重复加认知。</p>
                    )}
                    {feedback.trust && Object.keys(feedback.trust).length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {Object.entries(feedback.trust).map(([characterId, delta]) => {
                          const character = episode.characters.find((item) => item.id === characterId)
                          if (!character) return null
                          return (
                            <span
                              key={characterId}
                              className={`rounded-full border px-2 py-0.5 text-[10px] ${
                                delta >= 0 ? 'border-accent/30 text-accent' : 'border-danger/30 text-danger'
                              }`}
                            >
                              {character.name} {delta >= 0 ? '+' : ''}
                              {delta}
                            </span>
                          )
                        })}
                      </div>
                    )}
                  </div>
                  <Button variant="primary" className="mt-3 w-full sm:w-auto" onClick={() => go(selected.next)}>
                    继续 <ArrowRight size={15} />
                  </Button>
                </div>
              )}

              {!beat.choices?.length && !selected && !ending && (
                <div className="mt-3 flex items-center justify-end gap-1 text-[10px] text-muted/70">
                  {typed.done ? '点击继续' : '点击跳过'}
                  <ArrowRight size={12} className={typed.done ? 'story-bounce' : ''} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {briefing && (
        <MissionBriefing
          episode={episode}
          onStart={() => {
            setBriefing(false)
            if (autoVoice) {
              void speak(episode.beats[episode.start]?.en ?? '', {
                rate: settings.ttsRate,
                voiceURI: settings.ttsVoiceURI,
              })
            }
          }}
          onRead={() => setReading(true)}
        />
      )}

      {reading && (
        <ReadingOverlay
          episode={episode}
          script={script}
          showZh={showZh}
          onToggleZh={() => setShowZh((value) => !value)}
          onClose={() => setReading(false)}
        />
      )}

      {ending && (
        <EndingOverlay
          episode={episode}
          ending={ending}
          trust={trust}
          history={history}
          reward={reward}
          onRestart={onRestart}
        />
      )}
    </div>
  )
}

function IconToggle({
  active,
  onClick,
  label,
  icon: Icon,
}: {
  active: boolean
  onClick: () => void
  label: string
  icon: typeof Eye
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`rounded-full border p-2 backdrop-blur transition-colors ${
        active ? 'border-accent/50 bg-accent/10 text-accent' : 'border-line/80 bg-ink/55 text-muted hover:text-cream'
      }`}
    >
      <Icon size={16} />
    </button>
  )
}

function MissionBriefing({
  episode,
  onStart,
  onRead,
}: {
  episode: StoryEpisode
  onStart: () => void
  onRead: () => void
}) {
  const careerTrack = useStoryStore((state) => state.careerTrack)
  const knowledge =
    episode.knowledge?.filter((card) => !card.track || card.track === careerTrack) ?? []

  return (
    <div className="absolute inset-0 z-40 grid place-items-center bg-ink/80 p-3 backdrop-blur-md">
      <div className="story-scene-in max-h-[92dvh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-line bg-panel shadow-2xl">
        <div className="relative overflow-hidden border-b border-line/70 px-5 py-5 sm:px-7">
          <div className="absolute inset-0 opacity-30">
            <StoryBackdrop scene={episode.scene} />
          </div>
          <div className="relative z-10">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="accent">EP.{String(episode.order).padStart(2, '0')}</Badge>
              {episode.kind === 'promotion' && <Badge tone="warn">晋升挑战</Badge>}
              {episode.kind === 'interview' && <Badge tone="warn">跳槽终面</Badge>}
              {episode.kind === 'romance' && <Badge tone="danger">感情线</Badge>}
              {episode.kind === 'crisis' && <Badge tone="danger">危机事件</Badge>}
              {episode.track && (
                <Badge tone="accent">{episode.track === 'frontend' ? '前端路径' : '全栈路径'}</Badge>
              )}
              <span className="text-[10px] uppercase tracking-[0.2em] text-muted">{episode.titleEn}</span>
            </div>
            <h2 className="mt-2 text-2xl font-semibold text-cream sm:text-3xl">{episode.titleZh}</h2>
            <p className="mt-1 text-sm leading-6 text-muted">{episode.taglineZh}</p>
          </div>
        </div>

        <div className="space-y-4 px-5 py-5 sm:px-7">
          <section className="rounded-xl border border-warn/30 bg-warn/[0.06] p-3.5">
            <div className="flex items-center gap-2 text-warn">
              <Target size={15} />
              <h3 className="text-xs font-medium uppercase tracking-[0.16em]">本集任务</h3>
            </div>
            <p className="mt-1.5 text-sm leading-6 text-cream">{episode.challenge.zh}</p>
            <p className="mt-1 text-[11px] text-muted">
              达成条件：至少 {episode.challenge.minGood} 个好选择
              {episode.challenge.maxBad !== undefined ? `，最多 ${episode.challenge.maxBad} 个坏选择` : ''}
              。挑战通过额外 +20 绩效。部分选项需要认知，认知来自你之前真正理解过的选择。
            </p>
          </section>

          {knowledge.length ? (
            <section className="rounded-xl border border-accent/25 bg-accent/[0.05] p-3.5">
              <div className="flex items-center gap-2 text-accent">
                <GraduationCap size={15} />
                <h3 className="text-xs font-medium uppercase tracking-[0.16em]">本集职业课</h3>
              </div>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {knowledge.map((card) => (
                  <div key={card.id} className="rounded-lg border border-line/70 bg-ink/40 p-2.5">
                    <p className="text-[11px] font-medium text-cream">{card.titleZh}</p>
                    <p className="mt-0.5 text-[10px] uppercase tracking-[0.12em] text-muted">{card.titleEn}</p>
                    <p className="mt-1 text-[11px] leading-4 text-cream/70">{card.summaryZh}</p>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[10px] text-muted">
                通关后完整知识卡会进入「职场 → 职业手册」，可随时复习。
              </p>
            </section>
          ) : null}

          <div className="grid gap-3 md:grid-cols-[1.1fr_1fr]">
            <section>
              <h3 className="text-xs font-medium uppercase tracking-[0.16em] text-muted">本集语言点</h3>
              <div className="mt-2 space-y-2">
                {episode.languageFocus.map((focus) => (
                  <div key={focus.en} className="rounded-xl border border-line/70 bg-ink/40 p-2.5">
                    <div className="flex items-start gap-2">
                      <p className="min-w-0 flex-1 text-xs font-medium leading-5 text-cream">{focus.en}</p>
                      <button
                        onClick={() => void speak(focus.en)}
                        className="shrink-0 rounded-full border border-line/70 p-1 text-muted hover:text-accent"
                        aria-label="朗读语言点"
                      >
                        <Volume2 size={12} />
                      </button>
                    </div>
                    <p className="mt-0.5 text-[11px] leading-4 text-muted">{focus.zh}</p>
                    <p className="mt-1 text-[10px] leading-4 text-accent/70">{focus.noteZh}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h3 className="text-xs font-medium uppercase tracking-[0.16em] text-muted">出场角色</h3>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {episode.characters.map((character) => (
                  <div key={character.id} className="rounded-xl border border-line/70 bg-ink/40 p-2 text-center">
                    <div className="mx-auto h-20 w-14">
                      <StoryPortrait character={character} mood="neutral" />
                    </div>
                    <p className="mt-1 text-[11px] font-medium text-cream">{character.name}</p>
                    <p className="text-[9px] leading-3 text-muted">{character.roleZh}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-line/70 pt-4">
            <Button variant="primary" onClick={onStart}>
              开始剧情 <ArrowRight size={15} />
            </Button>
            <Button variant="secondary" onClick={onRead}>
              <BookOpen size={14} /> 先读剧本
            </Button>
            <span className="text-[10px] text-muted">Enter / 空格推进 · 数字键选择 · Esc 返回</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function ReadingOverlay({
  episode,
  script,
  showZh,
  onToggleZh,
  onClose,
}: {
  episode: StoryEpisode
  script: StoryEpisode['beats'][string][]
  showZh: boolean
  onToggleZh: () => void
  onClose: () => void
}) {
  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-ink/95 backdrop-blur-md">
      <header className="flex items-center gap-2 border-b border-line/70 px-4 py-3">
        <BookOpen size={16} className="text-accent" />
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted">Reading mode</p>
          <h2 className="truncate text-sm font-medium text-cream">
            {episode.titleZh} · 剧本
          </h2>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <button
            onClick={onToggleZh}
            className="rounded-full border border-line/80 px-2.5 py-1.5 text-[11px] text-muted hover:text-cream"
          >
            {showZh ? '隐藏中文' : '显示中文'}
          </button>
          <button
            onClick={onClose}
            className="rounded-full border border-line/80 p-2 text-muted hover:text-cream"
            aria-label="关闭阅读模式"
          >
            <X size={15} />
          </button>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto px-4 py-5">
        <div className="mx-auto max-w-3xl space-y-5">
          <div className="rounded-xl border border-line/70 bg-panel/70 p-4">
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted">Task</p>
            <p className="mt-1 text-sm leading-6 text-cream">{episode.challenge.zh}</p>
          </div>
          {script.map((item) => {
            const character = episode.characters.find((person) => person.id === item.speaker)
            const speaker = item.speaker === 'narration' ? '旁白' : item.speaker === 'you' ? '你' : character?.name
            return (
              <article key={item.id} className="border-l-2 border-line pl-3">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-accent/80">{speaker}</span>
                  {character && <span className="text-[10px] text-muted">{character.roleZh}</span>}
                  <button
                    onClick={() => void speak(item.en)}
                    className="ml-auto rounded-full p-1 text-muted hover:text-accent"
                    aria-label="朗读这一段"
                  >
                    <Volume2 size={12} />
                  </button>
                </div>
                <p className="mt-1 text-sm leading-6 text-cream">{item.en}</p>
                {showZh && <p className="mt-1 text-xs leading-5 text-muted">{item.zh}</p>}
                {item.choices?.length ? (
                  <div className="mt-2 space-y-1.5 rounded-lg border border-line/60 bg-panel/60 p-2.5">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-muted">你的可能回应</p>
                    {item.choices.map((choice) => (
                      <p key={choice.id} className="text-[11px] leading-5 text-cream/70">
                        <span className="text-accent/70">·</span> {choice.en}
                        {showZh && <span className="text-muted"> — {choice.zh}</span>}
                      </p>
                    ))}
                  </div>
                ) : null}
              </article>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function TrustBar({
  episode,
  trust,
  visible,
}: {
  episode: StoryEpisode
  trust: Record<string, number>
  visible: boolean
}) {
  if (!visible) return null
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {episode.characters.map((character) => (
        <div
          key={character.id}
          className="flex items-center gap-1.5 rounded-full border border-line/60 bg-ink/50 px-2 py-0.5 backdrop-blur"
          title={`${character.name} 信任度 ${trust[character.id] ?? 50}`}
        >
          <Heart size={9} style={{ color: character.color }} />
          <span className="text-[10px] text-muted">{character.name}</span>
          <span className="h-1 w-10 overflow-hidden rounded-full bg-panel-2">
            <span
              className="block h-full rounded-full transition-all duration-500"
              style={{ width: `${trust[character.id] ?? 50}%`, background: character.color }}
            />
          </span>
        </div>
      ))}
    </div>
  )
}

function EndingOverlay({
  episode,
  ending,
  trust,
  history,
  reward,
  onRestart,
}: {
  episode: StoryEpisode
  ending: StoryEnding
  trust: Record<string, number>
  history: StoryChoice[]
  reward: StoryReward | null
  onRestart: () => void
}) {
  const good = history.filter((choice) => choice.quality === 'good').length
  const bad = history.filter((choice) => choice.quality === 'bad').length
  const passed = reward?.challengePassed ?? false
  const rankUp = Boolean(reward?.rankUp)
  const interviewOffer = episode.kind === 'interview' && ending.tone === 'good'
  const celebration = (passed || ending.tone === 'good') && !ending.fired
  const toneClass =
    ending.tone === 'good' ? 'border-accent/50' : ending.tone === 'bad' ? 'border-danger/50' : 'border-warn/50'
  const toneText = ending.tone === 'good' ? 'text-accent' : ending.tone === 'bad' ? 'text-danger' : 'text-warn'
  const records = useStoryStore((state) => state.records)
  const careerTrack = useStoryStore((state) => state.careerTrack)
  const rankLevel = useStoryStore((state) => state.rankLevel)
  const careerPoints = useStoryStore((state) => state.careerPoints)
  const nextEpisode =
    STORY_EPISODES.slice(STORY_EPISODES.indexOf(episode) + 1).find(
      (item) =>
        (!item.track || item.track === careerTrack) &&
        !episodeLock(item, {
          rankLevel,
          careerPoints,
          careerTrack,
          completedIds: Object.keys(records),
        }),
    ) ?? null
  const knowledge =
    episode.knowledge?.filter((card) => !card.track || card.track === careerTrack) ?? []

  return (
    <div className="absolute inset-0 z-50 grid place-items-center overflow-y-auto bg-ink/85 p-3 backdrop-blur-md">
      {celebration && <Confetti />}
      <div
        className={`animate-fade-up relative z-10 my-4 w-full max-w-2xl overflow-hidden rounded-2xl border bg-panel shadow-2xl ${toneClass}`}
      >
        <div className="relative border-b border-line/70 px-5 py-6 sm:px-7">
          <p className={`text-[11px] uppercase tracking-[0.24em] ${toneText}`}>ENDING</p>
          <h2 className="mt-2 text-3xl font-semibold text-cream">{ending.titleZh}</h2>
          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted">{ending.titleEn}</p>
          <div className="absolute right-4 top-4 hidden gap-1 sm:flex">
            {episode.characters.map((character) => (
              <div key={character.id} className="h-24 w-14 opacity-80">
                <StoryPortrait
                  character={character}
                  mood={ending.tone === 'good' ? 'happy' : ending.tone === 'bad' ? 'angry' : 'neutral'}
                />
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4 px-5 py-5 sm:px-7">
          {ending.fired && (
            <div className="animate-fade-up rounded-xl border border-danger/50 bg-danger/10 p-3 text-center">
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-danger">
                <Lock size={16} /> FIRED · 你被开除了
              </p>
              <p className="mt-1 text-[11px] leading-5 text-danger/80">
                Security 会收走你的工牌，HR 会收走你的电脑。这一集可以重玩，换一种处理方式，结局会改写。
              </p>
            </div>
          )}
          {rankUp && reward && (
            <div className="animate-fade-up rounded-xl border border-warn/50 bg-warn/10 p-3 text-center">
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-warn">
                <Trophy size={16} /> PROMOTION APPROVED · 升职成功
              </p>
              <p className="mt-1 text-[11px] text-warn/80">
                新职级：{reward.rankTitleZh} · {careerRank(reward.rankLevel).salary}/月
              </p>
            </div>
          )}
          {interviewOffer && (
            <div className="animate-fade-up rounded-xl border border-accent/50 bg-accent/10 p-3 text-center">
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-accent">
                <Trophy size={16} /> OFFER · VP of Engineering
              </p>
              <p className="mt-1 text-[11px] text-accent/80">¥180k/月 · 带 40 人 · 新公司</p>
            </div>
          )}
          <p className="text-sm leading-6 text-cream/85">{ending.bodyZh}</p>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Metric label="好选择" value={`${good}`} tone="text-accent" />
            <Metric label="有风险" value={`${bad}`} tone="text-danger" />
            <Metric label="选择数" value={`${history.length}`} tone="text-cream" />
            <Metric label="本次绩效" value={`+${reward?.earned ?? 0}`} tone="text-warn" />
          </div>

          <div
            className={`rounded-xl border p-3 ${
              passed ? 'border-accent/40 bg-accent/[0.07]' : 'border-warn/40 bg-warn/[0.06]'
            }`}
          >
            <div className="flex items-center gap-2">
              {passed ? <Check size={15} className="text-accent" /> : <Target size={15} className="text-warn" />}
              <p className={`text-xs font-medium ${passed ? 'text-accent' : 'text-warn'}`}>
                {passed ? '挑战通过' : '挑战未通过'}
              </p>
              <span className="ml-auto text-[10px] text-muted">
                目标：{episode.challenge.zh}
              </span>
            </div>
            {!passed && (
              <p className="mt-1.5 text-[11px] leading-5 text-muted">
                达成条件：至少 {episode.challenge.minGood} 个好选择
                {episode.challenge.maxBad !== undefined ? `，最多 ${episode.challenge.maxBad} 个坏选择` : ''}
                。这集可以重玩，挑战奖励只发一次。
              </p>
            )}
          </div>

          {knowledge.length ? (
            <div className="rounded-xl border border-accent/25 bg-accent/[0.05] p-3">
              <div className="flex items-center gap-2">
                <GraduationCap size={15} className="text-accent" />
                <p className="text-xs font-medium text-accent">带走这集的知识卡</p>
                <Link to="/career" className="ml-auto text-[10px] text-muted hover:text-cream">
                  去职业手册
                </Link>
              </div>
              <div className="mt-2 space-y-1.5">
                {knowledge.map((card) => (
                  <p key={card.id} className="text-[11px] leading-5 text-cream/75">
                    <span className="text-cream">{card.titleZh}</span>
                    <span className="text-muted"> — {card.summaryZh}</span>
                  </p>
                ))}
              </div>
            </div>
          ) : null}

          <div className="space-y-2 rounded-xl border border-line/70 bg-ink/40 p-3">
            {episode.characters.map((character) => (
              <div key={character.id} className="flex items-center gap-2">
                <span className="w-12 text-[11px] text-muted">{character.name}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-panel-2">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${trust[character.id] ?? 50}%`, background: character.color }}
                  />
                </div>
                <span className="w-7 text-right text-[10px] text-muted">{trust[character.id] ?? 50}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <Button variant="primary" onClick={onRestart}>
              <RotateCcw size={14} /> 再玩一次
            </Button>
            {nextEpisode && (
              <Link to={`/story/${nextEpisode.id}`}>
                <Button variant="secondary">
                  下一集：{nextEpisode.titleZh} <ArrowRight size={14} />
                </Button>
              </Link>
            )}
            <Link to="/story">
              <Button variant="ghost">换一集</Button>
            </Link>
            <Link to={`/drill?chapter=${episode.chapterId}&focus=1`}>
              <Button variant="ghost">去反射训练</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function Confetti() {
  const colors = ['#34d399', '#fbbf24', '#f9a8d4', '#c4b5fd', '#5eead4']
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      {Array.from({ length: 28 }).map((_, index) => (
        <span
          key={index}
          className="story-confetti absolute top-0 block h-2 w-1.5 rounded-sm"
          style={
            {
              left: `${(index * 37) % 100}%`,
              background: colors[index % colors.length],
              animationDelay: `${(index % 9) * 90}ms`,
              '--dx': `${((index % 7) - 3) * 22}px`,
              '--rot': `${180 + (index % 5) * 90}deg`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  )
}

function Metric({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-xl border border-line/70 bg-ink/40 p-2.5">
      <p className="text-[10px] text-muted">{label}</p>
      <p className={`mt-0.5 text-xl font-semibold ${tone}`}>{value}</p>
    </div>
  )
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(query.matches)
    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])
  return reduced
}

function useTypewriter(text: string, speed = 22) {
  const reduced = usePrefersReducedMotion()
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (reduced) {
      setCount(text.length)
      return
    }
    setCount(0)
    let index = 0
    const timer = window.setInterval(() => {
      index += 1
      setCount(Math.min(text.length, index))
      if (index >= text.length) window.clearInterval(timer)
    }, speed)
    return () => window.clearInterval(timer)
  }, [reduced, speed, text])

  return {
    shown: text.slice(0, count),
    done: count >= text.length,
    skip: () => setCount(text.length),
  }
}
