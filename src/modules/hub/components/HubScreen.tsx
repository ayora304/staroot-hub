import { useSession, usePermissions } from '../../../core/auth/useSession'
import { outboxStore, syncEngine, unsyncedCount, useSyncStatus } from '../../../core/offline'
import { ROLE_LABELS } from '../../../core/rbac/roles'
import { InstallPrompt } from '../../../core/pwa/InstallPrompt'
import { ThemeToggle } from '../../../core/theme/ThemeToggle'
import { Icon } from '../../../core/ui/Icons'
import { RadialHub } from '../../../components/RadialHub'
import { Bell, Boxes, Building2, ClipboardCheck, SlidersHorizontal, Users } from 'lucide-react'
import { PushPrePrompt } from '../../notifications/components/PushPrePrompt'
import { useApprovalsList } from '../../approvals/hooks/use-approvals'
import { COMING_SOON, HUB_MODULES } from '../registry'
import type { HubBadges } from '../types'

// Unsynced and approval badges are sourced from the live queue and cached/API reads.

function syncMessage(s: ReturnType<typeof useSyncStatus>, total: number): string {
  const noun = total === 1 ? 'item' : 'items'
  if (s.failed + s.needsReview > 0) return `${s.failed + s.needsReview} ${s.failed + s.needsReview === 1 ? 'item needs' : 'items need'} attention`
  if (!s.online) return `${total} ${noun} waiting for a connection`
  if (s.paused) return `${total} ${noun} waiting. Sign in again to sync.`
  return `Syncing ${total} ${noun}...`
}

const MODULE_ICONS = {
  approvals: ClipboardCheck,
  notifications: Bell,
  crm: Users,
  site: Building2,
  inventory: Boxes,
  admin: SlidersHorizontal,
} as const

export function HubScreen() {
  const { session, offline, signOut } = useSession()
  const { can } = usePermissions()
  const sync = useSyncStatus()
  const pendingApprovals = useApprovalsList('pending_mine', can('approvals', 'read'))
  if (!session) return null
  const { profile } = session
  const visible = HUB_MODULES.filter((module) => can(module.id, 'read'))
  const unsynced = unsyncedCount(sync)
  const badges: HubBadges = { pendingActions: { approvals: pendingApprovals.data?.length ?? 0 }, unsynced }
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
    <div className="relative isolate min-h-screen">
      <div aria-hidden="true" className="hub-wallpaper pointer-events-none fixed inset-0 z-0" />
      <div className="relative z-10 mx-auto min-h-screen max-w-5xl pb-safe">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-border/60 bg-bg/45 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-safe pb-2 pt-safe">
          <div className="min-w-0 py-2">
            <p className="truncate text-sm font-medium text-text">Hello, {profile.display_name}</p>
            <p className="text-xs text-muted">{ROLE_LABELS[profile.role]}</p>
          </div>
          <div className="flex shrink-0 items-center">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => void handleSignOut()}
              aria-label="Sign out"
              className="grid size-11 place-items-center rounded-xl text-muted transition hover:bg-surface-2 hover:text-text focus-visible:outline-2 focus-visible:outline-accent"
            >
              <Icon name="logout" className="size-5" />
            </button>
          </div>
        </div>
      </header>
      <div className="hub-fixed-header-spacer" aria-hidden="true" />

      <main className="space-y-6 px-4 pb-8 pt-5 sm:px-6">
        <section className="flex items-end justify-between gap-4" aria-labelledby="hub-title">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-accent">Workspace</p>
            <h1 id="hub-title" className="text-3xl font-semibold tracking-tight text-text">Staroot Hub</h1>
          </div>
          <span className="mb-1 shrink-0 rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted">
            {visible.length} {visible.length === 1 ? 'module' : 'modules'}
          </span>
        </section>

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
        <PushPrePrompt />

        <section aria-label="Staroot Hub modules" className="space-y-2">
          {visible.length > 0 && <RadialHub
            items={visible.map((module) => ({
              id: module.id,
              label: module.id === 'crm' ? 'CRM' : module.label,
              to: module.route,
              icon: MODULE_ICONS[module.id as keyof typeof MODULE_ICONS],
              description: module.blurb,
              ...(module.id === 'approvals' && badges.pendingActions.approvals > 0 ? { badge: badges.pendingActions.approvals } : {}),
            }))}
          />}
        </section>

        <section aria-labelledby="coming-soon-title" className="space-y-3 text-center">
          <h2 id="coming-soon-title" className="text-base font-semibold text-muted">Coming soon</h2>
          <ul className="flex flex-wrap justify-center gap-2.5">
            {COMING_SOON.map((item) => (
              <li key={item.id} aria-disabled="true" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-dashed border-border px-4 py-2 text-sm text-muted">
                <Icon name={item.icon} className="size-4 shrink-0" />
                <span>{item.label}</span>
              </li>
            ))}
          </ul>
        </section>
      </main>
      </div>
    </div>
  )
}
