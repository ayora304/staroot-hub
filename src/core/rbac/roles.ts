export const ROLES = ['executive', 'manager', 'sales_marketing', 'ops_frontoffice', 'site_engineer'] as const
export type Role = (typeof ROLES)[number]

export const DEPARTMENTS = ['executive', 'operations', 'sales', 'marketing'] as const
export type Department = (typeof DEPARTMENTS)[number]

export const MODULE_IDS = ['hub', 'approvals', 'crm', 'site', 'inventory', 'notifications', 'admin'] as const
export type ModuleId = (typeof MODULE_IDS)[number]

export type Scope = 'own' | 'department' | 'all'
export type Action = 'read' | 'write' | 'approve'

export interface PermissionRow {
  role: Role
  module: ModuleId
  can_read: boolean
  can_write: boolean
  can_approve: boolean
  scope: Scope
}

export interface Profile {
  user_id: string
  email: string
  display_name: string
  role: Role
  department: Department
  is_admin: boolean
  active: boolean
}

export const ROLE_LABELS: Record<Role, string> = {
  executive: 'Executive',
  manager: 'Manager',
  sales_marketing: 'Sales & Marketing',
  ops_frontoffice: 'Operations & Front Office',
  site_engineer: 'Site Engineer',
}
