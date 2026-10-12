import type { IconName } from '../../core/ui/Icons'
import type { ModuleId } from '../../core/rbac/roles'

export interface HubModule {
  id: ModuleId
  label: string
  blurb: string
  icon: IconName
  route: string
  /** Build phase in which the real screen arrives (placeholder until then). */
  phase: number
}

export const HUB_MODULES: HubModule[] = [
  { id: 'approvals', label: 'Approvals', blurb: 'Petty cash, procurement, leave and contract sign-offs', icon: 'approvals', route: '/m/approvals', phase: 3 },
  { id: 'notifications', label: 'Inbox', blurb: 'Updates on your requests and decisions waiting for you', icon: 'bell', route: '/m/notifications', phase: 3 },
  { id: 'crm', label: 'CRM · Coming Soon', blurb: 'Leads, pipeline and client follow-ups', icon: 'crm', route: '/m/crm', phase: 4 },
  { id: 'site', label: 'Site Progress', blurb: 'Daily logs, photo evidence and executive reports', icon: 'site', route: '/m/site', phase: 5 },
  { id: 'inventory', label: 'Inventory & Logistics', blurb: 'Dispatch, receipt and asset custody', icon: 'inventory', route: '/m/inventory', phase: 6 },
  { id: 'admin', label: 'Administration', blurb: 'Roles, projects, contractors and approval rules', icon: 'admin', route: '/m/admin', phase: 7 },
]

export interface ComingSoon {
  id: string
  label: string
  icon: IconName
}

export const COMING_SOON: ComingSoon[] = [
  { id: 'leasing', label: 'Leasing', icon: 'leasing' },
  { id: 'maintenance', label: 'Maintenance', icon: 'maintenance' },
  { id: 'finance', label: 'Finance', icon: 'finance' },
  { id: 'analytics', label: 'Analytics', icon: 'analytics' },
]
