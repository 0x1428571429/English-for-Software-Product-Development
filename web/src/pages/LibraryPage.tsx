import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Sparkles } from 'lucide-react'
import { useCorpus } from '../data/CorpusContext'
import { searchCorpus } from '../data/corpus'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'

export function LibraryPage() {
  const { corpus, index, loading } = useCorpus()
  const [query, setQuery] = useState('')

  const results = useMemo(() => {
    if (!corpus || !query.trim()) return null
    return searchCorpus(corpus, query)
  }, [corpus, query])

  if (loading || !corpus || !index) {
    return <div className="py-24 text-center text-muted">正在加载语料…</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-muted">Corpus</p>
          <h1 className="mt-1 text-3xl font-semibold">语料库</h1>
          <p className="mt-2 text-sm text-muted">
            {corpus.report.cards} 张卡 · {corpus.report.expressions} 个表达 · {corpus.report.vocab} 个词汇 ·
            {corpus.report.pronunciation} 个易读错词
          </p>
        </div>
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索中文、英文或表达…"
            className="w-full rounded-xl border border-line bg-panel py-2.5 pl-9 pr-3 text-sm text-cream outline-none placeholder:text-muted/60 focus:border-accent/60"
          />
        </div>
      </div>

      {results ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-cream">搜索结果</h2>
            <button onClick={() => setQuery('')} className="text-xs text-muted hover:text-cream">
              清除
            </button>
          </div>
          {results.cards.length === 0 && results.expressions.length === 0 && (
            <p className="text-sm text-muted">没有找到匹配内容。</p>
          )}
          {results.cards.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted">卡片 · {results.cards.length}</p>
              {results.cards.map((card) => (
                <Link
                  key={card.id}
                  to={card.chapterId ? `/library/${card.chapterId}` : '/library'}
                  className="card-surface block p-3 hover:border-accent/40"
                >
                  <div className="flex items-center gap-2">
                    <Badge tone="muted">{card.kind}</Badge>
                    {card.chapterId && <span className="text-xs text-muted">{index.chapterById.get(card.chapterId)?.titleZh}</span>}
                  </div>
                  <p className="mt-1.5 text-sm text-cream">{card.promptZh}</p>
                  <p className="mt-0.5 text-xs text-muted">{card.primaryAnswer}</p>
                </Link>
              ))}
            </div>
          )}
          {results.expressions.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted">表达 · {results.expressions.length}</p>
              {results.expressions.map((expression) => (
                <Link
                  key={expression.id}
                  to={`/library/${expression.chapterId}`}
                  className="card-surface block p-3 hover:border-accent/40"
                >
                  <p className="text-sm text-cream">{expression.titleEn}</p>
                  <p className="mt-0.5 text-xs text-muted">{expression.meaningZh}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {corpus.chapters.map((chapter) => {
            const report = corpus.report.perChapter.find((row) => row.chapterId === chapter.id)
            const chapterCards = index.cardsByChapter.get(chapter.id) ?? []
            return (
              <Link
                key={chapter.id}
                to={`/library/${chapter.id}`}
                className="card-surface group p-4 transition-colors hover:border-accent/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-muted">{String(chapter.order).padStart(2, '0')}</p>
                    <h2 className="mt-0.5 truncate text-base font-medium text-cream">{chapter.titleZh}</h2>
                    <p className="mt-0.5 text-xs text-muted">{chapter.titleEn}</p>
                  </div>
                  <span className="rounded-lg border border-line bg-panel-2 p-1.5 text-muted transition-colors group-hover:text-accent">
                    <Sparkles size={15} />
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  <Badge>{chapterCards.length} 张卡</Badge>
                  <Badge>{report?.dialogueLines ?? 0} 句对话</Badge>
                  {report && report.coverage < 50 && <Badge tone="warn">翻译 {report.coverage}%</Badge>}
                </div>
              </Link>
            )
          })}
        </div>
      )}

      <div className="card-surface flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <p className="text-sm text-cream">不知道从哪开始？</p>
          <p className="mt-0.5 text-xs text-muted">直接做一组混合反射训练，系统会按到期顺序排卡。</p>
        </div>
        <Button variant="primary" onClick={() => { window.location.hash = '#/drill?focus=1' }}>
          <Sparkles size={16} /> 开始训练
        </Button>
      </div>
    </div>
  )
}
