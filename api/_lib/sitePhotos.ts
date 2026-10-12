import type { PhotoRecord } from '../../src/modules/site-progress/types'
import { assertPhotoAccess, createPhoto, findPhotoByClientId, isConflict } from './siteRepo'
import { HttpError } from './http'

export interface CapturedPhotoMeta {
  id: string
  captured_at_client: string
  gps_lat: number | null
  gps_lng: number | null
  gps_accuracy_m: number | null
}

export function verifyCapture(meta: CapturedPhotoMeta, now = Date.now()) {
  const capturedAt = Date.parse(meta.captured_at_client)
  const skew = Math.round(Math.abs(now - capturedAt) / 1000)
  const reasons: string[] = []
  if (meta.gps_lat == null || meta.gps_lng == null) reasons.push('no_gps')
  if (skew > 300) reasons.push('clock_skew')
  if (capturedAt > now + 60_000) reasons.push('future_capture')
  if (now - capturedAt > 24 * 60 * 60 * 1000) reasons.push('stale_capture')
  return { skew_seconds: skew, reasons, verification: reasons.length ? 'unverified' as const : 'verified' as const }
}

function matches(photo: PhotoRecord, meta: CapturedPhotoMeta, userId: string, collection: PhotoRecord['owner_collection'], ownerId: string) {
  return photo.uploaded_by === userId && photo.file_id === meta.id && photo.owner_collection === collection && photo.owner_id === ownerId &&
    photo.captured_at_client === meta.captured_at_client && photo.gps_lat === meta.gps_lat &&
    photo.gps_lng === meta.gps_lng && photo.gps_accuracy_m === meta.gps_accuracy_m
}

/** Creates immutable verification metadata only after its final parent record exists. */
export async function recordPhotos(userId: string, collection: 'site_logs' | 'reports' | 'movements', ownerId: string, metas: CapturedPhotoMeta[]): Promise<PhotoRecord[]> {
  const saved: PhotoRecord[] = []
  for (const meta of metas) {
    await assertPhotoAccess(meta.id, userId)
    const existing = await findPhotoByClientId(meta.id)
    if (existing) {
      if (!matches(existing, meta, userId, collection, ownerId)) throw new HttpError(409, 'Photo is already attached to another record', 'conflict')
      saved.push(existing)
      continue
    }
    const result = verifyCapture(meta)
    try {
      saved.push(await createPhoto({
        client_id: meta.id, file_id: meta.id, owner_collection: collection, owner_id: ownerId,
        captured_at_client: meta.captured_at_client, gps_lat: meta.gps_lat, gps_lng: meta.gps_lng,
        gps_accuracy_m: meta.gps_accuracy_m, skew_seconds: result.skew_seconds,
        verification: result.verification, reasons: result.reasons, uploaded_by: userId,
      }))
    } catch (error) {
      if (!isConflict(error)) throw error
      const replay = await findPhotoByClientId(meta.id)
      if (!replay || !matches(replay, meta, userId, collection, ownerId)) throw new HttpError(409, 'Photo is already attached to another record', 'conflict')
      saved.push(replay)
    }
  }
  return saved
}
