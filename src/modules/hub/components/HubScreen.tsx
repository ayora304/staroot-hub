import { useSession, usePermissions } from '../../../core/auth/useSession'
import { outboxStore, syncEngine, unsyncedCount, useSyncStatus } from '../../../core/offline'
import { ROLE_LABELS } from '../../../core/rbac/roles'
import { InstallPrompt } from '../../../core/pwa/InstallPrompt'
import { ThemeToggle } from '../../../core/theme/ThemeToggle'
import { Icon } from '../../../core/ui/Icons'
import { COMING_SOON, HUB_MODULES } from '../registry'
import type { HubBadges } from '../types'
import { ComingSoonCard } from './ComingSoonCard'
import { ModuleCard } from './ModuleCard'

// Pending-approval counts arrive in Phase 3. The unsynced count is live: it comes from useSyncStatus().
const BADGES: HubBadges = { pendingActions: {}, unsynced: 0 }

function syncMessage(s: ReturnType<typeof useSyncStatus>, total: number): string {
  const noun = total === 1 ? 'item' : 'items'
  if (s.failed + s.needsReview > 0) return `${s.failed + s.needsReview} ${s.failed + s.needsReview === 1 ? 'item needs' : 'items need'} attention`
  if (!s.online) return `${total} ${noun} waiting for a connection`
  if (s.paused) return `${total} ${noun} waiting. Sign in again to sync.`
  return `Syncing ${total} ${noun}...`
}

export function HubScreen() {
  const { session, offline, signOut } = useSession()
  const { can } = usePermissions()
  const sync = useSyncStatus()
  if (!session) return null
  const { profile } = session
  const visible = HUB_MODULES.filter((m) => can(m.id, 'read'))
  const unsynced = unsyncedCount(sync)

  async function handleSignOut() {
    if (await syncEngine.hasUnsynced()) {
      const ok = window.confirm(
        `You have ${unsynced} unsynced ${unsynced === 1 ? 'item' : 'items'}. Signing out will delete ${unsynced === 1 ? 'it' : 'them'} from this device. Sign out anyway?`,
      )
      if (!ok) return
      // Clear the queue so the next person to sign in on this device cannot send it under their account.
      await outboxStore.clear()
      await syncEngine.refresh()
    }
    await signOut()
  }

  return (
    <div className="mx-auto max-w-2xl pb-safe">
      <header className="sticky top-0 z-10 flex items-center justify-between bg-bg/90 px-4 pb-2 pt-safe backdrop-blur">
        <div className="py-2">
          <p className="text-sm text-muted">Hello, {profile.display_name}</p>
          <p className="text-xs text-muted">{ROLE_LABELS[profile.role]}</p>
        </div>
        <div className="flex items-center">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => void handleSignOut()}
            aria-label="Sign out"
            className="grid size-11 place-items-center rounded-xl text-muted hover:text-text focus-visible:outline-2 focus-visible:outline-accent"
          >
            <Icon name="logout" className="size-5" />
          </button>
        </div>
      </header>

      <main className="space-y-6 p-4">
        <h1 className="text-2xl font-semibold text-text">Staroot Hub</h1>

        {offline && (
          <div role="status" className="flex items-center gap-3 rounded-2xl border border-warning/40 bg-warning/10 p-3 text-sm text-warning">
            <Icon name="wifiOff" className="size-5 shrink-0" />
            Offline. Showing your last known access. Changes will sync when you reconnect.
          </div>
        )}

        {unsynced > 0 && (
          <div role="status" className="flex items-center justify-between gap-3 rounded-2xl border border-accent/40 bg-accent/10 p-3 text-sm text-text">
            <span>{syncMessage(sync, unsynced)}</span>
            {sync.failed > 0 && (
              <button
                type="button"
                onClick={() => void syncEngine.retryAllFailed()}
                className="min-h-11 shrink-0 rounded-xl border border-accent/40 px-4 text-accent focus-visible:outline-2 focus-visible:outline-accent"
              >
                Retry
              </button>
            )}
          </div>
        )}

        <InstallPrompt />

        <section aria-label="Modules" className="grid gap-3 sm:grid-cols-2">
          {visible.map((m) => (
            <ModuleCard key={m.id} module={m} pending={BADGES.pendingActions[m.id] ?? 0} />
          ))}
        </section>

        <section aria-label="Coming soon" className="space-y-3">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted">Coming soon</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {COMING_SOON.map((c) => (
              <ComingSoonCard key={c.id} item={c} />
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
