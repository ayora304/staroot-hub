# Test Matrix

## Unit (Vitest)
| Area | Cases |
|---|---|
| Routing | Below threshold, exactly at threshold (routes up), above, no matching rule, overlapping rules by priority, inactive rule, currency mismatch |
| RBAC | Each role x module x action x scope; deactivated user; cross-department access denied |
| Outbox | Enqueue atomicity, ordering per entity, backoff schedule, permanent vs transient errors |
| Sync | Idempotent replay returns same result, 409 -> needs_review, auth expiry preserves queue |
| Conflict | Same field vs different field edits, stale `baseVersion` |
| Camera | Compression to max 1024px, quality target, EXIF/timestamp stamp |
| CRM | Stale after 48h (configurable), stage move requires note |
| Approvals | Reject/revision require comment, only assignee decides, audit event per transition |

## E2E (Playwright)
| Flow | Expected |
|---|---|
| Offline approval submit, reconnect | One approval, one `submitted` event, status Synced |
| Offline site log with 3 photos, reconnect | Photos upload first, then log; photo records created |
| Kill tab mid-sync, reopen | No duplicates, no loss |
| Two users edit same lead offline | Second sync hits `needs_review` |
| CRM drag + tap move | Both create `stage_change` activity with note |
| Unauthorized direct API call | 403, no data leaked |

## Device matrix (manual, Phase 7)
Android Chrome (installed), iOS Safari 16.4+ (installed and not installed), desktop Chrome/Edge. Check: install flow, camera + GPS permissions, push, airplane-mode cycle, low-storage warning.
