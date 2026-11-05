import {
  createEmptyCard,
  fsrs,
  generatorParameters,
  Rating,
  State,
  type Card as FsrsCard,
  type Grade,
} from 'ts-fsrs'

export type GradeValue = 1 | 2 | 3 | 4

export const GRADES: { value: GradeValue; label: string; hint: string; color: string }[] = [
  { value: 1, label: '忘了', hint: '完全没想起来', color: 'danger' },
  { value: 2, label: '模糊', hint: '想起来一部分', color: 'warn' },
  { value: 3, label: '记得', hint: '正常想起来', color: 'muted' },
  { value: 4, label: '秒答', hint: '瞬间脱口而出', color: 'accent' },
]

export interface SrsSnapshot {
  due: string
  stability: number
  difficulty: number
  scheduled_days: number
  reps: number
  lapses: number
  learning_steps: number
  state: number
  last_review?: string
}

const scheduler = fsrs(
  generatorParameters({
    request_retention: 0.9,
    maximum_interval: 365,
    enable_fuzz: true,
    enable_short_term: true,
  }),
)

export function newCardSnapshot(now = new Date()): SrsSnapshot {
  return serializeCard(createEmptyCard(now))
}

export function serializeCard(card: FsrsCard): SrsSnapshot {
  return {
    due: card.due.toISOString(),
    stability: card.stability,
    difficulty: card.difficulty,
    scheduled_days: card.scheduled_days,
    reps: card.reps,
    lapses: card.lapses,
    learning_steps: card.learning_steps ?? 0,
    state: card.state,
    last_review: card.last_review ? card.last_review.toISOString() : undefined,
  }
}

export function reviveCard(snapshot: SrsSnapshot): FsrsCard {
  return {
    due: new Date(snapshot.due),
    stability: snapshot.stability,
    difficulty: snapshot.difficulty,
    scheduled_days: snapshot.scheduled_days,
    reps: snapshot.reps,
    lapses: snapshot.lapses,
    learning_steps: snapshot.learning_steps ?? 0,
    state: snapshot.state as State,
    last_review: snapshot.last_review ? new Date(snapshot.last_review) : undefined,
  } as FsrsCard
}

export function reviewCard(
  snapshot: SrsSnapshot,
  grade: GradeValue,
  now = new Date(),
): { card: SrsSnapshot; intervalDays: number } {
  const scheduling = scheduler.repeat(reviveCard(snapshot), now)
  const next = scheduling[grade as Grade].card
  return {
    card: serializeCard(next),
    intervalDays: next.scheduled_days,
  }
}

export function isDue(snapshot: SrsSnapshot | undefined, now = new Date()): boolean {
  if (!snapshot) return false
  return new Date(snapshot.due).getTime() <= now.getTime()
}

export function isNew(snapshot: SrsSnapshot | undefined): boolean {
  return !snapshot || snapshot.reps === 0
}

export function isMature(snapshot: SrsSnapshot | undefined): boolean {
  return Boolean(snapshot && snapshot.state === State.Review && snapshot.stability >= 21)
}

export function dueLabel(snapshot: SrsSnapshot): string {
  const diff = new Date(snapshot.due).getTime() - Date.now()
  if (diff <= 0) return '到期'
  const minutes = Math.round(diff / 60000)
  if (minutes < 60) return `${minutes} 分钟后`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} 小时后`
  const days = Math.round(hours / 24)
  return `${days} 天后`
}

export { Rating, State }
