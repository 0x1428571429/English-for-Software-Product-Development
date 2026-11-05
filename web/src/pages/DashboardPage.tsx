import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BookOpenText,
  Flame,
  Headphones,
  Keyboard,
  MessagesSquare,
  Sparkles,
  Target,
  Timer,
} from 'lucide-react'
import { useCorpus } from '../data/CorpusContext'
import { useProgressStore } from '../store/useProgressStore'
import { useSettingsStore } from '../store/useSettingsStore'
import { countDue, countNew, countWeak } from '../lib/session'
import { accuracy, chapterMastery, percent, reactionMedian, todayStat } from '../lib/stats'
import { formatMs } from '../lib/textMatch'
import { Badge } from '../components/ui/Badge'
import { ProgressRing } from '../components/ui/ProgressRing'
import { Button } from '../components/ui/Button'

export function DashboardPage() {
  const { corpus, index, loading } = useCorpus()
  const progress = useProgressStore((state) => state.cards)
  const daily = useProgressStore((state) => state.daily)
  const streak = useProgressStore((state) => state.streak)
  const settings = useSettingsStore()

  const cards = index?.allCards ?? []
  const stat = todayStat(daily)
  const due = useMemo(() => countDue(cards, progress), [cards, progress])
  const fresh = useMemo(() => countNew(cards, progress), [cards, progress])
  const weak = useMemo(() => countWeak(cards, progress), [cards, progress])
  const mastery = useMemo(
    () => (corpus ? chapterMastery(corpus.chapters, cards, progress) : []),
    [corpus, cards, progress],
  )
  const goalProgress = Math.min(1, stat.reviews / Math.max(1, settings.dailyGoal))

  if (loading || !corpus || !index) {
    return <div className="py-24 text-center text-muted">正在加载语料…</div>
  }

  const today = new Date()
  const dateLabel = today.toLocaleDateString('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-muted">{dateLabel}</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-cream md:text-4xl">
            今天，练出第一反应。
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
            看到中文场景，先大声说出英文，再揭示答案。5 秒内说出来才算真正「下意识」。
            <span className="mt-1 block text-xs text-muted/80">
              每天一组；统计页会自动比较同一张卡的第一次和最近一次，记录你有没有变快。
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted">
          <Flame size={16} className="text-warn" />
          连续 <span className="font-semibold text-cream">{streak.current}</span> 天
          {streak.longest > 0 && <span className="text-xs">（最长 {streak.longest} 天）</span>}
        </div>
      </section>

      <section className="card-surface grid gap-5 p-5 md:grid-cols-[1.4fr_1fr] md:p-6">
        <div className="flex flex-col justify-between gap-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="accent">今日</Badge>
            <Badge>{stat.reviews} 张已复习</Badge>
            <Badge tone={due > 0 ? 'warn' : 'neutral'}>{due} 张到期</Badge>
            <Badge tone="muted">{fresh} 张新卡</Badge>
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-cream md:text-3xl">
              {due > 0 ? `${due} 张卡在等你` : stat.reviews > 0 ? '今天的复习已完成' : '从 20 张开始'}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              {due > 0
                ? '先处理到期卡，再引入新卡。连续 3 次想不起来会自动进入弱项。'
                : '混合对话、表达和词汇，按 FSRS 安排复习节奏。'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary" size="lg" onClick={() => { window.location.hash = '#/drill?focus=1' }}>
              <Sparkles size={18} />
              开始反射训练
              <ArrowRight size={16} />
            </Button>
            <Link
              to="/settings"
              className="text-sm text-muted underline-offset-4 hover:text-cream hover:underline"
            >
              调整每日目标与计时
            </Link>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 rounded-2xl border border-line/70 bg-ink/40 p-4 md:flex-col md:items-center md:justify-center">
          <ProgressRing value={goalProgress} size={104} stroke={8}>
            <div className="text-center">
              <p className="text-2xl font-semibold text-cream">{stat.reviews}</p>
              <p className="text-xs text-muted">/ {settings.dailyGoal} 张</p>
            </div>
          </ProgressRing>
          <div className="space-y-1 text-xs text-muted md:text-center">
            <p>
              今日正确率 <span className="text-cream">{stat.reviews ? percent(accuracy(stat)) : '—'}</span>
            </p>
            <p>
              中位反应 <span className="text-cream">{stat.reviews ? formatMs(reactionMedian(stat)) : '—'}</span>
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ModeCard
          to="/typing"
          icon={Keyboard}
          title="打字 · 填字"
          description="挖空补关键词，或整句默写；拼出来才记得住"
          meta="边打边记"
        />
        <ModeCard
          to="/scenario"
          icon={MessagesSquare}
          title="场景 → 表达"
          description="看中文工作场景，选最地道的一句"
          meta={`${corpus.report.scenarios} 个场景`}
        />
        <ModeCard
          to="/dialogue"
          icon={BookOpenText}
          title="对话角色扮演"
          description="按章节练完整对话，隐藏你的台词"
          meta={`${corpus.chapters.length} 章`}
        />
        <ModeCard
          to="/listen"
          icon={Headphones}
          title="听力与发音"
          description="听写、发音表、易错表达纠错"
          meta={`${corpus.report.pronunciation} 个易读错词`}
        />
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between">
          <div>
            <h2 className="text-lg font-semibold text-cream">按章节练</h2>
            <p className="text-xs text-muted">掌握度 = 覆盖 × 正确率 × 秒答率</p>
          </div>
          <Link to="/library" className="text-sm text-muted hover:text-cream">
            全部章节 →
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {mastery.slice(0, 6).map((item) => (
            <Link
              key={item.chapterId}
              to={`/library/${item.chapterId}`}
              className="card-surface group p-4 transition-colors hover:border-accent/40"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-cream">{item.titleZh}</p>
                  <p className="mt-1 text-xs text-muted">
                    {item.studied}/{item.total} 张 · 正确率 {item.studied ? percent(item.accuracy) : '—'}
                  </p>
                </div>
                <ProgressRing value={item.mastery} size={44} stroke={4}>
                  <span className="text-2xs text-cream">{Math.round(item.mastery * 100)}</span>
                </ProgressRing>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <MiniStat icon={Target} label="今日新卡" value={`${stat.newCards}`} hint={`上限 ${settings.newCardsPerDay}`} />
        <MiniStat icon={Timer} label="今日中位反应" value={stat.reviews ? formatMs(reactionMedian(stat)) : '—'} hint="先开口再揭示" />
        <MiniStat
          icon={Flame}
          label="弱项卡片"
          value={`${weak}`}
          hint={weak ? '去反射训练里专项突破' : '暂时没有'}
        />
      </section>

      <p className="pb-2 text-center text-xs text-muted">
        语料 {corpus.report.cards} 张卡 · {corpus.report.dialogueLines} 句对话 · {corpus.report.expressions} 个表达 ·
        内容版本 {corpus.contentVersion}
      </p>
    </div>
  )
}

function ModeCard({
  to,
  icon: Icon,
  title,
  description,
  meta,
}: {
  to: string
  icon: typeof Sparkles
  title: string
  description: string
  meta: string
}) {
  return (
    <Link to={to} className="card-surface group p-4 transition-colors hover:border-accent/40">
      <div className="flex items-start justify-between">
        <span className="rounded-xl border border-line bg-panel-2 p-2 text-accent">
          <Icon size={18} />
        </span>
        <span className="text-xs text-muted">{meta}</span>
      </div>
      <h3 className="mt-3 text-sm font-medium text-cream">{title}</h3>
      <p className="mt-1 text-xs leading-5 text-muted">{description}</p>
    </Link>
  )
}

function MiniStat({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Target
  label: string
  value: string
  hint: string
}) {
  return (
    <div className="card-surface flex items-center gap-3 p-4">
      <span className="rounded-lg border border-line bg-panel-2 p-2 text-muted">
        <Icon size={16} />
      </span>
      <div>
        <p className="text-xs text-muted">{label}</p>
        <p className="text-lg font-semibold text-cream">{value}</p>
        <p className="text-2xs text-muted">{hint}</p>
      </div>
    </div>
  )
}
