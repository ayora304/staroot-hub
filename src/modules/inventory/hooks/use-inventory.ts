import { useCallback, useEffect, useMemo, useState } from 'react'
import { isNetworkError } from '../../../core/api/client'
import { useSession } from '../../../core/auth/useSession'
import { outboxStore, useSyncStatus } from '../../../core/offline'
import type { InventoryItem, Movement } from '../types'
import { getCached, listItems, listMovements } from '../services/inventory.service'

export function useInventory() {
  const { session } = useSession()
  const sync = useSyncStatus()
  const [items, setItems] = useState<InventoryItem[]>([])
  const [movements, setMovements] = useState<Movement[]>([])
  const [loading, setLoading] = useState(true)
  const [offline, setOffline] = useState(false)
  const [error, setError] = useState('')
  const [queued, setQueued] = useState<Record<string, Movement['local_status']>>({})
  const [revision, setRevision] = useState(0)
  const reload = useCallback(() => setRevision((n) => n + 1), [])
  useEffect(() => {
    if (!session) { setLoading(false); return }
    const controller = new AbortController()
    setLoading(true); setError(''); setOffline(false)
    Promise.all([listItems(session.user.id, controller.signal), listMovements(session.user.id, controller.signal)])
      .then(([nextItems, nextMovements]) => { if (!controller.signal.aborted) { setItems(nextItems); setMovements(nextMovements) } })
      .catch(async (reason: unknown) => {
        if (controller.signal.aborted) return
        if (isNetworkError(reason)) {
          setOffline(true)
          const [cachedItems, cachedMovements] = await Promise.all([getCached<InventoryItem[]>(session.user.id, 'inventory-items', 'active'), getCached<Movement[]>(session.user.id, 'inventory-movements', 'all')])
          if (!controller.signal.aborted) { setItems(cachedItems ?? []); setMovements(cachedMovements ?? []) }
        } else setError(reason instanceof Error ? reason.message : 'Could not load inventory.')
      }).finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [session?.user.id, revision, sync.pending, sync.syncing, sync.failed, sync.needsReview])
  useEffect(() => {
    let active = true
    void outboxStore.list().then((rows) => { if (active) setQueued(Object.fromEntries(rows.filter((row) => row.userId === session?.user.id && row.type === 'inventory.movement').map((row) => [row.id, row.status]))) })
    return () => { active = false }
  }, [sync.pending, sync.syncing, sync.failed, sync.needsReview, session?.user.id])
  const visibleMovements = useMemo(() => movements.map((row) => ({ ...row, local_status: queued[row.client_id] ?? row.local_status })), [movements, queued])
  return { items, movements: visibleMovements, loading, offline, error, reload, sync }
}
