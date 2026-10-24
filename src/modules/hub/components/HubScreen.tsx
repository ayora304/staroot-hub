import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSession, usePermissions } from '../../../core/auth/useSession'
import { outboxStore, syncEngine, unsyncedCount, useSyncStatus } from '../../../core/offline'
import { InstallPrompt } from '../../../core/pwa/InstallPrompt'
import { useTheme } from '../../../core/theme/ThemeProvider'
import { Icon } from '../../../core/ui/Icons'
import { Bell, Menu, Mic, MicOff, Search, X } from 'lucide-react'
import { PushPrePrompt } from '../../notifications/components/PushPrePrompt'
import { useApprovalsList } from '../../approvals/hooks/use-approvals'
import { COMING_SOON, HUB_MODULES } from '../registry'
import type { HubBadges } from '../types'
import { ModuleCard } from './ModuleCard'
import '../hub-menu.css'
import '../hub-screen.css'

type SpeechRecognitionResult = { transcript: string }
type SpeechRecognitionEvent = { results: ArrayLike<ArrayLike<SpeechRecognitionResult>> }
type SpeechRecognition = {
  lang: string
  interimResults: boolean
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}
type SpeechRecognitionConstructor = new () => SpeechRecognition
type SpeechWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor
  webkitSpeechRecognition?: SpeechRecognitionConstructor
}

// Unsynced and approval badges are sourced from the live queue and cached/API reads.
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
  const pendingApprovals = useApprovalsList('pending_mine', can('approvals', 'read'))
  const [menuOpen, setMenuOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [voiceMessage, setVoiceMessage] = useState('')
  const { theme, toggle } = useTheme()
  const searchInputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const unsynced = unsyncedCount(sync)

  useEffect(() => () => recognitionRef.current?.stop(), [])

  if (!session) return null
  const { profile } = session
  const badges: HubBadges = { pendingActions: { approvals: pendingApprovals.data?.length ?? 0 }, unsynced }
  const visible = HUB_MODULES.filter((module) => can(module.id, 'read'))
  const normalizedQuery = query.trim().toLocaleLowerCase()
  const filtered = normalizedQuery
    ? visible.filter((module) => `${module.label} ${module.blurb}`.toLocaleLowerCase().includes(normalizedQuery))
    : visible

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

  function handleVoiceSearch() {
    setVoiceMessage('')
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      return
    }
    const SpeechRecognitionAPI = (window as SpeechWindow).SpeechRecognition ?? (window as SpeechWindow).webkitSpeechRecognition
    if (!SpeechRecognitionAPI) {
      searchInputRef.current?.focus()
      setVoiceMessage('Voice search is unavailable here. Type to search instead.')
      return
    }
    try {
      const recognition = new SpeechRecognitionAPI()
      recognition.lang = navigator.language || 'en-US'
      recognition.interimResults = false
      recognition.onresult = (event) => {
        const transcript = event.results[0]?.[0]?.transcript?.trim()
        if (transcript) setQuery(transcript)
      }
      recognition.onerror = () => {
        setVoiceMessage('Could not hear that. Try typing your search.')
        setIsListening(false)
      }
      recognition.onend = () => setIsListening(false)
      recognitionRef.current = recognition
      setIsListening(true)
      recognition.start()
    } catch {
      setIsListening(false)
      setVoiceMessage('Could not start voice search. Try typing instead.')
    }
  }

  const initials = profile.display_name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('') || 'U'

  return (
    <div className="hub-screen relative isolate min-h-screen">
      <div aria-hidden="true" className="hub-background pointer-events-none fixed inset-0 z-0" />
      <div className="relative z-10 mx-auto min-h-screen max-w-5xl pb-safe">
        <header className="hub-fixed-header fixed inset-x-0 top-0 z-50 border-b border-transparent bg-transparent">
          <div className="hub-header-content relative mx-auto max-w-5xl px-safe pb-3 pt-safe">
            <div className="hub-topbar">
              <div className="hub-topbar__identity">
                <button
                  type="button"
                  onClick={() => setMenuOpen((open) => !open)}
                  aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                  aria-expanded={menuOpen}
                  className="hub-icon-button"
                >
                  {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
                </button>
                <p className="hub-user-name">{profile.display_name}</p>
              </div>
              <div className="hub-topbar__actions">
                <Link to="/m/notifications" aria-label="Open inbox" className="hub-icon-button hub-notification-link">
                  <Bell aria-hidden="true" />
                </Link>
                <button
                  type="button"
                  onClick={() => setMenuOpen((open) => !open)}
                  aria-label="Open profile menu"
                  aria-expanded={menuOpen}
                  className="hub-profile-button"
                >
                  {initials}
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
                <button type="button" onClick={() => void handleSignOut()} className="focus-visible:outline-2 focus-visible:outline-accent">
                  <Icon name="logout" className="size-[22px]" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </header>
        <div className="hub-fixed-header-spacer" aria-hidden="true" />

        <main className="hub-main">
          {offline && (
            <div role="status" className="hub-status hub-status--warning">
              <Icon name="wifiOff" className="size-5 shrink-0" />
              Offline. Showing your last known access. Changes will sync when you reconnect.
            </div>
          )}
          {unsynced > 0 && (
            <div role="status" className="hub-status hub-status--sync">
              <span>{syncMessage(sync, unsynced)}</span>
              {sync.failed > 0 && (
                <button type="button" onClick={() => void syncEngine.retryAllFailed()} className="hub-retry-button">Retry</button>
              )}
            </div>
          )}

          <InstallPrompt />
          <PushPrePrompt />

          <section className="hub-search-section" aria-label="Search Staroot Hub modules">
            <label className="hub-search-box">
              <Search aria-hidden="true" className="hub-search-icon" />
              <input
                ref={searchInputRef}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search..."
                aria-label="Search modules"
              />
            </label>
            <button
              type="button"
              onClick={handleVoiceSearch}
              className={`hub-mic-button${isListening ? ' is-listening' : ''}`}
              aria-label={isListening ? 'Stop voice search' : 'Search by voice'}
              title={isListening ? 'Stop voice search' : 'Search by voice'}
            >
              {isListening ? <MicOff aria-hidden="true" /> : <Mic aria-hidden="true" />}
            </button>
            <p className="sr-only" aria-live="polite">{voiceMessage || `${filtered.length} modules found`}</p>
          </section>
          {voiceMessage && <p role="status" className="hub-voice-message">{voiceMessage}</p>}

          <section aria-label="Staroot Hub modules" className="hub-modules-section">
            <div className="hub-section-heading">
              <h1>Your workspace</h1>
              <span>{filtered.length} {filtered.length === 1 ? 'module' : 'modules'}</span>
            </div>
            {filtered.length > 0 ? (
              <div className="hub-module-grid">
                {filtered.map((module) => (
                  <ModuleCard
                    key={module.id}
                    module={module}
                    pending={module.id === 'approvals' ? badges.pendingActions.approvals : 0}
                  />
                ))}
              </div>
            ) : (
              <p className="hub-empty-search">No modules match “{query}”. Try another search.</p>
            )}
          </section>

          <div className="hub-side-rail">
            <section className="hub-feature-section" aria-label="Staroot Hub testimonial card">
              <img
                className="hub-feature-card-art"
                src="/assets/hub-testimonial-card.svg"
                alt="Gold testimonial card with a charcoal offset backing, large opening and closing quotation marks, body copy, author name, and job title."
              />
            </section>

            <section aria-labelledby="coming-soon-title" className="hub-coming-soon">
              <h2 id="coming-soon-title">Coming soon</h2>
              <div className="hub-coming-soon__rail">
                {COMING_SOON.map((item) => (
                  <span key={item.id} aria-disabled="true" className="hub-coming-chip">
                    <Icon name={item.icon} className="size-4 shrink-0" />
                    {item.label}
                  </span>
                ))}
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  )
}
