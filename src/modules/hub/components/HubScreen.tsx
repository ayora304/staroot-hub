import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useSession, usePermissions } from '../../../core/auth/useSession'
import { outboxStore, syncEngine, unsyncedCount, useSyncStatus } from '../../../core/offline'
import { InstallPrompt } from '../../../core/pwa/InstallPrompt'
import { useTheme } from '../../../core/theme/ThemeProvider'
import { Icon } from '../../../core/ui/Icons'
import { RadialHub } from '../../../components/RadialHub'
import { Bell, ClipboardCheck, Handshake, HardHat, Mail, Menu, Truck, UserCog, X } from 'lucide-react'
import { PushPrePrompt } from '../../notifications/components/PushPrePrompt'
import { useApprovalsList } from '../../approvals/hooks/use-approvals'
import { COMING_SOON, HUB_MODULES } from '../registry'
import type { HubBadges } from '../types'
import '../hub-menu.css'

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
  notifications: Mail,
  crm: Handshake,
  site: HardHat,
  inventory: Truck,
  admin: UserCog,
} as const

export function HubScreen() {
  const { session, offline, signOut } = useSession()
  const { can } = usePermissions()
  const sync = useSyncStatus()
  const pendingApprovals = useApprovalsList('pending_mine', can('approvals', 'read'))
  const [menuOpen, setMenuOpen] = useState(false)
  const { theme, toggle } = useTheme()
  if (!session) return null
  const { profile } = session
  const visible = HUB_MODULES.filter((module) => can(module.id, 'read'))
  const unsynced = unsyncedCount(sync)
  const badges: HubBadges = { pendingActions: { approvals: pendingApprovals.data?.length ?? 0 }, unsynced }
  async function handleSignOut() {
    setMenuOpen(false)
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
    <div className="hub-screen relative isolate min-h-screen">
      <div aria-hidden="true" className="hub-background pointer-events-none fixed inset-0 z-0" />
      <div className="relative z-10 mx-auto min-h-screen max-w-5xl pb-safe">
      <header className="hub-fixed-header fixed inset-x-0 top-0 z-50 border-b border-transparent bg-transparent">
        <div className="hub-header-content relative mx-auto max-w-5xl px-safe pb-3 pt-safe">
          <div className="flex min-h-11 items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span aria-hidden="true" className="grid size-12 shrink-0 place-items-center rounded-full border border-accent/50 bg-surface-2 text-sm font-semibold uppercase text-text shadow-sm">
                {profile.display_name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('') || 'U'}
              </span>
              <p className="truncate capitalize text-[27px] font-semibold leading-tight text-[var(--c-text)]">{profile.display_name}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <Link
                to="/m/notifications"
                aria-label="Open inbox"
                className="grid size-11 place-items-center rounded-full text-[var(--c-text)] transition hover:bg-white/10 hover:text-[var(--c-text)] focus-visible:outline-2 focus-visible:outline-accent"
              >
                <Bell className="size-[23px]" aria-hidden="true" />
              </Link>
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={menuOpen}
                className="grid size-11 place-items-center rounded-full text-[var(--c-text)] transition hover:bg-white/10 hover:text-[var(--c-text)] focus-visible:outline-2 focus-visible:outline-accent"
              >
                {menuOpen ? <X className="size-[23px]" aria-hidden="true" /> : <Menu className="size-[23px]" aria-hidden="true" />}
              </button>
            </div>
          </div>
          {menuOpen && (
            <div className="hub-menu-popup" aria-label="Hub menu">
              <svg className="hub-menu-popup__filter" width="0" height="0" aria-hidden="true" focusable="false">
                <defs>
                  <filter id="hub-menu-liquid-light" x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
                    <feTurbulence type="fractalNoise" baseFrequency="0.008 0.012" numOctaves="1" seed="7" result="ripple" />
                    <feDisplacementMap in="SourceGraphic" in2="ripple" scale="40" xChannelSelector="R" yChannelSelector="G" />
                  </filter>
                  <filter id="hub-menu-liquid" x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
                    <feTurbulence type="fractalNoise" baseFrequency="0.008 0.012" numOctaves="1" seed="7" result="ripple" />
                    <feDisplacementMap in="SourceGraphic" in2="ripple" scale="24" xChannelSelector="R" yChannelSelector="G" />
                  </filter>
                </defs>
              </svg>
              <button type="button" onClick={toggle} className="hub-menu-popup__appearance" aria-label={`Appearance: switch to ${theme === 'light' ? 'dark' : 'light'} theme`}>
                <span>Appearance</span>
                <Icon name={theme === 'light' ? 'moon' : 'sun'} className="size-[22px]" />
              </button>
              <button
                type="button"
                onClick={() => void handleSignOut()}
                className="focus-visible:outline-2 focus-visible:outline-accent"
              >
                <Icon name="logout" className="size-[22px]" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </header>
      <div className="hub-fixed-header-spacer" aria-hidden="true" />

      <main className="space-y-6 px-4 pb-8 pt-5 sm:px-6">
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

        <section aria-label="Staroot Hub modules" className="space-y-2 pt-5">
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

        <section aria-labelledby="coming-soon-title" className="space-y-3 text-center" style={{ marginTop: 65 }}>
          <h2 id="coming-soon-title" className="text-xs font-medium uppercase tracking-[0.12em] text-muted/70">Coming soon</h2>
          <ul className="mx-auto grid max-w-[420px] grid-cols-2 gap-2.5">
            {COMING_SOON.map((item) => (
              <li key={item.id} aria-disabled="true" className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-dashed border-muted/45 px-3 py-2 text-sm text-muted/85">
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
