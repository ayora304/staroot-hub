import { useState } from 'react'
import { Button } from '../../../core/ui/Button'
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
    <section className="space-y-2 rounded-2xl border border-border bg-surface p-4" aria-label="Notifications">
      <h2 className="font-semibold text-text">Stay up to date</h2>
      <p className="text-sm text-muted">Get a notification when an approval needs your attention. You can change this in browser settings later.</p>
      {push.error && <p role="alert" className="text-sm text-danger">{push.error}</p>}
      <div className="flex gap-2">
        <Button loading={push.busy} onClick={() => void push.enable()}>Enable notifications</Button>
        <Button variant="secondary" disabled={push.busy} onClick={dismiss}>Not now</Button>
      </div>
    </section>
  )
}
