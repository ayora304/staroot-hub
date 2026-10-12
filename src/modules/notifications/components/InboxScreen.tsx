import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError, apiFetch, isNetworkError } from '../../../core/api/client'
import { ENDPOINTS } from '../../../core/api/endpoints'
import { Button } from '../../../core/ui/Button'
import { EmptyState } from '../../../core/ui/EmptyState'
import { Skeleton } from '../../../core/ui/Skeleton'

interface Item { id: string; type: string; title: string; body: string; link: string; read: boolean; created_at: string }

export function InboxScreen() {
  const navigate = useNavigate()
  const [items, setItems] = useState<Item[] | null>(null)
  const [unread, setUnread] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [offline, setOffline] = useState(false)

  const load = useCallback(async () => {
    setError(null)
    setOffline(false)
    try {
      const r = await apiFetch<{ items: Item[]; unread: number }>(ENDPOINTS.notificationsList)
      setItems(r.items)
      setUnread(r.unread)
    } catch (e) {
      if (isNetworkError(e)) setOffline(true)
      else setError(e instanceof ApiError ? e.message : 'Something went wrong.')
    }
  }, [])
  useEffect(() => { void load() }, [load])

  async function open(n: Item) {
    if (!n.read) await apiFetch(ENDPOINTS.notificationsRead, { method: 'POST', body: { ids: [n.id] } }).catch(() => undefined)
    if (n.link) navigate(n.link)
    else void load()
  }
  async function markAll() {
    await apiFetch(ENDPOINTS.notificationsRead, { method: 'POST', body: { all: true } }).catch(() => undefined)
    void load()
  }

  if (offline) return <EmptyState title="You are offline" body="Your inbox needs a connection." action={<Button variant="secondary" onClick={() => void load()}>Try again</Button>} />
  if (error) return <EmptyState title="Could not load your inbox" body={error} action={<Button variant="secondary" onClick={() => void load()}>Try again</Button>} />
  if (!items) return <div className="mx-auto max-w-xl space-y-3 p-4 pt-safe"><Skeleton className="h-16" /><Skeleton className="h-16" /></div>

  return (
    <div className="mx-auto max-w-xl space-y-4 p-4 pt-safe pb-safe">
      <header className="flex items-center justify-between">
        <div>
          <Link to="/" className="text-sm text-muted">← Hub</Link>
          <h1 className="text-2xl font-semibold text-text">Inbox</h1>
        </div>
        {unread > 0 && <Button variant="secondary" onClick={() => void markAll()}>Mark all read</Button>}
      </header>
      {items.length === 0 ? <EmptyState title="All caught up" body="Notifications about your requests and approvals show up here." /> : (
        <ul className="space-y-2" aria-label="Notifications">
          {items.map((n) => (
            <li key={n.id}>
              <button onClick={() => void open(n)} className={`w-full rounded-2xl border p-4 text-left focus-visible:outline-2 focus-visible:outline-accent ${n.read ? 'border-border bg-surface' : 'border-accent/60 bg-surface-2'}`}>
                <p className={`text-sm ${n.read ? 'text-muted' : 'font-semibold text-text'}`}>{n.title}</p>
                {n.body && <p className="mt-0.5 text-sm text-muted">{n.body}</p>}
                <p className="mt-1 text-xs text-muted">{new Date(n.created_at).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' })}</p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
