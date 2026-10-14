import { useState } from 'react'
import { Button } from '../../../core/ui/Button'
import { Icon } from '../../../core/ui/Icons'
import { usePushPermission } from '../../../core/push/usePushPermission'

export function PushPrePrompt() {
  const push = usePushPermission()
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem('push-prompt-dismissed') === '1')
  if (!push.supported || push.subscribed || push.permission === 'denied' || dismissed) return null

  function dismiss() {
    sessionStorage.setItem('push-prompt-dismissed', '1')
    setDismissed(true)
  }

  return (
    <section className="flex items-start gap-3 rounded-2xl border border-border bg-surface p-4 sm:items-center" aria-label="Notifications">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent">
        <Icon name="bell" className="size-5" />
      </span>
      <div className="min-w-0 flex-1 space-y-1">
        <h2 className="font-semibold text-text">Stay up to date</h2>
        <p className="text-sm text-muted">Get a notification when an approval needs your attention. You can change this in browser settings later.</p>
        {push.error && <p role="alert" className="text-sm text-danger">{push.error}</p>}
        <div className="flex flex-wrap gap-2 pt-2">
          <Button className="min-h-10 rounded-lg px-3 text-sm" loading={push.busy} onClick={() => void push.enable()}>Enable notifications</Button>
          <Button variant="secondary" className="min-h-10 rounded-lg px-3 text-sm" disabled={push.busy} onClick={dismiss}>Not now</Button>
        </div>
      </div>
    </section>
  )
}
