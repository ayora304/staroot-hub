import type { CapturedPhoto, PhotoRecord } from '../../core/evidence/types'

export interface InventoryItem {
  $id: string
  $createdAt?: string
  sku: string
  name: string
  category?: string | null
  kind: 'consumable' | 'returnable'
  unit: string
  quantity_on_hand: number
  reorder_level?: number | null
  active: boolean
  version: number
}

export type MovementType = 'dispatch' | 'receipt' | 'return' | 'adjustment'
export interface Movement {
  $id: string
  $createdAt: string
  client_id: string
  item_id: string
  type: MovementType
  quantity: number
  from_location?: string | null
  to_location?: string | null
  custodian_id?: string | null
  project_id?: string | null
  note?: string | null
  photo_ids: string[]
  occurred_at_client?: string | null
  recorded_by: string
  local_status?: 'pending' | 'syncing' | 'failed' | 'needs_review'
  photos?: PhotoRecord[]
  item_name?: string
}

export interface MovementInput {
  item_id: string
  type: MovementType
  quantity: number
  base_version: number
  from_location?: string
  to_location?: string
  custodian_id?: string
  project_id?: string
  note?: string
  occurred_at_client: string
  photos: CapturedPhoto[]
}
