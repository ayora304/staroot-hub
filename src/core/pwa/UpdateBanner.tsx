import { Button } from '../ui/Button'
import { useSwUpdate } from './useSwUpdate'

export function UpdateBanner() {
  const { needRefresh, applyUpdate } = useSwUpdate()
  if (!needRefresh) return null
  return (
    <div role="status" className="fixed inset-x-3 bottom-3 z-50 flex items-center justify-between gap-3 rounded-2xl border border-accent bg-surface p-3 pb-safe shadow-lg">
      <p className="text-sm text-text">A new version is ready.</p>
      <Button onClick={applyUpdate}>Update</Button>
    </div>
  )
}
