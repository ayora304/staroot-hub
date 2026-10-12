import type { ReactNode } from 'react'

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="mx-auto flex max-w-sm flex-col items-center gap-3 px-safe py-8 pt-safe pb-safe text-center">
      <h2 className="text-lg font-semibold text-text">{title}</h2>
      {body && <p className="text-sm text-muted">{body}</p>}
      {action}
    </div>
  )
}
