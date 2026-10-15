import type { SiteReport } from './types'
import type { Role } from '../../core/rbac/roles'

export function isFinalReport(report: Pick<SiteReport, 'status'>) {
  return report.status === 'final' || report.status === 'published'
}

export function canApproveReport(report: Pick<SiteReport, 'status' | 'author_id'>, actor: { role: Role; id: string }) {
  return report.status === 'pending' && actor.role === 'manager' && actor.id !== report.author_id
}
