import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bookmark, Download, Search, Trash2, Volume2 } from 'lucide-react'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { speakWord } from '../lib/speech'
import {
  useFavoritesStore,
  type FavoriteColor,
  type FavoriteKind,
} from '../store/useFavoritesStore'

const KIND_LABEL: Record<FavoriteKind, string> = {
  word: '单词',
  expression: '表达',
  card: '卡片',
  dialogue: '对话',
  story: '剧情',
}

const COLOR_LABEL: Record<FavoriteColor, string> = {
  yellow: '重点',
  green: '已掌握',
  pink: '易错',
}

const COLOR_CLASS: Record<FavoriteColor, string> = {
  yellow: 'bg-warn',
  green: 'bg-accent',
  pink: 'bg-pink-400',
}

export function WordsPage() {
  const items = useFavoritesStore((state) => state.items)
  const remove = useFavoritesStore((state) => state.remove)
  const setFavoriteColor = useFavoritesStore((state) => state.setColor)
  const [query, setQuery] = useState('')
  const [kind, setKind] = useState<FavoriteKind | 'all'>('all')
  const [colorFilter, setColorFilter] = useState<FavoriteColor | 'all'>('all')

  const list = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return Object.values(items)
      .filter((item) => kind === 'all' || item.kind === kind)
      .filter((item) => colorFilter === 'all' || item.color === colorFilter)
      .filter((item) => {
        if (!needle) return true
        return `${item.title} ${item.zh ?? ''} ${item.example ?? ''}`.toLowerCase().includes(needle)
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }, [colorFilter, items, kind, query])

  const counts = useMemo(() => {
    const result: Record<string, number> = { all: 0 }
    for (const item of Object.values(items)) {
      result.all += 1
      result[item.kind] = (result[item.kind] ?? 0) + 1
    }
    return result
  }, [items])

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-2xl border border-line bg-panel p-5 md:p-7">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-accent/10 blur-3xl" />
        <div className="relative z-10">
          <Badge tone="accent">
            <Bookmark size={12} /> Wordbook · 全局查词
          </Badge>
          <h1 className="mt-3 text-3xl font-semibold text-cream">生词本</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            在任意英文上停留，就能看到释义并收藏。这里统一管理你的单词、表达和标记；数据存在本机
            IndexedDB，可在设置里一键导出。
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted">
            <span className="rounded-full border border-line px-3 py-1">共 {counts.all} 条</span>
            <span className="rounded-full border border-warn/30 px-3 py-1 text-warn">
              重点 {Object.values(items).filter((item) => item.color === 'yellow').length}
            </span>
            <span className="rounded-full border border-accent/30 px-3 py-1 text-accent">
              已掌握 {Object.values(items).filter((item) => item.color === 'green').length}
            </span>
            <Link to="/settings" className="ml-auto">
              <Button variant="ghost" size="sm">
                <Download size={13} /> 去设置导出
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="card-surface flex flex-col gap-3 p-3 md:flex-row md:items-center">
        <label className="flex flex-1 items-center gap-2 rounded-xl border border-line bg-ink/40 px-3 py-2">
          <Search size={15} className="text-muted" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索单词、释义或例句"
            className="min-w-0 flex-1 bg-transparent text-sm text-cream outline-none placeholder:text-muted/60"
          />
        </label>
        <div className="flex flex-wrap items-center gap-1.5">
          {(['all', 'word', 'expression', 'card', 'dialogue', 'story'] as const).map((value) => (
            <button
              key={value}
              onClick={() => setKind(value)}
              className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                kind === value
                  ? 'border-accent/50 bg-accent/10 text-accent'
                  : 'border-line text-muted hover:text-cream'
              }`}
            >
              {value === 'all' ? '全部' : KIND_LABEL[value]}
              {counts[value] ? ` ${counts[value]}` : ''}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 md:ml-1">
          {(['all', 'yellow', 'green', 'pink'] as const).map((value) => (
            <button
              key={value}
              onClick={() => setColorFilter(value)}
              title={value === 'all' ? '全部颜色' : COLOR_LABEL[value]}
              className={`h-5 w-5 rounded-full border-2 transition-transform hover:scale-110 ${
                value === 'all' ? 'border-line bg-panel-2' : `${COLOR_CLASS[value]} border-transparent`
              } ${colorFilter === value ? 'ring-2 ring-cream/80 ring-offset-2 ring-offset-panel' : ''}`}
              aria-label={value === 'all' ? '全部颜色' : COLOR_LABEL[value]}
            />
          ))}
        </div>
      </section>

      {list.length === 0 ? (
        <section className="card-surface grid place-items-center px-4 py-16 text-center">
          <Bookmark size={26} className="text-muted" />
          <p className="mt-3 text-sm font-medium text-cream">还没有收藏</p>
          <p className="mt-1 max-w-sm text-xs leading-5 text-muted">
            打开任意剧情或对话，把鼠标停在英文单词上。看到释义后点「收藏」，它就会出现在这里。
          </p>
          <Link to="/story" className="mt-4">
            <Button variant="primary" size="sm">去剧情模式</Button>
          </Link>
        </section>
      ) : (
        <section className="grid gap-3 md:grid-cols-2">
          {list.map((item) => (
            <article key={item.id} className="card-surface p-4">
              <div className="flex items-start gap-3">
                <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${COLOR_CLASS[item.color]}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <h2 className="text-lg font-medium text-cream">{item.title}</h2>
                    {item.ipa && <span className="font-mono text-xs text-accent/80">{item.ipa}</span>}
                    <span className="text-2xs uppercase tracking-[0.14em] text-muted">
                      {KIND_LABEL[item.kind]}
                    </span>
                  </div>
                  {item.zh && <p className="mt-1 text-sm leading-6 text-cream/80">{item.zh}</p>}
                  {item.example && (
                    <p className="mt-1.5 rounded-lg border border-line/60 bg-ink/40 px-2 py-1.5 text-xs leading-4 text-muted">
                      {item.example}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {(['yellow', 'green', 'pink'] as const).map((value) => (
                      <button
                        key={value}
                        onClick={() => setFavoriteColor(item.id, value)}
                        className={`rounded-full border px-2 py-0.5 text-2xs ${
                          item.color === value
                            ? 'border-cream/50 text-cream'
                            : 'border-line text-muted hover:text-cream'
                        }`}
                      >
                        {COLOR_LABEL[value]}
                      </button>
                    ))}
                    <button
                      onClick={() => void speakWord(item.title)}
                      className="ml-auto rounded-full border border-line p-1.5 text-muted hover:text-accent"
                      aria-label="朗读"
                    >
                      <Volume2 size={13} />
                    </button>
                    <button
                      onClick={() => remove(item.id)}
                      className="rounded-full border border-line p-1.5 text-muted hover:border-danger/40 hover:text-danger"
                      aria-label="删除收藏"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  )
}
