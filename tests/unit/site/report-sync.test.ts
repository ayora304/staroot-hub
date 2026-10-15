import { describe, expect, it, vi } from 'vitest'
import { createReportSchema } from '../../../api/_lib/siteSchemas'

const mocks = vi.hoisted(() => ({ fetch: vi.fn(async () => ({})), handlers: new Map<string, (item: unknown, context: unknown) => Promise<void>>() }))
vi.mock('../../../src/core/api/client', () => ({ apiFetch: mocks.fetch, apiUpload: vi.fn(), isNetworkError: () => false }))
vi.mock('../../../src/core/offline/db', () => ({ readCache: { get: vi.fn(), set: vi.fn() } }))
vi.mock('../../../src/core/offline', () => ({
  syncEngine: { registerHandler: (name: string, handler: (item: unknown, context: unknown) => Promise<void>) => mocks.handlers.set(name, handler) },
  outboxStore: {}, SyncError: Error,
}))
import { registerSiteHandlers } from '../../../src/modules/site-progress/services/site-progress.service'

describe('report outbox protocol', () => {
  it('syncs legacy queued reports without trusting the client author name', async () => {
    registerSiteHandlers()
    const id = '30c752f7-0dd7-4086-b57f-d93bfed4486b'
    await mocks.handlers.get('site.report')!({ id, payload: {
      title: 'Project report', report_date: '2026-10-15T12:00:00.000Z', author_name: 'Untrusted client name', photos: [],
      snapshot: { disclaimer: 'Site update', projects: [{ project_id: 'project', project_name: 'Project', sections: [{ id, title: 'Structure', bullets: ['Progress'], photo_ids: [] }] }] },
    } }, {})
    const options = (mocks.fetch.mock.calls as unknown as Array<[string, { body: unknown }]>)[0][1]
    expect(createReportSchema.safeParse(options.body).success).toBe(true)
    expect(options.body).not.toHaveProperty('author_name')
  })
})
