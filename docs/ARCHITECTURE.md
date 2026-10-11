# Architecture

## 1. Overview
Staroot Hub is an offline-first PWA. The browser holds a local copy of what the user may see and a durable **outbox** of pending writes. A thin serverless API enforces RBAC, validates input and writes to Appwrite.

```
 Browser (PWA)                                   Server
 ┌──────────────────────────────┐        ┌───────────────────────────┐
 │ React UI (modules/*)         │        │ api/* serverless functions│
 │   │ reads/writes             │  HTTPS │  auth -> rbac -> validate │
 │ core/offline (Dexie)         │◄──────►│  -> idempotency -> write  │
 │   ├ cache tables (read)      │        │          │                │
 │   └ outbox + blob store      │        │          ▼                │
 │ Service worker (Workbox)     │        │  Appwrite: DB + Storage   │
 │   shell cache, push, sync    │        │  Web Push (VAPID)         │
 └──────────────────────────────┘        └───────────────────────────┘
```

## 2. Layers and boundaries
- `src/core/*`: shared infrastructure (auth, rbac, offline, push, api client, camera, export, theme, ui). **Never imports from `modules/`.**
- `src/modules/*`: one folder per feature, each with `components/`, `services/`, `hooks/`, `types.ts`, `index.ts`. **Modules import from `core/` only, never from each other.** Cross-module needs go through `core/` or the Hub.
- `api/*`: one file per endpoint. All start with the same pipeline: authenticate session, load profile, check RBAC, zod-validate, check idempotency, act, log to `sync_audit`.
- `api/_lib/*`: shared server helpers.

## 3. Request pipeline (server)
1. Verify session cookie; reject if the user is missing, inactive, or off-domain.
2. Load `users_profiles` and `role_permissions`; check module + action + scope.
3. Validate body with zod (reject unknown fields).
4. Idempotency: look up `client_id`; if present, return the stored result, do not re-apply.
5. Apply business rules (routing, stock, stage rules) using **server time**.
6. Write; append events/audit rows; enqueue notifications.
7. Return canonical record (with `$updatedAt`, `version`).

## 4. Read path
UI reads from Dexie cache tables first (instant, works offline), then refreshes from the API when online (stale-while-revalidate). Cache is keyed per user and wiped on sign-out.

## 5. Write path
UI action -> validate locally -> write optimistic row + outbox entry in one Dexie transaction -> UI updates immediately -> sync engine delivers (see `SYNC_ENGINE.md`).

## 6. Module summaries
| Module | Key server endpoints | Key invariants |
|---|---|---|
| Hub | `/api/auth/session` | Cards come from `role_permissions`; badges from outbox + notifications |
| Approvals | `submit`, `decide`, `list` | Only current assignee decides; every transition appends an `approval_events` row |
| CRM | `leads`, `move-stage`, `activities`, `report` | Stage move requires a note; `last_contacted_at` set by server |
| Site Progress | `logs`, `photos`, `reports` | Photos verified server-side; published reports immutable |
| Inventory | `items`, `movements` | Stock changes only via movements; ledger append-only |
| Admin | `roles`, `projects`, `contractors`, `rules` | `is_admin` required |

## 7. Platform realities (flagged, with fallbacks)
| Limit | Fallback |
|---|---|
| Browsers cannot prove a photo is "live" | In-app `getUserMedia` capture only, timestamp + GPS stamp, server verification, "unverified" label when checks fail |
| iOS Safari lacks Background Sync | Sync on foreground, `online` event, and timers while open; outbox is durable across restarts |
| iOS Web Push works only for installed PWAs (16.4+) | In-app install guide; always mirror pushes in the in-app inbox |
| IndexedDB can be evicted under storage pressure | Request `navigator.storage.persist()`, show low-space warnings, surface unsynced counts |
| Client clocks are unreliable | Server timestamps decide ordering and conflicts |

## 8. Tech choices
React + TS + Vite, Tailwind, Framer Motion, Dexie, Workbox, zod, Appwrite, Web Push (VAPID), client-side PDF/DOCX export. Alternatives and reasons are logged in `DECISIONS.md`.
