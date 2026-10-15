import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Req, Res } from '../../../api/_lib/http'
import type { SiteReport } from '../../../src/modules/site-progress/types'
import type { AuthContext } from '../../../api/_lib/auth'
import { canApproveReport } from '../../../src/modules/site-progress/report-workflow'

const state = vi.hoisted(() => ({ actor: {} as AuthContext, report: {} as SiteReport, fields: {} as Record<string, unknown> }))
vi.mock('../../../api/_lib/auth', () => ({ authenticate: async () => state.actor, assertCsrf: vi.fn() }))
vi.mock('../../../api/_lib/rbac', () => ({ requireAccess: async () => 'department' }))
vi.mock('../../../api/_lib/siteRepo', () => ({
  changeReportAtomically: async (_id: string, change: (report: SiteReport) => Promise<Record<string, unknown>>) => { state.fields = await change(state.report); return { ...state.report, ...state.fields } },
  listProfilesByIds: async () => [{ user_id: 'author', department: 'operations' }],
  getProject: async () => ({ $id: 'project', name: 'Project', status: 'active' }),
  isConflict: () => false,
  findReportByClientId: async () => null,
  createReport: async (fields: Record<string, unknown>) => { state.fields = fields; return { ...state.report, ...fields } },
}))
vi.mock('../../../api/_lib/sitePhotos', () => ({ recordPhotos: async () => [] }))
import endpoint from '../../../api/site/reports'

const timestamp = '2026-10-15T09:00:00.000Z'
const snapshot = { disclaimer: 'Site update', projects: [{ project_id: 'project', project_name: 'Project', sections: [{ id: 'c762e50a-15e8-4e8b-b02e-9716de993eb2', title: 'Structure', bullets: ['Masonry 92% complete'], photo_ids: [] }] }] }
async function request(body: unknown, method = 'PUT') {
  let result: unknown
  const res = { statusCode: 200, setHeader: vi.fn(), end: (body: string) => { result = JSON.parse(body) } } as unknown as Res
  await endpoint({ method, body, headers: {} } as Req, res)
  return { status: res.statusCode, result }
}
beforeEach(() => {
  state.actor = { userId: 'manager', email: 'manager@example.test', profile: { user_id: 'manager', email: 'manager@example.test', display_name: 'Manager', role: 'manager', department: 'operations', active: true, is_admin: false } }
  state.report = { $id: 'report', $createdAt: timestamp, $updatedAt: timestamp, client_id: 'id', title: 'Monthly report', report_date: timestamp, author_id: 'author', author_name: 'Author', schema_version: 1, status: 'pending', snapshot: JSON.stringify(snapshot) }
  state.fields = {}
})
describe('project report approval and updates', () => {
  it('creates new reports as pending, never final', async () => {
    expect((await request({ client_id: '30c752f7-0dd7-4086-b57f-d93bfed4486b', title: 'New report', report_date: timestamp, snapshot }, 'POST')).status).toBe(200)
    expect(state.fields.status).toBe('pending')
  })
  it('rejects a client-supplied approval status on creation', async () => {
    expect((await request({ client_id: '30c752f7-0dd7-4086-b57f-d93bfed4486b', title: 'New report', report_date: timestamp, snapshot, status: 'final' }, 'POST')).status).toBe(400)
  })
  it('a different manager approves the exact pending revision', async () => {
    expect((await request({ action: 'approve', report_id: 'report', base_updated_at: timestamp })).status).toBe(200)
    expect(state.fields).toMatchObject({ status: 'final', approved_by: 'manager' })
    expect(state.fields.approved_at).toBeTruthy()
    expect(state.fields).not.toHaveProperty('snapshot')
  })
  it('rejects self approval', async () => {
    state.actor.userId = 'author'
    expect((await request({ action: 'approve', report_id: 'report', base_updated_at: timestamp })).status).toBe(403)
  })
  it('rejects non-manager approval', async () => {
    state.actor.profile.role = 'site_engineer'
    expect((await request({ action: 'approve', report_id: 'report', base_updated_at: timestamp })).status).toBe(403)
  })
  it('rejects managers outside the report department', async () => {
    state.actor.profile.department = 'sales'
    expect((await request({ action: 'approve', report_id: 'report', base_updated_at: timestamp })).status).toBe(403)
  })
  it('rejects approval of an outdated revision', async () => {
    expect((await request({ action: 'approve', report_id: 'report', base_updated_at: '2026-10-14T09:00:00.000Z' })).status).toBe(409)
  })
  it.each(['final', 'published', 'superseded'] as const)('locks %s reports against editing and approval', async (status) => {
    state.report.status = status
    expect((await request({ action: 'approve', report_id: 'report', base_updated_at: timestamp })).status).toBe(409)
    expect((await request({ action: 'edit', report_id: 'report', base_updated_at: timestamp, title: 'Correction', report_date: timestamp, snapshot })).status).toBe(409)
  })
  it('keeps author edits pending', async () => {
    state.actor.userId = 'author'
    expect((await request({ action: 'edit', report_id: 'report', base_updated_at: timestamp, title: 'Updated report', report_date: timestamp, snapshot })).status).toBe(200)
    expect(state.fields.title).toBe('Updated report')
    expect(state.fields).not.toHaveProperty('status')
    expect(state.fields.snapshot).toBe(JSON.stringify(snapshot))
  })
  it('prevents another user editing a report', async () => {
    expect((await request({ action: 'edit', report_id: 'report', base_updated_at: timestamp, title: 'Edited', report_date: timestamp, snapshot })).status).toBe(403)
  })
  it('never enables approval for a final report in the UI', () => {
    expect(canApproveReport({ ...state.report, status: 'final' }, { role: 'manager', id: 'manager' })).toBe(false)
  })
})
