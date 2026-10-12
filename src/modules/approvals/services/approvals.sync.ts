// Registers one sync handler per outbox action type. The server is idempotent on the id we send, so a
// retried send never duplicates. Call registerApprovalHandlers() in main.tsx BEFORE syncEngine.start().
import { apiFetch, apiUpload } from '../../../core/api/client'
import { ENDPOINTS } from '../../../core/api/endpoints'
import { SyncError, syncEngine, type HandlerContext, type OutboxItem } from '../../../core/offline'
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
  const { __local_category: _localCategory, ...payload } = item.payload as Record<string, unknown>
  await apiFetch(path, { method: 'POST', body: { ...payload, client_id: item.id } })
}

export function registerApprovalHandlers() {
  syncEngine.registerHandler(OUTBOX_TYPES.submit, async (item: OutboxItem, ctx: HandlerContext) => {
    const { __attachment_blobs: raw, ...payload } = item.payload as Record<string, unknown>
    const metadata = Array.isArray(raw) ? raw as Array<{ blob_id: string; filename: string; content_type: string }> : []
    const attachment_ids: string[] = []
    for (const file of metadata) {
      const blob = await ctx.getBlob(file.blob_id)
      if (!blob) throw new SyncError('fatal', 'A queued attachment is missing from this device.')
      const uploaded = await apiUpload<{ file_id: string }>(ENDPOINTS.approvalsUpload, blob, { uploadId: file.blob_id, fileName: file.filename })
      attachment_ids.push(uploaded.file_id)
    }
    await apiFetch(ENDPOINTS.approvalsSubmit, { method: 'POST', body: { ...payload, attachment_ids, client_id: item.id } })
  })
  syncEngine.registerHandler(OUTBOX_TYPES.decide, send(ENDPOINTS.approvalsDecide))
  syncEngine.registerHandler(OUTBOX_TYPES.resubmit, send(ENDPOINTS.approvalsResubmit))
}
