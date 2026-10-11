import { useSession, usePermissions } from '../../../core/auth/useSession'
import { ROLE_LABELS } from '../../../core/rbac/roles'
import { InstallPrompt } from '../../../core/pwa/InstallPrompt'
import { ThemeToggle } from '../../../core/theme/ThemeToggle'
import { Icon } from '../../../core/ui/Icons'
import { COMING_SOON, HUB_MODULES } from '../registry'
import type { HubBadges } from '../types'
import { ComingSoonCard } from './ComingSoonCard'
import { ModuleCard } from './ModuleCard'

// Phase 1: no outbox or approvals yet, so badges are zero. Phases 2 and 3 supply real counts.
const BADGES: HubBadges = { pendingActions: {}, unsynced: 0 }

export function HubScreen() {
  const { session, offline, signOut } = useSession()
  const { can } = usePermissions()
  if (!session) return null
  const { profile } = session
  const visible = HUB_MODULES.filter((m) => can(m.id, 'read'))

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
            onClick={() => void signOut()}
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
