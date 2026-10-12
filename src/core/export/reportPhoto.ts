import { outboxStore } from '../offline'

export async function getReportPhoto(report: { $id: string; local_status?: string }, fileId: string): Promise<Blob | null> {
  if (report.local_status) {
    const local = await outboxStore.getBlob(fileId)
    if (local) return local
  }
  try {
    const url = `/api/site/photo?file_id=${encodeURIComponent(fileId)}&owner_id=${encodeURIComponent(report.$id)}&owner_collection=reports`
    const response = await fetch(url, { credentials: 'include' })
    return response.ok ? await response.blob() : null
  } catch { return null }
}
