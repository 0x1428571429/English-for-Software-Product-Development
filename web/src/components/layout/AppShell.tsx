import type { ReactNode } from 'react'
import { NavLink, useLocation, useSearchParams } from 'react-router-dom'
import {
  BarChart3,
  BookOpenText,
  CalendarCheck,
  MessagesSquare,
  Settings,
  Sparkles,
  Volume2,
} from 'lucide-react'
import { clsx } from 'clsx'

const NAV = [
  { to: '/', label: '今日', icon: CalendarCheck, end: true },
  { to: '/drill', label: '反射', icon: Sparkles },
  { to: '/scenario', label: '场景', icon: MessagesSquare },
  { to: '/dialogue', label: '对话', icon: BookOpenText },
  { to: '/library', label: '语料', icon: Volume2 },
]

const SECONDARY = [
  { to: '/stats', label: '统计', icon: BarChart3 },
  { to: '/settings', label: '设置', icon: Settings },
]

export function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation()
  const [params] = useSearchParams()
  const focus = params.get('focus') === '1'
  const isSession = focus && (location.pathname === '/drill' || location.pathname === '/scenario')

  if (isSession) {
    return <div className="min-h-screen">{children}</div>
  }

  return (
    <div className="min-h-screen md:flex">
      <aside className="hidden w-60 shrink-0 border-r border-line/70 px-4 py-6 md:flex md:flex-col">
        <div className="px-2">
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted">English Reflex</p>
          <h1 className="mt-1 text-xl font-semibold text-cream">反射英语</h1>
          <p className="mt-1 text-xs leading-5 text-muted">把真实工作场景练成脱口而出。</p>
        </div>
        <nav className="mt-8 space-y-1">
          {NAV.map((item) => (
            <SideLink key={item.to} {...item} />
          ))}
        </nav>
        <div className="mt-8 border-t border-line/70 pt-4">
          <p className="px-3 pb-2 text-[11px] uppercase tracking-[0.18em] text-muted">More</p>
          <nav className="space-y-1">
            {SECONDARY.map((item) => (
              <SideLink key={item.to} {...item} />
            ))}
          </nav>
        </div>
        <div className="mt-auto px-3 pt-8 text-[11px] leading-5 text-muted">
          <p>先开口，再揭示。</p>
          <p>5 秒内说出来才算「秒答」。</p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-line/60 bg-ink/85 backdrop-blur md:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted">English Reflex</p>
              <p className="text-base font-semibold">反射英语</p>
            </div>
            <div className="flex items-center gap-1">
              {SECONDARY.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    clsx(
                      'rounded-lg p-2 text-muted transition-colors',
                      isActive ? 'bg-panel-2 text-accent' : 'hover:bg-panel-2 hover:text-cream',
                    )
                  }
                  aria-label={item.label}
                >
                  <item.icon size={18} />
                </NavLink>
              ))}
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-5 md:px-8 md:pb-10 md:pt-8">
          {children}
        </main>

        <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-line/70 bg-ink/95 backdrop-blur md:hidden">
          <div className="grid grid-cols-5">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  clsx(
                    'flex flex-col items-center gap-1 py-2.5 text-[11px] transition-colors',
                    isActive ? 'text-accent' : 'text-muted',
                  )
                }
              >
                <item.icon size={19} />
                {item.label}
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
    </div>
  )
}

function SideLink({
  to,
  label,
  icon: Icon,
  end,
}: {
  to: string
  label: string
  icon: typeof CalendarCheck
  end?: boolean
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        clsx(
          'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors',
          isActive ? 'bg-accent/10 text-accent' : 'text-muted hover:bg-panel-2 hover:text-cream',
        )
      }
    >
      <Icon size={18} />
      {label}
    </NavLink>
  )
}
