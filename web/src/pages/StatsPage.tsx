import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Flame, Target, Timer, TrendingUp } from 'lucide-react'
import { useCorpus } from '../data/CorpusContext'
import { useProgressStore } from '../store/useProgressStore'
import { chapterMastery, heatmapWeeks, lastNDays, learningExperiment, median, percent } from '../lib/stats'
import { formatMs } from '../lib/textMatch'
import { Badge } from '../components/ui/Badge'

const HEAT_COLORS = ['bg-panel-2', 'bg-accent/20', 'bg-accent/40', 'bg-accent/60', 'bg-accent']

export function StatsPage() {
  const { corpus, index, loading } = useCorpus()
  const progress = useProgressStore((state) => state.cards)
  const daily = useProgressStore((state) => state.daily)
  const streak = useProgressStore((state) => state.streak)

  const days = useMemo(() => lastNDays(30, daily), [daily])
  const weeks = useMemo(() => heatmapWeeks(12, daily), [daily])
  const mastery = useMemo(
    () => (corpus && index ? chapterMastery(corpus.chapters, index.allCards, progress) : []),
    [corpus, index, progress],
  )
  const experiment = useMemo(() => learningExperiment(progress), [progress])

  if (loading || !corpus || !index) {
    return <div className="py-24 text-center text-muted">正在加载语料…</div>
  }

  const totalReviews = Object.values(progress).reduce((sum, item) => sum + item.total, 0)
  const totalCorrect = Object.values(progress).reduce((sum, item) => sum + item.correct, 0)
  const mature = Object.values(progress).filter((item) => item.fsrs.state === 2 && item.fsrs.stability >= 21).length
  const weak = Object.values(progress).filter((item) => item.lapses >= 3 || item.lastRating <= 2).length
  const allDurations = days.flatMap((day) => day.stat.durations)

  const reviewSeries = days.map((day) => ({
    date: day.date.slice(5),
    reviews: day.stat.reviews,
    correct: day.stat.correct,
    medianMs: day.stat.durations.length ? Math.round(median(day.stat.durations)) : 0,
  }))

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-muted">Progress</p>
        <h1 className="mt-1 text-3xl font-semibold">统计</h1>
        <p className="mt-2 text-sm text-muted">看趋势，不看焦虑。重点盯「中位反应时间」和「秒答率」。</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={Flame} label="连续天数" value={`${streak.current}`} hint={`最长 ${streak.longest} 天`} />
        <StatCard icon={Target} label="累计复习" value={`${totalReviews}`} hint={totalReviews ? `正确率 ${percent(totalCorrect / totalReviews)}` : '还没有记录'} />
        <StatCard icon={Timer} label="30 天中位反应" value={allDurations.length ? formatMs(median(allDurations)) : '—'} hint="越快越接近下意识" />
        <StatCard icon={TrendingUp} label="已掌握卡片" value={`${mature}`} hint={`${weak} 张弱项`} />
      </div>

      <section className="card-surface p-4 md:p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-cream">近 30 天复习量</h2>
          <Badge tone="muted">{totalReviews} 次累计</Badge>
        </div>
        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={reviewSeries} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="var(--color-line)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: 'var(--color-muted)', fontSize: 12 }} tickLine={false} axisLine={false} interval={4} />
              <YAxis tick={{ fill: 'var(--color-muted)', fontSize: 12 }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: 'var(--color-panel)', border: '1px solid var(--color-line)', borderRadius: 12, color: 'var(--color-cream)' }}
                labelStyle={{ color: 'var(--color-muted)' }}
              />
              <Bar dataKey="reviews" name="复习" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="card-surface p-4 md:p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-cream">中位反应时间</h2>
          <Badge tone="muted">毫秒</Badge>
        </div>
        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={reviewSeries} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="var(--color-line)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: 'var(--color-muted)', fontSize: 12 }} tickLine={false} axisLine={false} interval={4} />
              <YAxis tick={{ fill: 'var(--color-muted)', fontSize: 12 }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: 'var(--color-panel)', border: '1px solid var(--color-line)', borderRadius: 12, color: 'var(--color-cream)' }}
                labelStyle={{ color: 'var(--color-muted)' }}
                formatter={(value) => [formatMs(Number(value)), '中位反应']}
              />
              <Line type="monotone" dataKey="medianMs" stroke="var(--color-accent)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section id="experiment" className="card-surface p-4 md:p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="text-sm font-medium text-cream">训练实验 · 同一张卡前后对比</h2>
            <p className="mt-0.5 text-xs text-muted">
              第一次作答 vs 最近一次；至少复习 2 次才计入。单组前后测，看的是同一批表达有没有变快、变准。
            </p>
          </div>
          <Badge tone={experiment.cards >= 3 ? 'accent' : 'muted'}>{experiment.cards} 张卡片</Badge>
        </div>
        {experiment.cards < 3 ? (
          <p className="mt-4 rounded-xl border border-line bg-panel-2/40 p-4 text-xs leading-5 text-muted">
            再复习几张卡片，这里会自动比较「第一次」和「最近一次」的反应时间与正确率。每次复习都会记录反应时间，不需要额外做测试。
          </p>
        ) : (
          <>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <ExperimentMetric label="首次中位反应" value={formatMs(experiment.firstMedianMs ?? 0)} />
              <ExperimentMetric
                label="最近中位反应"
                value={formatMs(experiment.recentMedianMs ?? 0)}
                hint={
                  experiment.speedGain != null
                    ? `${experiment.speedGain >= 0 ? '快了' : '慢了'} ${Math.abs(Math.round(experiment.speedGain * 100))}%`
                    : undefined
                }
              />
              <ExperimentMetric label="首次正确率" value={percent(experiment.firstAccuracy ?? 0)} />
              <ExperimentMetric
                label="最近正确率"
                value={percent(experiment.recentAccuracy ?? 0)}
                hint={`秒答率 ${percent(experiment.fastRate ?? 0)}`}
              />
            </div>
            <p className="mt-3 text-xs leading-5 text-muted">
              这是单组前后测，不是随机对照实验；练习效应会让结果偏乐观。但它能直接回答训练目标：同一个中文场景，现在是不是更快说对。
            </p>
          </>
        )}
      </section>

      <section className="card-surface p-4 md:p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-cream">12 周热力图</h2>
          <Badge tone="muted">{streak.current} 天连续</Badge>
        </div>
        <div className="overflow-x-auto pb-2">
          <div className="flex gap-1">
            {weeks.map((week) => (
              <div key={week[0].date} className="flex flex-col gap-1">
                {week.map((day) => {
                  const level = day.count === 0 ? 0 : day.count < 5 ? 1 : day.count < 10 ? 2 : day.count < 20 ? 3 : 4
                  return (
                    <div
                      key={day.date}
                      title={`${day.date} · ${day.count} 次`}
                      className={`h-3 w-3 rounded-sm ${HEAT_COLORS[level]}`}
                    />
                  )
                })}
              </div>
            ))}
          </div>
        </div>
        <div className="mt-2 flex items-center gap-2 text-2xs text-muted">
          <span>少</span>
          {HEAT_COLORS.map((color) => (
            <span key={color} className={`h-3 w-3 rounded-sm ${color}`} />
          ))}
          <span>多</span>
        </div>
      </section>

      <section className="card-surface p-4 md:p-5">
        <h2 className="text-sm font-medium text-cream">章节掌握度</h2>
        <p className="mt-0.5 text-xs text-muted">覆盖 × 正确率 × 秒答率</p>
        <div className="mt-4 space-y-2.5">
          {mastery.map((item) => (
            <div key={item.chapterId} className="flex items-center gap-3">
              <span className="w-28 shrink-0 truncate text-xs text-muted">{item.titleZh}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-panel-2">
                <div className="h-full rounded-full bg-accent" style={{ width: `${item.mastery * 100}%` }} />
              </div>
              <span className="w-10 text-right text-xs text-cream">{Math.round(item.mastery * 100)}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function ExperimentMetric({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint?: string
}) {
  return (
    <div className="rounded-xl border border-line bg-panel-2/40 p-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-xl font-semibold text-cream">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-accent">{hint}</p>}
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Flame
  label: string
  value: string
  hint: string
}) {
  return (
    <div className="card-surface p-4">
      <div className="flex items-center gap-2 text-muted">
        <Icon size={15} />
        <span className="text-xs">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-semibold text-cream">{value}</p>
      <p className="mt-0.5 text-xs text-muted">{hint}</p>
    </div>
  )
}
