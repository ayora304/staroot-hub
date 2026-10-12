export type PhotoVerification = 'verified' | 'unverified'

export interface CapturedPhoto {
  id: string
  blob: Blob
  fileName: string
  captured_at_client: string
  gps_lat: number | null
  gps_lng: number | null
  gps_accuracy_m: number | null
}

export interface PhotoRecord {
  $id: string
  client_id: string
  file_id: string
  owner_collection: 'site_logs' | 'reports' | 'movements'
  owner_id?: string | null
  captured_at_client: string
  gps_lat?: number | null
  gps_lng?: number | null
  gps_accuracy_m?: number | null
  skew_seconds?: number | null
  verification: PhotoVerification
  reasons: string[]
  uploaded_by: string
}
