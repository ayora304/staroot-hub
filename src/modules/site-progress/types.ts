import type { PhotoRecord } from '../../core/evidence/types'

export type SiteStatus = 'on_track' | 'delayed' | 'blocked'
export type { CapturedPhoto, PhotoRecord, PhotoVerification } from '../../core/evidence/types'

export interface SiteProject {
  $id: string
  name: string
  slug: string
  location?: string | null
  status: 'active' | 'archived'
  sort_order?: number
}

export interface Contractor {
  $id: string
  name: string
  trade: string
  project_id: string
  progress_pct: number
  active: boolean
}

export interface SiteLog {
  $id: string
  $createdAt: string
  $updatedAt?: string
  client_id: string
  project_id: string
  contractor_id: string
  log_date: string
  work_done: string
  materials_used?: string | null
  blockers?: string | null
  status: SiteStatus
  progress_pct?: number | null
  photo_ids: string[]
  engineer_id: string
  local_status?: 'pending' | 'syncing' | 'failed' | 'needs_review'
  photos?: PhotoRecord[]
}

export interface ReportSection {
  id: string
  title: string
  bullets: string[]
  photo_ids: string[]
}

export interface ReportProjectSection {
  project_id: string
  project_name: string
  sections: ReportSection[]
}

export interface ReportSnapshot {
  disclaimer: string
  projects: ReportProjectSection[]
}

export interface SiteReport {
  $id: string
  $createdAt: string
  client_id: string
  title: string
  report_date: string
  author_id: string
  author_name: string
  schema_version: number
  snapshot: string
  status: 'published' | 'superseded'
  local_status?: 'pending' | 'syncing' | 'failed' | 'needs_review'
  photos?: PhotoRecord[]
}
