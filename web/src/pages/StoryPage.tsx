import { Link } from 'react-router-dom'
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  BookOpenCheck,
  Briefcase,
  CalendarCheck,
  Clapperboard,
  Flame,
  GraduationCap,
  Heart,
  Lock,
  MessagesSquare,
  Sparkles,
  Target,
  Trophy,
  Users,
} from 'lucide-react'
import {
  CAREER_RANKS,
  CAREER_TRACKS,
  STORY_ARCS,
  STORY_CHARACTERS,
  STORY_EPISODES,
  careerProgress,
  careerRank,
  episodeChoiceCount,
  episodeLock,
  episodesForArc,
  nextCareerRank,
  type StoryCharacter,
  type StoryEpisode,
  type StoryProgressView,
} from '../data/story'
import type { StoryRecord } from '../store/useStoryStore'
import { useStoryStore } from '../store/useStoryStore'
import { StoryBackdrop } from '../components/story/StoryBackdrop'
import { StoryPortrait } from '../components/story/StoryPortrait'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'

const QUALITY_LABEL = { good: '好结局', ok: '普通结局', bad: '坏结局' } as const

function todayKey(): string {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function StoryPage() {
  const records = useStoryStore((state) => state.records)
  const careerPoints = useStoryStore((state) => state.careerPoints)
  const rankLevel = useStoryStore((state) => state.rankLevel)
  const checkIns = useStoryStore((state) => state.checkIns)
  const streak = useStoryStore((state) => state.streak)
  const lastCheckIn = useStoryStore((state) => state.lastCheckIn)
  const checkIn = useStoryStore((state) => state.checkIn)
  const careerTrack = useStoryStore((state) => state.careerTrack)
  const setCareerTrack = useStoryStore((state) => state.setCareerTrack)
  const insight = useStoryStore((state) => state.insight)
  const firedCount = useStoryStore((state) => state.firedCount)

  const completed = Object.keys(records).length
  const completedIds = Object.keys(records)
  const progressView = { rankLevel, careerPoints, careerTrack, completedIds }
  const track = careerTrack ?? 'frontend'
  const rank = careerRank(rankLevel, track)
  const nextRank = nextCareerRank(rankLevel)
  const progress = careerProgress(careerPoints, rankLevel)
  const checkedToday = lastCheckIn === todayKey() || Boolean(checkIns[todayKey()])
  const visibleEpisodes = STORY_EPISODES.filter(
    (episode) => !careerTrack || !episode.track || episode.track === careerTrack,
  )
  const nextPromotion = visibleEpisodes.find(
    (episode) => episode.promotionTo && episode.promotionTo > rankLevel,
  )
  const nextPromotionRank = nextPromotion?.promotionTo
    ? careerRank(nextPromotion.promotionTo, track)
    : null
  const trackLocked = STORY_EPISODES.some((episode) => episode.track && records[episode.id])
  const knowledgeCount = visibleEpisodes.reduce(
    (sum, episode) => sum + (records[episode.id] ? (episode.knowledge?.length ?? 0) : 0),
    0,
  )

  const nextEpisode =
    visibleEpisodes.find(
      (episode) => !records[episode.id] && !episodeLock(episode, progressView),
    ) ?? visibleEpisodes[visibleEpisodes.length - 1]

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl border border-line bg-panel">
        <StoryBackdrop scene="standup" />
        <div className="relative z-10 px-5 py-8 md:px-8 md:py-10">
          <Badge tone="accent">
            <Clapperboard size={12} /> 剧情模式 · 职场 galgame
          </Badge>
          <h1 className="mt-4 max-w-2xl text-3xl font-semibold leading-tight text-cream md:text-4xl">
            从实习生到技术 VP，一路<span className="text-accent">狗血</span>。
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
            站会、PR、QA、on-call、答辩、裁员、办公室恋情、机密文件、董事会、跳槽终面。
            每句话都要用英文说，每个选择都会改变他们对你的信任。选错不会立刻 game over，
            但有些门，走出去就回不来了。
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-muted">
            <span className="rounded-full border border-line bg-ink/50 px-3 py-1">
              {STORY_EPISODES.length} 集 · {STORY_ARCS.length} 条剧情线
            </span>
            <span className="rounded-full border border-line bg-ink/50 px-3 py-1">
              已通关 {completed}/{visibleEpisodes.length}
            </span>
            <span className="rounded-full border border-line bg-ink/50 px-3 py-1">
              绩效 {careerPoints} 点
            </span>
            <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-accent">
              认知 {insight}
            </span>
            {firedCount > 0 && (
              <span className="rounded-full border border-danger/40 bg-danger/10 px-3 py-1 text-danger">
                被开除 {firedCount} 次
              </span>
            )}
            <Link to={`/story/${nextEpisode.id}`}>
              <Button variant="primary" size="sm">
                {completed === 0 ? '开始第一集' : '继续剧情'} <ArrowRight size={14} />
              </Button>
            </Link>
          </div>
        </div>
        <div className="pointer-events-none absolute -right-8 bottom-0 hidden h-[110%] items-end gap-0 md:flex">
          {[STORY_CHARACTERS.alex, STORY_CHARACTERS.sarah, STORY_CHARACTERS.diana].map((character, index) => (
            <div
              key={character.id}
              className="h-[72%] w-32 lg:w-36"
              style={{ transform: `translateY(${index === 1 ? 0 : 8}%)` }}
            >
              <StoryPortrait character={character} mood={index === 1 ? 'smug' : 'neutral'} size="stage" />
            </div>
          ))}
        </div>
      </section>

      <section className="card-surface p-4 md:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 rounded-xl border border-accent/30 bg-accent/10 p-2 text-accent">
              <GraduationCap size={18} />
            </span>
            <div>
              <h2 className="text-sm font-medium text-cream">
                {careerTrack ? '你的 VP 路径' : '先选一条路：前端，还是全栈？'}
              </h2>
              <p className="mt-1 max-w-2xl text-xs leading-5 text-muted">
                {careerTrack
                  ? '路径决定专精剧集、职级称谓和最后的 VP 挑战。进入专精线之后不能改。'
                  : '两条路都能坐到 VP，但考试内容不同。前端考平台与体验，全栈考端到端与稳定性。选好再开始，专精剧集之后锁定。'}
              </p>
            </div>
          </div>
          {careerTrack && (
            <span
              className="rounded-full border px-3 py-1 text-[11px]"
              style={{
                borderColor: CAREER_TRACKS.find((item) => item.id === careerTrack)?.color,
                color: CAREER_TRACKS.find((item) => item.id === careerTrack)?.color,
              }}
            >
              {CAREER_TRACKS.find((item) => item.id === careerTrack)?.titleZh}
            </span>
          )}
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {CAREER_TRACKS.map((item) => {
            const active = careerTrack === item.id
            const locked = Boolean(careerTrack && careerTrack !== item.id && trackLocked)
            return (
              <div
                key={item.id}
                className={`rounded-xl border p-4 transition-colors ${
                  active ? 'bg-ink/50' : 'border-line bg-ink/25'
                }`}
                style={active ? { borderColor: item.color } : undefined}
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-medium text-cream">{item.titleZh}</h3>
                  <span className="text-[10px] uppercase tracking-[0.16em] text-muted">
                    {item.titleEn}
                  </span>
                </div>
                <p className="mt-1 text-[11px] leading-5 text-muted">{item.taglineZh}</p>
                <p className="mt-1.5 text-[11px] leading-5 text-cream/65">{item.descriptionZh}</p>
                <div className="mt-3 flex items-center gap-2">
                  {active ? (
                    <Badge tone="accent">
                      <BadgeCheck size={12} /> 当前路径
                    </Badge>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={locked}
                      onClick={() => setCareerTrack(item.id)}
                    >
                      {locked ? '已锁定' : `选择${item.titleZh}`}
                    </Button>
                  )}
                  {locked && (
                    <span className="text-[10px] text-muted">已进入另一条专精线</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="grid gap-3 lg:grid-cols-[1.25fr_1fr_1fr]">
        <div className="card-surface p-4">
          <div className="flex items-center gap-2 text-accent">
            <Briefcase size={15} />
            <h2 className="text-sm font-medium text-cream">你的职场档案</h2>
          </div>
          <div className="mt-3 flex items-end justify-between gap-3">
            <div>
              <p className="text-2xl font-semibold text-cream">{rank.titleZh}</p>
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted">{rank.titleEn}</p>
            </div>
            <p className="font-mono text-lg text-accent">{rank.salary}<span className="text-[10px] text-muted">/月</span></p>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-panel-2">
            <div className="h-full rounded-full bg-accent transition-all duration-700" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-2 text-[11px] leading-5 text-muted">
            {nextRank
              ? `下一级：${careerRank(nextRank.level, track).titleZh}（${nextRank.salary}/月）。绩效点 ${careerPoints}/${nextRank.minPoints}，晋升靠剧情挑战。`
              : '你已到本季最高职级。猎头应该很快会来找你。'}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 text-accent">
              认知 {insight}
            </span>
            <Link to="/career" className="rounded-full border border-line px-2.5 py-1 text-muted hover:text-cream">
              职业手册 {knowledgeCount > 0 ? `· 已解锁 ${knowledgeCount}` : ''}
            </Link>
          </div>
        </div>

        <div className="card-surface p-4">
          <div className="flex items-center gap-2 text-warn">
            <Trophy size={15} />
            <h2 className="text-sm font-medium text-cream">晋升挑战</h2>
          </div>
          <p className="mt-3 text-2xl font-semibold text-cream">
            {nextPromotionRank ? `下一站：${nextPromotionRank.titleZh}` : '技术 VP 已到手'}
          </p>
          <p className="mt-2 text-[11px] leading-5 text-muted">
            {nextPromotionRank
              ? `完成「${nextPromotion?.titleZh}」的挑战，晋升到 ${nextPromotionRank.titleZh}（${nextPromotionRank.salary}/月）。`
              : '跳槽线已解锁。终面只看一件事：你值不值这个价。'}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {CAREER_RANKS.map((item) => (
              <span
                key={item.level}
                className={`rounded-full border px-2 py-0.5 text-[10px] ${
                  item.level <= rank.level ? 'border-accent/30 text-accent' : 'border-line text-muted/60'
                }`}
              >
                {careerRank(item.level, track).titleZh}
              </span>
            ))}
          </div>
        </div>

        <div className="card-surface flex flex-col p-4">
          <div className="flex items-center gap-2 text-accent">
            <CalendarCheck size={15} />
            <h2 className="text-sm font-medium text-cream">今日打卡</h2>
          </div>
          <div className="mt-3 flex items-end justify-between">
            <div>
              <p className="text-2xl font-semibold text-cream">
                {streak}
                <span className="ml-1 text-xs font-normal text-muted">天连续</span>
              </p>
              <p className="mt-1 flex items-center gap-1 text-[11px] text-warn">
                <Flame size={12} /> 绝不错过两次
              </p>
            </div>
            {checkedToday ? (
              <Badge tone="accent">
                <BadgeCheck size={12} /> 已打卡
              </Badge>
            ) : (
              <Button variant="secondary" size="sm" onClick={() => checkIn()}>
                打卡
              </Button>
            )}
          </div>
          <p className="mt-3 text-[11px] leading-5 text-muted">
            今天只做一件小事：打开一集，把第一句英文说出口。2 分钟就算完成。
          </p>
        </div>
      </section>

      <section className="card-surface flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 rounded-xl border border-warn/30 bg-warn/10 p-2 text-warn">
            <Target size={18} />
          </span>
          <div>
            <h2 className="text-sm font-medium text-cream">本季主线：路径、认知与代价</h2>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-muted">
              晋升线 → 管理线 → 专精线 → VP，外加一条随时可能毁掉你的暗线。四条剧情线：晋升、管理、暗线、跳槽。
              好选择 +20，挑战通过再 +20；认知解锁更成熟的处理方式，重玩不重复刷分。
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Link to="/career">
                <Button variant="ghost" size="sm">
                  <BookOpenCheck size={13} /> 职业手册与汇报训练
                </Button>
              </Link>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 text-[11px] text-muted">
          <span className="rounded-full border border-line px-2.5 py-1">信任值</span>
          <ArrowRight size={12} />
          <span className="rounded-full border border-line px-2.5 py-1">挑战目标</span>
          <ArrowRight size={12} />
          <span className="rounded-full border border-warn/30 px-2.5 py-1 text-warn">升职或出局</span>
        </div>
      </section>

      {STORY_ARCS.map((arc) => {
        const episodes = episodesForArc(arc.id).filter(
          (episode) => !careerTrack || !episode.track || episode.track === careerTrack,
        )
        if (episodes.length === 0) return null
        const arcCompleted = episodes.filter((episode) => records[episode.id]).length
        return (
          <section key={arc.id} className="space-y-3">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div className="flex items-start gap-3">
                <span className="mt-1 h-2.5 w-2.5 rounded-full" style={{ background: arc.color }} />
                <div>
                  <div className="flex flex-wrap items-baseline gap-2">
                    <h2 className="text-lg font-semibold text-cream">{arc.titleZh}</h2>
                    <span className="text-[11px] uppercase tracking-[0.16em] text-muted">{arc.titleEn}</span>
                  </div>
                  <p className="text-xs text-muted">{arc.taglineZh}</p>
                </div>
              </div>
              <span className="text-[11px] text-muted">
                已通关 {arcCompleted}/{episodes.length}
              </span>
            </div>
            <p className="max-w-3xl text-xs leading-5 text-muted">{arc.descriptionZh}</p>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {episodes.map((episode) => (
                <EpisodeCard
                  key={episode.id}
                  episode={episode}
                  record={records[episode.id]}
                  progress={progressView}
                />
              ))}
            </div>
          </section>
        )
      })}

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Users size={16} className="text-accent" />
          <h2 className="text-lg font-semibold text-cream">固定角色</h2>
          <span className="text-[11px] text-muted">同一个世界，同一批人，每次都会记得你做过什么。</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Object.values(STORY_CHARACTERS).map((character) => (
            <CastCard key={character.id} character={character} />
          ))}
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <Rule
          icon={MessagesSquare}
          title="先听，再用英文选"
          body="对方的话有英文和中文；轮到你时，从三个英文回应里选一个。"
        />
        <Rule
          icon={Heart}
          title="信任值会变"
          body="每个选择都会影响 Alex、Sarah 他们对你的信任。结局由你的选择累积决定。"
        />
        <Rule
          icon={Trophy}
          title="三种结局 + 挑战"
          body="好、普通、坏结局。达成每集挑战才能拿到额外绩效，重玩可以试另一条路。"
        />
      </section>
    </div>
  )
}

function EpisodeCard({
  episode,
  record,
  progress,
}: {
  episode: StoryEpisode
  record?: StoryRecord
  progress: StoryProgressView
}) {
  const lock = episodeLock(episode, progress)
  const locked = Boolean(lock)
  const choiceCount = episodeChoiceCount(episode)
  const knowledgeCount =
    episode.knowledge?.filter(
      (card) => !card.track || card.track === progress.careerTrack,
    ).length ?? 0
  const promotion = episode.kind === 'promotion'
  const kindLabel =
    promotion ? '· PROMOTION' : episode.kind === 'interview' ? '· INTERVIEW' : episode.kind === 'romance' ? '· ROMANCE' : episode.kind === 'crisis' ? '· CRISIS' : ''
  const trackLabel = episode.track ? CAREER_TRACKS.find((item) => item.id === episode.track)?.titleZh : null

  const lockTitle = (() => {
    if (!lock) return ''
    if (lock.kind === 'track') {
      return lock.needsChoice ? '先选择 VP 路径' : `${CAREER_TRACKS.find((item) => item.id === lock.track)?.titleZh}专属`
    }
    if (lock.kind === 'rank') return `${lock.rank.titleZh} 解锁`
    if (lock.kind === 'points') return `还差 ${lock.missing} 绩效`
    if (lock.kind === 'track-episode') return '先完成专精剧集'
    return '先完成前置剧集'
  })()

  const lockBody = (() => {
    if (!lock) return ''
    if (lock.kind === 'track') {
      return lock.needsChoice
        ? '先在上方选择前端或全栈路径，再进入这条支线。'
        : '这条支线属于另一条 VP 路径。本季不开放。'
    }
    if (lock.kind === 'rank') return '先通过上一条剧情线的晋升挑战，再来这里。'
    if (lock.kind === 'points') return `再攒 ${lock.missing} 绩效点。先把前面的剧集打完。`
    if (lock.kind === 'track-episode') {
      return `先完成${CAREER_TRACKS.find((item) => item.id === lock.track)?.titleZh}的专精剧集，再来挑战 VP。`
    }
    return '先把前置剧集打通。'
  })()

  const body = (
    <div
      className={`group relative h-full overflow-hidden rounded-2xl border bg-panel transition-all ${
        locked
          ? 'border-line/60 opacity-80'
          : promotion
            ? 'border-warn/40 hover:-translate-y-0.5 hover:border-warn/70'
            : episode.kind === 'crisis'
              ? 'border-danger/40 hover:-translate-y-0.5 hover:border-danger/70'
              : 'border-line hover:-translate-y-0.5 hover:border-accent/40'
      }`}
    >
      <div className="relative h-44 overflow-hidden">
        <StoryBackdrop scene={episode.scene} />
        <div className="absolute inset-0 z-10 flex items-end justify-center gap-1">
          {episode.characters.slice(0, 3).map((character) => (
            <div key={character.id} className="h-36 w-24 translate-y-4">
              <StoryPortrait character={character} size="stage" />
            </div>
          ))}
        </div>
        <span className="absolute left-3 top-3 z-20 rounded-full border border-line bg-ink/70 px-2 py-0.5 text-[10px] uppercase tracking-widest text-muted">
          EP.{String(episode.order).padStart(2, '0')} {kindLabel}
        </span>
        {trackLabel && (
          <span className="absolute bottom-3 left-3 z-20 rounded-full border border-line bg-ink/80 px-2 py-0.5 text-[10px] text-cream/80">
            {trackLabel}
          </span>
        )}
        {locked && lock ? (
          <span className="absolute right-3 top-3 z-20 inline-flex items-center gap-1 rounded-full border border-line bg-ink/80 px-2 py-0.5 text-[10px] text-muted">
            <Lock size={10} /> {lockTitle}
          </span>
        ) : record ? (
          <span
            className={`absolute right-3 top-3 z-20 rounded-full border px-2 py-0.5 text-[10px] ${
              record.fired
                ? 'border-danger/50 bg-danger/20 text-danger'
                : record.endingId === 'good'
                  ? 'border-accent/40 bg-accent/15 text-accent'
                  : record.endingId === 'bad'
                    ? 'border-danger/40 bg-danger/15 text-danger'
                    : 'border-warn/40 bg-warn/15 text-warn'
            }`}
          >
            {record.fired ? '被开除' : (QUALITY_LABEL[record.endingId] ?? '已通关')}
          </span>
        ) : null}
      </div>
      <div className="relative z-20 space-y-2 border-t border-line/70 bg-panel/95 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-lg font-medium text-cream">{episode.titleZh}</h3>
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted">{episode.titleEn}</p>
          </div>
          {!locked && (
            <ArrowUpRight size={18} className="mt-1 shrink-0 text-muted transition-colors group-hover:text-accent" />
          )}
        </div>
        <p className="text-xs leading-5 text-muted">{episode.taglineZh}</p>
        <div className="rounded-lg border border-line/60 bg-ink/40 px-2.5 py-1.5">
          <p className="flex items-start gap-1.5 text-[11px] leading-4 text-cream/75">
            <Target size={12} className="mt-0.5 shrink-0 text-accent" />
            <span>{episode.challenge.zh}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-muted">
          <span className="inline-flex items-center gap-1">
            <Sparkles size={12} className="text-accent" /> {choiceCount} 个选择点
          </span>
          {knowledgeCount ? (
            <span className="inline-flex items-center gap-1">
              <GraduationCap size={12} className="text-accent" /> {knowledgeCount} 张知识卡
            </span>
          ) : null}
          {record?.challengePassed && (
            <span className="inline-flex items-center gap-1 text-accent">
              <BadgeCheck size={12} /> 挑战通过
            </span>
          )}
          {record && (
            <span className="ml-auto">
              最佳 {record.goodChoices}/{record.totalChoices} 好选择
            </span>
          )}
        </div>
      </div>
      {locked && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-2 bg-ink/70 px-4 text-center backdrop-blur-[2px]">
          <Lock size={22} className="text-muted" />
          <p className="text-sm font-medium text-cream">{lockTitle}</p>
          <p className="text-[11px] leading-5 text-muted">{lockBody}</p>
        </div>
      )}
    </div>
  )

  if (locked) return body
  return (
    <Link to={`/story/${episode.id}`} className="block h-full">
      {body}
    </Link>
  )
}

function CastCard({ character }: { character: StoryCharacter }) {
  return (
    <div className="card-surface flex gap-3 overflow-hidden p-3">
      <div className="h-24 w-16 shrink-0 self-end">
        <StoryPortrait character={character} mood="neutral" />
      </div>
      <div className="min-w-0">
        <div className="flex items-baseline gap-2">
          <h3 className="text-sm font-medium text-cream">{character.name}</h3>
          <span className="text-[10px] uppercase tracking-[0.14em] text-muted">{character.roleZh}</span>
        </div>
        <p className="mt-0.5 text-[11px] leading-4 text-accent/80">{character.taglineZh}</p>
        <p className="mt-1.5 text-[11px] leading-4 text-muted">{character.bioZh}</p>
      </div>
    </div>
  )
}

function Rule({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Heart
  title: string
  body: string
}) {
  return (
    <div className="card-surface p-4">
      <div className="flex items-center gap-2 text-accent">
        <Icon size={15} />
        <h2 className="text-sm font-medium text-cream">{title}</h2>
      </div>
      <p className="mt-1.5 text-xs leading-5 text-muted">{body}</p>
    </div>
  )
}
