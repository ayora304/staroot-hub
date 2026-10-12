import { useCallback, useEffect, useMemo, useState } from 'react'
import { isNetworkError } from '../../../core/api/client'
import { useSession } from '../../../core/auth/useSession'
import { outboxStore, useSyncStatus } from '../../../core/offline'
import type { Contractor, SiteLog, SiteProject, SiteReport } from '../types'
import { listContractors, listLogs, listProjects, listReports } from '../services/site-progress.service'

interface Loadable<T> { data: T | null; loading: boolean; error: string | null; offline: boolean; reload: () => void }

function useLoad<T>(load: (userId: string, signal: AbortSignal) => Promise<T>, key: string): Loadable<T> {
  const { session } = useSession()
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [offline, setOffline] = useState(false)
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    if (!session) { setData(null); setLoading(false); return () => controller.abort() }
    setLoading(true); setError(null); setOffline(false)
    load(session.user.id, controller.signal)
      .then(setData)
      .catch((e: unknown) => {
        if (controller.signal.aborted) return
        if (isNetworkError(e)) setOffline(true)
        else setError(e instanceof Error ? e.message : 'Could not load site data.')
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, tick, session?.user.id])
  return { data, loading, error, offline, reload: useCallback(() => setTick((n) => n + 1), []) }
}

export function useSiteProjects(): Loadable<SiteProject[]> {
  const sync = useSyncStatus()
  return useLoad(listProjects, `projects:${sync.online}:${sync.pending}:${sync.syncing}`)
}

export function useSiteContractors(projectId: string): Loadable<Contractor[]> {
  const sync = useSyncStatus()
  return useLoad((userId, signal) => projectId ? listContractors(userId, projectId, signal) : Promise.resolve([]), `contractors:${projectId}:${sync.online}:${sync.pending}:${sync.syncing}`)
}

export function useSiteLogs(projectId: string): Loadable<SiteLog[]> {
  const { session } = useSession()
  const sync = useSyncStatus()
  const result = useLoad((userId, signal) => projectId ? listLogs(userId, projectId, signal) : Promise.resolve([]), `logs:${projectId}:${sync.online}:${sync.pending}:${sync.syncing}:${sync.failed}:${sync.needsReview}`)
  const [states, setStates] = useState<Record<string, SiteLog['local_status']>>({})
  useEffect(() => {
    let active = true
    void outboxStore.list().then((items) => {
      if (!active) return
      const next: Record<string, SiteLog['local_status']> = {}
      for (const item of items.filter((row) => row.userId === session?.user.id && (row.type === 'site.log' || row.type === 'site.log.update'))) {
        next[item.id] = item.status
        const logId = (item.payload as { log_id?: unknown } | null)?.log_id
        if (typeof logId === 'string') next[logId] = item.status
      }
      setStates(next)
    })
    return () => { active = false }
  }, [sync.pending, sync.syncing, sync.failed, sync.needsReview, session?.user.id])
  const data = useMemo(() => result.data?.map((log) => ({ ...log, local_status: states[log.client_id] ?? states[log.$id] ?? log.local_status })), [result.data, states])
  return { ...result, data: data ?? null }
}

export function useSiteReports(): Loadable<SiteReport[]> {
  const { session } = useSession()
  const sync = useSyncStatus()
  const result = useLoad(listReports, `reports:${sync.online}:${sync.pending}:${sync.syncing}:${sync.failed}:${sync.needsReview}`)
  const [states, setStates] = useState<Record<string, SiteReport['local_status']>>({})
  useEffect(() => {
    let active = true
    void outboxStore.list().then((items) => {
      if (!active) return
      const next: Record<string, SiteReport['local_status']> = {}
      for (const item of items.filter((row) => row.userId === session?.user.id && row.type === 'site.report')) next[item.id] = item.status
      setStates(next)
    })
    return () => { active = false }
  }, [sync.pending, sync.syncing, sync.failed, sync.needsReview, session?.user.id])
  const data = useMemo(() => result.data?.map((report) => ({ ...report, local_status: states[report.client_id] ?? report.local_status })), [result.data, states])
  return { ...result, data: data ?? null }
}
