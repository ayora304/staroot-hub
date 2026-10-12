import { useCallback, useEffect, useState } from 'react'
import { ApiError, isNetworkError } from '../../../core/api/client'
import { getApproval, listApprovals, type ApprovalDetail, type ApprovalSummary } from '../services/approvals.service'
import type { ApprovalTab } from '../types'

interface Loadable<T> {
  data: T | null
  loading: boolean
  error: string | null
  offline: boolean
  reload: () => void
}

function useLoad<T>(load: (signal: AbortSignal) => Promise<T>, key: string): Loadable<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [offline, setOffline] = useState(false)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const ctrl = new AbortController()
    setLoading(true)
    setError(null)
    setOffline(false)
    load(ctrl.signal)
      .then((d) => setData(d))
      .catch((e: unknown) => {
        if (ctrl.signal.aborted) return
        if (isNetworkError(e)) setOffline(true)
        else setError(e instanceof ApiError ? e.message : 'Something went wrong.')
      })
      .finally(() => !ctrl.signal.aborted && setLoading(false))
    return () => ctrl.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, tick])

  return { data, loading, error, offline, reload: useCallback(() => setTick((t) => t + 1), []) }
}

export function useApprovalsList(tab: ApprovalTab): Loadable<ApprovalSummary[]> {
  const r = useLoad((s) => listApprovals(tab, s).then((x) => x.items), `list:${tab}`)
  return r
}

export function useApprovalDetail(id: string): Loadable<ApprovalDetail> {
  return useLoad((s) => getApproval(id, s), `detail:${id}`)
}
