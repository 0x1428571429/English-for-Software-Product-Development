import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'warn'
type Size = 'sm' | 'md' | 'lg'

export function Button({
  children,
  variant = 'secondary',
  size = 'md',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
  children: ReactNode
}) {
  return (
    <button
      className={twMerge(
        clsx(
          'inline-flex items-center justify-center gap-2 rounded-xl border font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40',
          size === 'sm' && 'px-3 py-1.5 text-sm',
          size === 'md' && 'px-4 py-2.5 text-sm',
          size === 'lg' && 'px-5 py-3 text-base',
          variant === 'primary' && 'border-accent/40 bg-accent text-ink hover:bg-accent/90',
          variant === 'secondary' && 'border-line bg-panel-2 text-cream hover:border-muted/50 hover:bg-panel',
          variant === 'ghost' && 'border-transparent bg-transparent text-muted hover:bg-panel-2 hover:text-cream',
          variant === 'danger' && 'border-danger/40 bg-danger/10 text-danger hover:bg-danger/20',
          variant === 'warn' && 'border-warn/40 bg-warn/10 text-warn hover:bg-warn/20',
        ),
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
