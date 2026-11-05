import type { ReactNode } from 'react'
import { clsx } from 'clsx'

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode
  tone?: 'neutral' | 'accent' | 'warn' | 'danger' | 'muted'
  className?: string
}) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium tracking-wide',
        tone === 'neutral' && 'border-line bg-panel-2 text-muted',
        tone === 'accent' && 'border-accent/30 bg-accent/10 text-accent',
        tone === 'warn' && 'border-warn/30 bg-warn/10 text-warn',
        tone === 'danger' && 'border-danger/30 bg-danger/10 text-danger',
        tone === 'muted' && 'border-line bg-transparent text-muted',
        className,
      )}
    >
      {children}
    </span>
  )
}
