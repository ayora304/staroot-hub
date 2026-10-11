import { describe, expect, it } from 'vitest'
import roleMap from '../../../appwrite/seed/role_map.json'
import { can, canAccessRecord, canUseModule, scopeFor } from '../../../src/core/rbac/permissions'
import { MODULE_IDS, ROLES, type PermissionRow, type Profile } from '../../../src/core/rbac/roles'

const rows = roleMap.permissions as unknown as PermissionRow[]
const prof = (over: Partial<Profile>): Pick<Profile, 'role' | 'active' | 'is_admin'> => ({ role: 'site_engineer', active: true, is_admin: false, ...over })

describe('seed role map', () => {
  it('has no duplicate role+module rows and only valid values', () => {
    const seen = new Set<string>()
    for (const r of rows) {
      const k = `${r.role}:${r.module}`
      expect(seen.has(k)).toBe(false)
      seen.add(k)
      expect(ROLES).toContain(r.role)
      expect(MODULE_IDS).toContain(r.module)
    }
  })
  it('lets every role read the hub and notifications', () => {
    for (const role of ROLES) {
      expect(can(rows, role, 'hub', 'read')).toBe(true)
      expect(can(rows, role, 'notifications', 'read')).toBe(true)
    }
  })
})

describe('canUseModule', () => {
  it('only executive and manager can approve', () => {
    for (const role of ROLES) {
      const expected = role === 'executive' || role === 'manager'
      expect(canUseModule(rows, prof({ role }), 'approvals', 'approve')).toBe(expected)
    }
  })
  it('site engineers cannot see CRM; sales cannot see site progress', () => {
    expect(canUseModule(rows, prof({ role: 'site_engineer' }), 'crm')).toBe(false)
    expect(canUseModule(rows, prof({ role: 'sales_marketing' }), 'site')).toBe(false)
  })
  it('admin module requires is_admin regardless of role', () => {
    expect(canUseModule(rows, prof({ role: 'executive', is_admin: false }), 'admin')).toBe(false)
    expect(canUseModule(rows, prof({ role: 'manager', is_admin: true }), 'admin')).toBe(true)
  })
  it('denies everything for inactive users', () => {
    expect(canUseModule(rows, prof({ role: 'executive', is_admin: true, active: false }), 'hub')).toBe(false)
    expect(canUseModule(rows, prof({ role: 'executive', is_admin: true, active: false }), 'admin')).toBe(false)
  })
  it('denies unknown role/module combinations', () => {
    expect(can([], 'executive', 'hub', 'read')).toBe(false)
  })
})

describe('scope and record access', () => {
  const actor = { userId: 'u1', department: 'sales' as const }
  it('reads scope from the table', () => {
    expect(scopeFor(rows, 'executive', 'crm')).toBe('all')
    expect(scopeFor(rows, 'site_engineer', 'crm')).toBeNull()
  })
  it('own scope: only owned or assigned', () => {
    expect(canAccessRecord('own', actor, { ownerId: 'u1' })).toBe(true)
    expect(canAccessRecord('own', actor, { assigneeId: 'u1' })).toBe(true)
    expect(canAccessRecord('own', actor, { ownerId: 'u2', department: 'sales' })).toBe(false)
  })
  it('department scope: same department or own', () => {
    expect(canAccessRecord('department', actor, { ownerId: 'u2', department: 'sales' })).toBe(true)
    expect(canAccessRecord('department', actor, { ownerId: 'u2', department: 'marketing' })).toBe(false)
  })
  it('all scope: everything', () => {
    expect(canAccessRecord('all', actor, { ownerId: 'u9', department: 'executive' })).toBe(true)
  })
})
