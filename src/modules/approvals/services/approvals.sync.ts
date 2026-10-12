// Registers one sync handler per outbox action type. The server is idempotent on the id we send, so a
// retried send never duplicates. Call registerApprovalHandlers() in main.tsx BEFORE syncEngine.start().
import { apiFetch } from '../../../core/api/client'
import { ENDPOINTS } from '../../../core/api/endpoints'
import { syncEngine } from '../../../core/offline'
import { OUTBOX_TYPES } from './approvals.service'

interface QueuedItem {
  id: string
  payload: unknown
}

/**
 * ASSUMPTION: syncEngine.registerHandler(type, async (item) => { ... }) where a thrown ApiError is
 * classified by the engine (409 -> needs_review, other 4xx -> failed, 5xx/network -> retry).
 * If your Phase 2 signature differs, fix it here and nowhere else.
 */
const send = (path: string) => async (item: QueuedItem) => {
  await apiFetch(path, { method: 'POST', body: { ...(item.payload as Record<string, unknown>), client_id: item.id } })
}

export function registerApprovalHandlers() {
  syncEngine.registerHandler(OUTBOX_TYPES.submit, send(ENDPOINTS.approvalsSubmit))
  syncEngine.registerHandler(OUTBOX_TYPES.decide, send(ENDPOINTS.approvalsDecide))
  syncEngine.registerHandler(OUTBOX_TYPES.resubmit, send(ENDPOINTS.approvalsResubmit))
}
