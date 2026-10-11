import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Icon } from '../ui/Icons'
import { usePwaInstall } from './usePwaInstall'

/** Android/desktop: native install button. iOS: Safari has no prompt API, so show steps. */
export function InstallPrompt() {
  const { canInstall, showIosGuide, promptInstall } = usePwaInstall()
  if (canInstall) {
    return (
      <Card className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Icon name="download" className="size-6 text-accent" />
          <p className="text-sm text-text">Install Staroot Hub for offline use on site.</p>
        </div>
        <Button variant="secondary" onClick={() => void promptInstall()}>Install</Button>
      </Card>
    )
  }
  if (showIosGuide) {
    return (
      <Card className="space-y-1 text-sm">
        <p className="font-medium text-text">Install on iPhone or iPad</p>
        <p className="text-muted">In Safari tap Share, then Add to Home Screen. Notifications only work from the installed app.</p>
      </Card>
    )
  }
  return null
}
