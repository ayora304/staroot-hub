export function PendingBadge({ count }: { count: number }) {
  if (count <= 0) return null
  return (
    <span aria-label={`${count} pending`} className="grid min-w-6 place-items-center rounded-full bg-accent px-1.5 text-xs font-bold text-accent-contrast">
      {count > 99 ? '99+' : count}
    </span>
  )
}
