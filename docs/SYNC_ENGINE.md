# Sync Engine

## Goals
No data loss, no duplicates, honest status, works on iOS Safari without Background Sync.

## Local stores (Dexie)
- `outbox`: `{ id (UUID = client_id), type, payload, blobRefs[], attempts, status, nextAttemptAt, lastError, createdAt }`
- `blobs`: `{ id, blob, mime, size }` for photos and attachments (not base64 strings)
- `cache_*`: per-collection read caches, keyed per user
- `meta`: sync cursors, device ID, schema version

`status`: `pending` -> `syncing` -> `synced` | `failed` | `needs_review`.

## Write flow
1. One Dexie transaction: optimistic row + outbox entry + blobs.
2. UI shows the item immediately with a sync chip.
3. Engine picks entries in `createdAt` order, **per entity** (so a lead move never overtakes its creation).

## Triggers
`online` event, `visibilitychange` to visible, app start, periodic timer while open, manual "Retry", and Background Sync (feature-detected, Chromium only). iOS relies on the first four.

## Backoff
Exponential with jitter: 5s, 15s, 45s, 2m, 5m, then every 15m. Permanent errors (4xx validation/permission) stop retrying and move to `failed` with the server message. 401 triggers re-login without discarding the outbox.

## Delivery
- Photos first: upload with `client_id`; server returns `file_id` and verification result. Resumable via chunking; retry resumes from the last confirmed chunk.
- Then the parent record references `file_id`s. Parent is never sent before its photos succeed.
- Every request carries `client_id`; the server returns the original result for repeats.

## Conflict policy
| Data | Rule |
|---|---|
| Append-only (notes, activities, events, movements, reports) | No conflict possible; insert, ordered by server time |
| Editable records (leads, items, approvals) | Each record has `version`. Client sends `baseVersion` + changed fields only |
| Same field changed by two people | Server rejects with 409 + current value; entry becomes `needs_review` and the user chooses |
| Different fields changed | Field-level merge accepted automatically |
| Approvals | Decision applies only if still `pending` and actor is assignee; otherwise rejected with the current state |
| Stock | Movements are deltas; quantity is derived server-side, so concurrent movements never overwrite each other |

Client timestamps are stored for display only and never decide outcomes.

## Status surfaced to users
Per item chip (Pending, Syncing, Synced, Failed + retry, Needs review) and a global count on the Hub and dock.

## Storage safety
Call `navigator.storage.persist()` after login; check `navigator.storage.estimate()` and warn below 50 MB or 80% use. Never purge the outbox automatically. Synced blobs are deleted locally after confirmed upload plus a 7-day grace.

## Testing
Unit: backoff, ordering, idempotent replay, conflict classification, blob lifecycle. E2E: offline create then reconnect, kill app mid-sync, duplicate delivery, 409 flow.
