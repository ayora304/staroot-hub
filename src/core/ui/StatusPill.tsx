const TONES = {
  neutral: 'bg-surface-2 text-muted border-border',
  success: 'bg-success/15 text-success border-success/40',
  warning: 'bg-warning/15 text-warning border-warning/40',
  danger: 'bg-danger/15 text-danger border-danger/40',
  accent: 'bg-accent/15 text-accent border-accent/40',
} as const

export function StatusPill({ tone = 'neutral', children }: { tone?: keyof typeof TONES; children: React.ReactNode }) {
  return <span className={`inline-flex min-h-6 items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${TONES[tone]}`}>{children}</span>
}
