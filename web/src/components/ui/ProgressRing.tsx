import type { ReactNode } from 'react'

export function ProgressRing({
  value,
  size = 68,
  stroke = 6,
  children,
  tone = 'accent',
}: {
  value: number
  size?: number
  stroke?: number
  children?: ReactNode
  tone?: 'accent' | 'warn' | 'danger'
}) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const clamped = Math.max(0, Math.min(1, value))
  const color = tone === 'accent' ? 'var(--color-accent)' : tone === 'warn' ? 'var(--color-warn)' : 'var(--color-danger)'
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--color-line)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - clamped)}
          style={{ transition: 'stroke-dashoffset 300ms ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  )
}
