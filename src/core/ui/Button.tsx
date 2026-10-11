import type { ButtonHTMLAttributes } from 'react'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost'
  loading?: boolean
}

const VARIANTS = {
  primary: 'bg-accent text-accent-contrast font-semibold',
  secondary: 'bg-surface-2 text-text border border-border',
  ghost: 'text-muted hover:text-text',
} as const

export function Button({ variant = 'primary', loading = false, className = '', disabled, children, ...rest }: Props) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`min-h-12 rounded-xl px-5 transition active:scale-[0.98] disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${VARIANTS[variant]} ${className}`}
    >
      {loading ? 'Please wait…' : children}
    </button>
  )
}
