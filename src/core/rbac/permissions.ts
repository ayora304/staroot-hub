// Pure functions shared by the browser (UI hiding) and api/ (real enforcement).
// Keep this file free of runtime imports so it runs anywhere.
import type { Action, Department, ModuleId, PermissionRow, Profile, Role, Scope } from './roles'

export function can(rows: PermissionRow[], role: Role, module: ModuleId, action: Action): boolean {
  const row = rows.find((r) => r.role === role && r.module === module)
  if (!row) return false
  if (action === 'read') return row.can_read
  if (action === 'write') return row.can_write
  return row.can_approve
}

export function scopeFor(rows: PermissionRow[], role: Role, module: ModuleId): Scope | null {
  return rows.find((r) => r.role === role && r.module === module)?.scope ?? null
}

/** The single gate used everywhere. Inactive users are always denied; admin module needs is_admin. */
export function canUseModule(
  rows: PermissionRow[],
  profile: Pick<Profile, 'role' | 'active' | 'is_admin'>,
  module: ModuleId,
  action: Action = 'read',
): boolean {
  if (!profile.active) return false
  if (module === 'admin') return profile.is_admin
  return can(rows, profile.role, module, action)
}

export interface Actor {
  userId: string
  department: Department
}
export interface RecordOwnership {
  ownerId?: string
  assigneeId?: string
  department?: Department
}

/** Row-level visibility given the scope returned by scopeFor. */
export function canAccessRecord(scope: Scope, actor: Actor, record: RecordOwnership): boolean {
  if (scope === 'all') return true
  const mine = record.ownerId === actor.userId || record.assigneeId === actor.userId
  if (scope === 'own') return mine
  return mine || record.department === actor.department
}
