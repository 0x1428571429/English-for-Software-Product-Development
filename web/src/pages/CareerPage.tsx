import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  BookOpenCheck,
  Check,
  ChevronRight,
  Clipboard,
  GraduationCap,
  Lock,
  MessageSquareText,
  Sparkles,
  Volume2,
} from 'lucide-react'
import {
  STORY_EPISODES,
  type StoryEpisode,
  type StoryKnowledge,
} from '../data/story'
import {
  REPORTING_FRAMEWORKS,
  REPORTING_SCENARIOS,
  reportingFramework,
} from '../data/reporting'
import { useStoryStore } from '../store/useStoryStore'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { speak } from '../lib/speech'

type Tab = 'handbook' | 'reporting'

interface KnowledgeEntry {
  card: StoryKnowledge
  episode: StoryEpisode
  unlocked: boolean
}

export function CareerPage() {
  const [params, setParams] = useSearchParams()
  const tab: Tab = params.get('tab') === 'reporting' ? 'reporting' : 'handbook'
  const records = useStoryStore((state) => state.records)
  const careerTrack = useStoryStore((state) => state.careerTrack)

  const entries = useMemo<KnowledgeEntry[]>(() => {
    return STORY_EPISODES.flatMap((episode) =>
      (episode.knowledge ?? []).map((card) => ({
        card,
        episode,
        unlocked: Boolean(records[episode.id]),
      })),
    ).filter((entry) => !entry.card.track || entry.card.track === careerTrack)
  }, [careerTrack, records])

  const unlocked = entries.filter((entry) => entry.unlocked).length

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-2xl border border-line bg-panel p-5 md:p-7">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-accent/10 blur-3xl" />
        <div className="relative z-10">
          <Badge tone="accent">
            <GraduationCap size={12} /> Career · 职场能力
          </Badge>
          <h1 className="mt-3 text-3xl font-semibold text-cream">职业手册与汇报训练</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            剧情里遇到的专业知识，通关后会收进这里。汇报训练把「结论先行」拆成四段，
            填完就能得到一份可以直接说出口的英文汇报。
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-muted">
            <span className="rounded-full border border-line px-3 py-1">知识卡 {entries.length}</span>
            <span className="rounded-full border border-accent/30 px-3 py-1 text-accent">
              已解锁 {unlocked}
            </span>
            <span className="rounded-full border border-line px-3 py-1">
              {careerTrack ? (careerTrack === 'frontend' ? '前端路径' : '全栈路径') : '尚未选择路径'}
            </span>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap gap-1.5">
        <TabButton active={tab === 'handbook'} onClick={() => setParams({ tab: 'handbook' })} icon={BookOpenCheck}>
          职业手册
        </TabButton>
        <TabButton active={tab === 'reporting'} onClick={() => setParams({ tab: 'reporting' })} icon={MessageSquareText}>
          汇报训练
        </TabButton>
        <Link to="/story" className="ml-auto self-center text-[11px] text-muted hover:text-cream">
          回剧情模式 <ChevronRight size={12} className="inline" />
        </Link>
      </div>

      {tab === 'handbook' ? (
        <Handbook entries={entries} />
      ) : (
        <ReportingLab />
      )}
    </div>
  )
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean
  onClick: () => void
  icon: typeof BookOpenCheck
  children: string
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors ${
        active
          ? 'border-accent/50 bg-accent/10 text-accent'
          : 'border-line text-muted hover:text-cream'
      }`}
    >
      <Icon size={14} /> {children}
    </button>
  )
}

function Handbook({ entries }: { entries: KnowledgeEntry[] }) {
  if (entries.length === 0) {
    return (
      <section className="card-surface grid place-items-center px-4 py-16 text-center">
        <GraduationCap size={26} className="text-muted" />
        <p className="mt-3 text-sm font-medium text-cream">还没有知识卡</p>
        <p className="mt-1 max-w-md text-xs leading-5 text-muted">
          先选择 VP 路径，再打通对应的专精剧集。管理线、暗线和 VP 剧集里都有职业知识卡。
        </p>
        <Link to="/story" className="mt-4">
          <Button variant="primary" size="sm">去剧情模式</Button>
        </Link>
      </section>
    )
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {entries.map(({ card, episode, unlocked }) => (
        <article
          key={card.id}
          className={`card-surface p-4 ${unlocked ? '' : 'opacity-75'}`}
        >
          <div className="flex items-start gap-3">
            <span
              className={`mt-0.5 rounded-lg border p-1.5 ${
                unlocked ? 'border-accent/30 bg-accent/10 text-accent' : 'border-line bg-ink/40 text-muted'
              }`}
            >
              {unlocked ? <BookOpenCheck size={14} /> : <Lock size={14} />}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-2">
                <h2 className="text-sm font-medium text-cream">{card.titleZh}</h2>
                <span className="text-[9px] uppercase tracking-[0.14em] text-muted">{card.titleEn}</span>
              </div>
              <p className="mt-1 text-[11px] leading-5 text-muted">{card.summaryZh}</p>
              {card.track && (
                <span className="mt-1 inline-block rounded-full border border-line px-2 py-0.5 text-[9px] text-muted">
                  {card.track === 'frontend' ? '前端路径' : '全栈路径'}
                </span>
              )}
              {unlocked ? (
                <ul className="mt-2 space-y-1">
                  {card.pointsZh.map((point) => (
                    <li key={point} className="flex gap-1.5 text-[11px] leading-5 text-cream/75">
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent/70" />
                      {point}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 rounded-lg border border-line/60 bg-ink/40 px-2 py-1.5 text-[10px] leading-4 text-muted">
                  通关《{episode.titleZh}》解锁。{card.pointsZh.length} 个要点。
                </p>
              )}
              <p className="mt-2 text-[10px] text-muted">
                来源：EP.{String(episode.order).padStart(2, '0')} {episode.titleZh}
              </p>
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}

function ReportingLab() {
  const [scenarioId, setScenarioId] = useState(REPORTING_SCENARIOS[0].id)
  const scenario = REPORTING_SCENARIOS.find((item) => item.id === scenarioId) ?? REPORTING_SCENARIOS[0]
  const [values, setValues] = useState<Record<string, string>>({})
  const [copied, setCopied] = useState(false)
  const frameworkId: Record<string, string> = {
    'weekly-update': 'bluf',
    'incident-review': 'incident',
    'promotion-case': 'star',
    'budget-ask': 'scqa',
  }
  const framework = reportingFramework(frameworkId[scenario.id] ?? 'bluf')

  const generated = scenario.sections
    .map((section) => `${section.labelEn}: ${values[section.key]?.trim() || section.exampleEn}`)
    .join('\n')

  const fillExamples = () => {
    setValues(
      Object.fromEntries(scenario.sections.map((section) => [section.key, section.exampleEn])),
    )
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(generated)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="space-y-4">
      <section className="card-surface p-4">
        <div className="flex flex-wrap items-center gap-2">
          <MessageSquareText size={15} className="text-accent" />
          <h2 className="text-sm font-medium text-cream">选一个真实汇报场景</h2>
          <span className="text-[11px] text-muted">先填中文要点，再照着英文骨架说</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {REPORTING_SCENARIOS.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setScenarioId(item.id)
                setValues({})
                setCopied(false)
              }}
              className={`rounded-full border px-3 py-1.5 text-[11px] transition-colors ${
                item.id === scenario.id
                  ? 'border-accent/50 bg-accent/10 text-accent'
                  : 'border-line text-muted hover:text-cream'
              }`}
            >
              {item.titleZh}
            </button>
          ))}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[1.15fr_1fr]">
        <section className="card-surface p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="text-lg font-medium text-cream">{scenario.titleZh}</h2>
              <p className="text-[10px] uppercase tracking-[0.16em] text-muted">{scenario.titleEn}</p>
            </div>
            <Badge tone="accent">{scenario.frameworkZh}</Badge>
          </div>
          <p className="mt-2 text-[11px] leading-5 text-muted">{scenario.situationZh}</p>
          <div className="mt-2 grid gap-1.5 text-[11px] text-muted sm:grid-cols-2">
            <p><span className="text-cream/70">听众：</span>{scenario.audienceZh}</p>
            <p><span className="text-cream/70">目标：</span>{scenario.goalZh}</p>
          </div>

          <div className="mt-4 space-y-3">
            {scenario.sections.map((section, index) => (
              <label key={section.key} className="block">
                <span className="flex items-center gap-2 text-[11px] text-cream/80">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full border border-line text-[9px] text-muted">
                    {index + 1}
                  </span>
                  {section.labelZh}
                  <span className="text-[9px] uppercase tracking-[0.12em] text-muted">{section.labelEn}</span>
                </span>
                <textarea
                  value={values[section.key] ?? ''}
                  onChange={(event) =>
                    setValues((current) => ({ ...current, [section.key]: event.target.value }))
                  }
                  placeholder={section.placeholderZh}
                  rows={2}
                  className="mt-1 w-full resize-none rounded-lg border border-line bg-ink/40 px-3 py-2 text-xs leading-5 text-cream outline-none placeholder:text-muted/60 focus:border-accent/50"
                />
              </label>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={fillExamples}>
              <Sparkles size={13} /> 填入示例
            </Button>
            <Button variant="ghost" size="sm" onClick={() => void speak(generated)}>
              <Volume2 size={13} /> 朗读
            </Button>
            <Button variant="ghost" size="sm" onClick={() => void copy()}>
              {copied ? <Check size={13} /> : <Clipboard size={13} />}
              {copied ? '已复制' : '复制英文'}
            </Button>
          </div>
        </section>

        <div className="space-y-4">
          <section className="card-surface p-4">
            <div className="flex items-center gap-2 text-accent">
              <Clipboard size={15} />
              <h2 className="text-sm font-medium text-cream">你的英文汇报</h2>
            </div>
            <pre className="mt-2 whitespace-pre-wrap rounded-xl border border-line/70 bg-ink/50 p-3 font-sans text-xs leading-6 text-cream/85">
              {generated}
            </pre>
            <p className="mt-2 text-[10px] leading-4 text-muted">
              括号里的内容不会自动变成英文。先用中文把逻辑填清楚，再换英文关键词；
              这份骨架保证你永远不会从「事情是这样的」开始。
            </p>
          </section>

          <section className="card-surface p-4">
            <h2 className="text-sm font-medium text-cream">这一套的说法</h2>
            <div className="mt-2 space-y-2">
              {scenario.phrases.map((phrase) => (
                <div key={phrase.en} className="rounded-lg border border-line/60 bg-ink/40 p-2.5">
                  <div className="flex items-start gap-2">
                    <p className="min-w-0 flex-1 text-[11px] font-medium leading-5 text-cream">{phrase.en}</p>
                    <button
                      onClick={() => void speak(phrase.en)}
                      className="shrink-0 rounded-full border border-line p-1 text-muted hover:text-accent"
                      aria-label="朗读"
                    >
                      <Volume2 size={11} />
                    </button>
                  </div>
                  <p className="mt-0.5 text-[10px] leading-4 text-muted">{phrase.zh}</p>
                  <p className="mt-1 text-[10px] leading-4 text-accent/70">{phrase.noteZh}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {REPORTING_FRAMEWORKS.map((item) => (
          <div key={item.id} className="card-surface p-3">
            <div className="flex items-center gap-2 text-accent">
              <GraduationCap size={14} />
              <h3 className="text-xs font-medium text-cream">{item.titleZh}</h3>
            </div>
            <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-muted">{item.titleEn}</p>
            <p className="mt-1.5 text-[11px] leading-4 text-cream/75">{item.formulaZh}</p>
            <p className="mt-1 text-[10px] leading-4 text-muted">{item.descriptionZh}</p>
            <p className="mt-1.5 text-[10px] leading-4 text-accent/70">适合：{item.bestForZh}</p>
          </div>
        ))}
      </section>

      {framework && (
        <p className="text-center text-[10px] text-muted">
          当前场景使用：{framework.titleZh} · {framework.formulaZh}
        </p>
      )}
    </div>
  )
}
