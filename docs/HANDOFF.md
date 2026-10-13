# Staroot Hub: Project Handoff Brief

*For any agent picking this up. Last updated Sunday, 11 October 2026 (Phase 1 code written). Location in repo: `docs/HANDOFF.md`.*

---

## 1. Current state

**Phase 0 is complete. Phase 1 code is written but has not been installed or built yet.** Feature modules (Approvals, CRM, Site Progress, Inventory) are not started; their routes show a placeholder.

| Item | Status |
|---|---|
| Phase 0: docs, 16 collection definitions, seeds, permissions policy | Done |
| Toolchain: `package.json`, Vite 6, TypeScript, Tailwind v4, vite-plugin-pwa, Vitest | **Written (Phase 1)** |
| Service worker (Workbox precache, SPA navigation, push + click handlers) | **Written (Phase 1)** |
| Auth: `api/auth/session.ts` (login/session), `api/auth/logout.ts`, sign-in screen, offline session cache | **Written (Phase 1)** |
| RBAC: shared `src/core/rbac/permissions.ts`, server `requireAccess`, UI `RequireRole` | **Written + unit-tested** |
| Theme (dark gold + light), UI primitives, install prompt, update banner | **Written (Phase 1)** |
| Hub: role-filtered module cards, Coming Soon cards, badges (zero until Phase 2/3) | **Written (Phase 1)** |
| `scripts/appwrite-setup.ts` (creates collections, attributes, indexes, seeds) | **Written, untested against Appwrite** |
| Placeholder icons and favicon (original, replace with real branding) | Done |
| Everything else under `src/core/offline`, `src/core/push`, `src/core/camera`, `src/core/export`, `api/*` (other than auth), `src/modules/*` (other than hub) | Still `// TODO` stubs |

### Verification status (be honest about this)
- **Run and passing:** 15 unit tests for RBAC and email-domain logic (executed with Node type-stripping and a small Vitest stand-in), plus a strict `tsc` check of the pure files `roles.ts`, `permissions.ts`, `emailDomain.ts`.
- **Not yet run:** `npm install`, `npm run typecheck`, `npm run build`, `npm run dev`, the real Vitest run, the Appwrite setup script, and any browser testing. The sandbox that wrote this code had no network.
- **First task for the next agent:** run `npm install && npm run typecheck && npm test && npm run build`, fix any version or typing errors (dependency versions and the `node-appwrite` v14 call signatures are the most likely culprits), then log the result in the changelog.

**Next step: Phase 2** (offline outbox and sync engine with tests). Verify Phase 1 first.

**Placeholders to replace before go-live:** approval thresholds and currency in `appwrite/seed/approval_rules.json`, sample projects in `appwrite/seed/projects.json`, and the placeholder icons in `public/icons/`.

## 2. What we are building

**Staroot Hub** is a new internal Progressive Web App for Staroot Real Estate (Nairobi, Kenya). It is a single installable "everything app" that replaces paper, Excel sheets and WhatsApp approvals. It must work **offline** in basements and on remote construction sites, then sync when connectivity returns.

**It is a greenfield rebuild.** The company previously had a prototype called "Staroot Asset Tracker" (codebase folder `miral-pwa`). **Do not copy, reuse or imitate any of it**: no files, naming, structure or assets. Use original branding placeholders. The old prototype's concepts informed the requirements, but the new design is independent.

---

## 3. Tech stack

- **Frontend:** React + TypeScript + Vite, Tailwind CSS, Framer Motion
- **Backend:** Appwrite (Auth, Databases, Storage, Functions) behind a thin serverless API layer in `api/` for any trusted logic
- **Offline:** IndexedDB via Dexie (data and photo blobs), Workbox service worker
- **Exports:** PDF and DOCX generated client-side
- **Notifications:** Web Push with VAPID keys
- **Validation:** zod
- **Tests:** unit tests for sync, approval routing and RBAC, plus Playwright e2e for offline flows

---

## 4. Users and access

Five roles, **enforced server-side** (the UI only hides things):

1. **Executive (CEO):** global read, final approvals, dashboards
2. **Manager** (Operations, Sales, Marketing): read/write own department, approve/reject
3. **Sales & Marketing staff:** CRM, leads, marketing assets
4. **Operations & Front Office:** logistics, dispatch, submit requests, add leads
5. **Site Engineers / Field Staff:** site progress, photos, asset custody

Rules:

- Individual accounts only. **No shared logins.**
- Sign-up is restricted to a configurable company email domain (`ALLOWED_EMAIL_DOMAIN` env var).
- The role map lives in a database collection that admins can edit.

---

## 5. Modules

### 5.1 Hub
A role-aware home screen showing only modules the user can access. "Coming Soon" cards for Leasing, Maintenance, Finance and Analytics. Badges for pending actions and unsynced items.

### 5.2 Approvals Engine
- Categories: `petty_cash`, `procurement`, `leave`, `contract`
- Dynamic forms per category, with attachments (receipt, quotation)
- Tabs: Pending My Action, My Submissions, Approved, Rejected
- Actions: Approve, Reject, Request Revision (a comment is required for reject and revision)
- **Routing rules are configurable data:** thresholds, currency (default KES), category to approver role. Boundary behaviour is defined explicitly (for example, amount >= threshold goes to the CEO).
- The server checks that the acting user is the current assignee.
- The audit trail is an **append-only** `approval_events` collection (who, what, when, from_status, to_status, comment). It is never edited.
- Requestor and next approver are notified (push plus in-app).

### 5.3 CRM
- Kanban pipeline: Prospect, Viewing Scheduled, Negotiation, Won, Lost
- Stage changes work by drag-and-drop **and** a tap-based move menu, with a quick note prompted on each move
- Stale-lead flag after 48 hours without contact (configurable)
- Lead profile: tap-to-call, tap-to-WhatsApp, activity timeline
- Managers get a rep filter, pipeline velocity, and a monthly conversion report exported to PDF/DOCX
- Notes and activities are separate append-only records, not a JSON blob
- Lead sources: `social_media`, `referral`, `website`, `walk_in`

### 5.4 Site Progress & Reporting
This merges two overlapping modules from the original document.

- Projects and contractors are **admin-managed data**, not hard-coded
- Site dashboard: project selector, contractor grid with % progress bars
- Daily log: date, contractor, work done, materials used, blockers, status (`on_track | delayed | blocked`)
- Photo evidence: in-app camera capture only (no gallery upload), up to 3 per section, compressed to max 1024px at about 0.65 quality, stamped with timestamp and GPS
- The server verifies photos (timestamp skew, GPS presence) and marks them **"unverified"** rather than silently accepting
- 3-step Report Builder wizard: (1) global metadata and disclaimers, (2) per-project sections with headers, bullets and photos (repeatable), (3) publish, sync, export
- Reports archive: searchable, with status chips (Local / Syncing / Synced / Error)
- Full-screen document viewer, then branded PDF and Word export

### 5.5 Inventory & Logistics
- Dispatch and receipt of assets (marketing materials, tents, etc.)
- Items flagged consumable or returnable; stock counts update globally
- Asset custody: who holds what, where, since when
- Photo proof per movement, searchable movement log
- One-tap dispatch summary for drivers (shareable text, for example WhatsApp)

---

## 6. Offline and sync design

This is the riskiest part, so it gets built **before** the feature modules.

- Every write goes to an **IndexedDB outbox** first. The UI never waits on the network.
- Each queued action has: client UUID (idempotency key), type, payload, blob references, attempt count, status.
- Sync triggers: the `online` event, app foreground/visibility change, periodic retry with backoff, and Background Sync where supported. It must work acceptably on **iOS Safari, which has no Background Sync**.
- Server endpoints are idempotent, so retries never create duplicates.
- Photos upload first (resumably); metadata is written only after the file succeeds.
- **Conflicts:** server-assigned timestamps (never client clocks), field-level merge for edits, append-only for notes and audit events, and a "needs review" state for genuine conflicts instead of silent overwrite.
- Sync status is visible everywhere: Pending, Syncing, Synced, Failed with retry.
- Persistent storage is requested, with a warning on low space.

### Notifications
- Web Push (VAPID). Permission is requested after login via a friendly pre-prompt, not cold.
- Subscriptions are stored per device.
- iOS only supports push for installed PWAs, so an in-app install guide is required.
- Every push is mirrored in an in-app inbox.

### Security
- Server-side RBAC on every endpoint and every Appwrite collection permission
- HttpOnly secure session cookies or Appwrite sessions, plus CSRF protection
- Rate limiting, zod input validation, file type and size limits
- Never trust client role claims or client timestamps for decisions
- Secrets in env vars only; `.env.example` stays current

### Design
- Mobile-first, thumb-friendly, one-handed use on site
- Dark gold "luxury" theme plus a light theme; high contrast and large tap targets for sunlight
- Skeletons, empty states, optimistic UI, clear error recovery
- Accessible: keyboard navigation, ARIA labels, reduced-motion support
- Original branding placeholders only

---

## 7. Decisions made and why

These fix flaws in the original document. Do not undo them.

1. **Per-user accounts** instead of shared team credentials (shared logins cannot support roles or audit).
2. **IndexedDB, not localStorage, for offline data.** The original stored base64 photos in localStorage, which caps at about 5 MB and fails.
3. **Server timestamps and field-level merge** instead of "Last Write Wins" on client timestamps (phone clocks are unreliable).
4. **Audit logs and notes are separate append-only collections**, not stringified JSON inside one field.
5. **Thresholds, currency and routing are configurable data**, not code. Edge cases such as exactly the threshold amount are defined.
6. **Browser limits are flagged honestly.** "Mandatory live photo" cannot be fully enforced in a browser, so the design uses in-app capture plus server verification. Background Sync does not exist on iOS Safari, and iOS Web Push only works for installed PWAs (16.4+).
7. **Project names are data**, not code (no hard-coded Gemini or Venus Oak).
8. **Two overlapping "3.4" modules merged** into one Site Progress & Reporting module.
9. **Added `photo_records`** (per-photo verification state) and **`role_permissions`** (admin-editable role map). That makes 16 collections, not the original 14.
10. **Published reports are immutable JSON snapshots.** A correction creates a new report that supersedes the old one.
11. **Clients never write to Appwrite directly.** All writes and most reads go through `api/` so RBAC and idempotency are enforced server-side.
12. **Approval thresholds in the seed are placeholders** (KES). The owner must confirm them.
13. **Sessions are Appwrite sessions in an HttpOnly cookie**, with a double-submit CSRF cookie. No custom HMAC token.
14. **Tailwind v4 with CSS-variable tokens.** Components use token classes, never raw hex.
15. **Service worker never caches `/api/*`.** Offline writes belong to the outbox (Phase 2).
16. **The last session is cached in IndexedDB** so the app opens offline; it is re-verified on the `online` event.
17. **`src/core/rbac/permissions.ts` is shared by browser and API.** Keep it free of runtime imports.

Full log with consequences: `docs/DECISIONS.md` (D1 to D19).

---

## 8. Repository layout

```text
staroot-hub/
├── CHANGELOG.md                  # newest-first work log (see section 10)
├── README.md   .env.example   .gitignore
├── scripts/add-changelog.ps1     # stamped changelog entries
├── docs/                         # ARCHITECTURE, DATA_MODEL, RBAC_MATRIX, SYNC_ENGINE,
│                                 # SECURITY, DEPLOYMENT, DECISIONS, TEST_MATRIX
├── appwrite/
│   ├── collections/*.json        # 16 collection definitions
│   ├── permissions.md
│   └── seed/                     # role_map, approval_rules, projects
├── api/                          # serverless TypeScript endpoints
│   ├── _lib/                     # appwrite, auth, rbac, validate, rateLimit,
│   │                             # idempotency, push, photoVerify
│   └── auth/  approvals/  crm/  site/  inventory/  sync/  push/  admin/
├── public/                       # manifest.webmanifest, offline.html, icons/
├── src/
│   ├── app/                      # App, router, providers
│   ├── sw/service-worker.ts
│   ├── core/                     # shared infrastructure
│   │   └── auth/  rbac/  offline/  push/  api/  config/
│   │       export/  camera/  theme/  ui/  utils/
│   ├── modules/                  # one folder per feature
│   │   ├── hub/  approvals/  crm/  site-progress/
│   │   ├── inventory/  notifications/  admin/
│   │   └── each has: components/ services/ hooks/ index.ts types.ts
│   └── styles/index.css
└── tests/                        # unit/ (sync, approvals, rbac, crm, camera) and e2e/
```

**Boundary rule:** modules depend on `core/`, never on each other. `core/` never imports from `modules/`.

**Phase 1 additions to the layout:** `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.sw.json`, `index.html`, `src/main.tsx`, `src/vite-env.d.ts`, `src/styles/index.css`, `src/core/pwa/` (install prompt, update banner, SW registration), `src/core/theme/ThemeToggle.tsx`, `src/core/auth/RequireAuth.tsx`, `src/modules/hub/registry.ts` (module list), `src/modules/hub/components/ModulePlaceholder.tsx`, `src/app/ErrorBoundary.tsx`, `scripts/appwrite-setup.ts`, `public/favicon.svg`, `public/icons/icon-{180,192,512}.png`. The stub `src/core/rbac/RequireRole.tsx` is now the module route gate. Stubs no longer needed can be deleted (for example `src/core/ui/BottomDock.tsx`, `src/core/ui/Modal.tsx`, `src/core/ui/BottomSheet.tsx` until a phase needs them).

---

## 9. Data model (planned Appwrite collections)

**16 collections:** `users_profiles`, `role_permissions`, `projects`, `contractors`, `inventory_items`, `movements`, `photo_records`, `site_logs`, `reports`, `approvals`, `approval_events`, `approval_rules`, `leads`, `lead_activities`, `notifications`, `sync_audit`.

Full field lists and indexes: `docs/DATA_MODEL.md` (generated from the same spec as `appwrite/collections/*.json`). Permission policy: `appwrite/permissions.md`.

Key points:
- Every client-originated record has a unique `client_id` (idempotency key).
- Append-only: `movements`, `approval_events`, `lead_activities`, `photo_records`, `reports`, `sync_audit`. No update/delete path may be added.
- Approval ranges are `[min_amount, max_amount)`: an amount exactly at a threshold routes to the higher approver.
- Clients never write to Appwrite directly. Reads go through the API, except a user's own notifications and profile.
- Attachments and photos are arrays of Storage file IDs; per-photo verification lives in `photo_records`.

---

## 10. Working rules for any agent

1. **Read** `docs/` and this brief before changing anything.
2. **Work phase by phase**, and stop and summarise after each:

   | Phase | Scope |
   |---|---|
   | 0 | Architecture doc, data model, folder structure, env setup **(DONE)** |
   | 1 | Auth, RBAC, app shell, theme, Hub, PWA install and service worker **(CODE WRITTEN, build unverified)** |
   | 2 | Offline outbox and sync engine with tests **(NEXT)** |
   | 3 | Approvals Engine |
   | 4 | CRM |
   | 5 | Site Progress & Reporting, PDF/DOCX export |
   | 6 | Inventory & Logistics |
   | 7 | Hardening: security review, offline test matrix, performance, Lighthouse PWA audit, deployment guide |

3. **Log every completed task** with:

   ```powershell
   .\scripts\add-changelog.ps1 -Agent "<your name>" -Phase "<n>" -Type <Added|Changed|Fixed|Removed|Security|Docs|Decision> -Message "..." -Files "a","b"
   ```

   The header is stamped automatically in UTC+3 (Nairobi time). Entry format:

   ```markdown
   ## [2026-10-11 143005] Sunday | UTC+3 | Agent: Claude
   - **Phase:** 2
   - **Type:** Added
   - **Status:** Done
   - **Summary:** Built the IndexedDB outbox and idempotent sync queue
   - **Files:**
     - `src/core/offline/outbox.ts`
   ```

   **Never edit past entries.**
4. **Never trust the client** for roles or timestamps.
5. **Flag anything the browser cannot do** and propose the best alternative instead of faking it.
6. After each phase, report what is **done, mocked, and how to run it**.
7. Secrets go in env vars only. Keep `.env.example` current.
8. Write typed, tested, production-quality code, with unit tests for sync, routing rules and RBAC.

---

## 11. Phase 1 reference (how the pieces work)

**Sign-in flow.** `POST /api/auth/session` with email + password. The server rate-limits by IP and email, checks the exact email domain against `ALLOWED_EMAIL_DOMAIN`, creates an Appwrite session with the admin client, then requires a verified email and an active `users_profiles` row (otherwise it deletes the session again). It sets `staroot_session` (HttpOnly) and `staroot_csrf` (readable, double-submit) cookies and returns `{ user, profile, permissions }` for that role only.

**Every later request.** `authenticate(req)` reads the cookie, asks Appwrite for the user, re-checks domain, verification and active profile, and returns an `AuthContext`. Mutating requests also call `assertCsrf(req)`. Endpoints then call `requireAccess(ctx, module, action)` which loads `role_permissions` (60 s cache) and returns the row scope. **New endpoints must follow this exact order.**

**Client.** `AuthProvider` loads the session on start and on the `online` event. If the network is down and a cached session exists in IndexedDB (`meta` table, key `session`) it opens in offline mode. A 401 or 403 wipes local data. `apiFetch` sends cookies and the CSRF header and throws `ApiError`; `isNetworkError` detects offline.

**RBAC.** One function decides: `canUseModule(rows, profile, module, action)`. Inactive users are always denied; the `admin` module needs `profile.is_admin`; everything else reads the `role_permissions` table. `canAccessRecord(scope, actor, record)` handles row-level visibility.

**Hub.** `HUB_MODULES` in `src/modules/hub/registry.ts` is the single list of modules. The router builds one gated route per entry; each shows `ModulePlaceholder` until its phase ships (swap the element in `src/app/router.tsx`). `COMING_SOON` drives the greyed cards.

**PWA.** `vite-plugin-pwa` in `injectManifest` mode compiles `src/sw/service-worker.ts`. Update flow: new SW waits, `UpdateBanner` appears, tapping Update sends `SKIP_WAITING` and reloads. Manifest is `public/manifest.webmanifest`. iOS shows manual install steps.

**Theme.** `data-theme` on `<html>` switches CSS variables in `src/styles/index.css`. Preference is stored in `localStorage` (UI only). `theme-color` meta updates with the theme.

**Known gaps and mocks in Phase 1**
- Hub badges are hard-coded to zero (`BADGES` in `HubScreen.tsx`). Phase 2 supplies the unsynced count, Phase 3 the pending approvals.
- `clearAllLocalData()` will destroy unsynced outbox items on sign-out. Phase 2 must block or warn first.
- Rate limiting is in-memory per server instance (`api/_lib/rateLimit.ts`). Replace in Phase 7.
- No sign-up or password reset UI. Accounts are created in Appwrite, then a `users_profiles` row is added by hand (see `docs/DEPLOYMENT.md`).
- `api/` handlers use a Node `(req, res)` signature and extensionless relative imports. Confirm the chosen host's bundler accepts both before deploying.
- The `/api` dev proxy points at `API_DEV_TARGET` (default `http://localhost:3001`). Nothing serves it yet; local login needs whatever host tooling is chosen.
- Push: the service worker handles `push` and `notificationclick`, but subscribing and sending arrive in Phase 3.

---

## 12. Open questions (confirm with the owner before building)

- Approval threshold amounts and currency (seed values in `approval_rules.json` are placeholders; the original said $10,000, we default to KES)
- The real company email domain
- The actual project and contractor lists to seed (`projects.json` holds sample data)
- Whether Appwrite is cloud or self-hosted
- Where the serverless layer will be deployed (Vercel was used before, but it is not decided)

---

## 13. Change history of this brief

- **Phase 1 code written (11 Oct 2026):** toolchain, service worker, auth endpoints and UI, shared RBAC with tests, theme, UI primitives, Hub, Appwrite setup script, placeholder icons. Added decisions D15 to D19. Build not yet verified (see section 1).
- **Phase 0 completed (11 Oct 2026):** wrote 8 docs, 16 collection definitions, permissions policy, 3 seed files and README. Added collections `photo_records` and `role_permissions`. Added decisions 9 to 12. See `CHANGELOG.md` for stamped entries.

## Update log — 12 October 2026

- `npm install` completed successfully. npm reported 5 vulnerabilities (3 moderate, 2 critical); inspect with `npm audit` before choosing remediation.
- `npm test` passed: 6 test files passed, 5 skipped; 62 tests passed and 5 are TODO/skipped.
- The initial `npm run typecheck` and `npm run build` both stopped on two TypeScript errors. Fixed the unused `actorOf` import in `api/approvals/resubmit.ts` and changed the approval service to call `syncEngine.enqueue(...)`, matching the actual sync-engine API.
- **Still to verify:** rerun `npm run typecheck` and `npm run build` after these fixes. Do not treat the previous `dist/` output as current until the build passes.
- **Next agent:** first run those two verification commands and append their results here. Then continue the open Phase 3a/Phase 2 closeout items in the repository-root `HANDOFF.md`; review the audit findings separately. Preserve this append-only update log.

## Update log — 12 October 2026 (continued)

- The repository-root `HANDOFF.md` is the current detailed progress record; the earlier status above is historical and was not rewritten.
- Phase 2 closeout: approval sync handlers register before the sync engine starts. Confirmed sign-out warns before clearing the separate outbox, and auth cache clearing leaves that outbox intact. Local queued approval submissions/resubmissions are visible with their queue state.
- Phase 3a: `PHASE3_APPLY.md` was not found in the workspace. The idempotent `npm run setup:appwrite` path ran and the approvals collections/indexes reported as already existing.
- Phase 3b implementation: added offline approval attachments, private server upload/download endpoints, Web Push server/client subscription flow and Hub prompt, per-user cached approval reads, queued request visibility, and a live pending-approval badge. The setup script and `.env.example` include private attachment bucket and VAPID configuration.
- Current verification: typecheck passes; unit tests pass (62 passed, 5 TODO/skipped). The latest build attempt was interrupted; rerun it after the final changes. A previous build passed before attachment changes.
- The local VAPID key pair is stored only in ignored `.env`. The Appwrite attachments bucket was **not** created: the elevated request was rejected. Attachment runtime verification remains pending until that private bucket is created. Review the 5 npm audit findings (3 moderate, 2 critical) separately.
- Next: create/verify the private Appwrite attachments bucket, rerun setup and build, browser-test offline attachments and push, finish Phase 3b, then proceed to Phase 4 CRM. Continue this append-only log for future updates.

## Phase 3 closeout — 12 October 2026

- Created the private Appwrite `attachments` bucket successfully (file security on, no public permissions, 10 MiB limit, PDF/JPEG/PNG, encryption and antivirus). Full `npm run setup:appwrite` exited successfully; the approval collections/indexes already existed and seeds were checked.
- Latest typecheck and production build pass; known large-chunk warning remains. Unit tests: 62 pass, 5 TODO/skipped.
- Phase 3 implementation now includes offline file blobs/upload, approval-scoped attachment access, Web Push registration/delivery, per-user approval read cache, queued-request visibility, and live Hub approval badge.
- End-to-end browser validation awaits an API development host. VAPID secrets are local only and must be configured in the deployment environment.
- Phase 4 CRM is next. Append a dated handoff update and changelog entry at the end of Phase 4 before proceeding to Phase 5.

## Update log — 12 October 2026 (CRM deferred)

- CRM work is **pending by user direction**; Phase 4 and later phases are paused. Do not continue implementation until the user resumes it.
- The current diff contains a partial, unverified CRM foundation (types/domain helpers, Appwrite repository/schema helpers, and initial leads/move-stage API work). It is not a completed CRM phase.
- Phase 3 is the last completed phase. Browser/API-host end-to-end validation remains pending, and VAPID deployment secrets must be configured before production.
- When resumed, inspect the partial CRM diff and current PRD/handoff requirements before continuing. Keep appending handoff and changelog updates at each phase boundary.

## Update log — 12 October 2026 (Phase 3 verification recheck)

- Current `npm run typecheck` fails with four diagnostics in the deferred partial CRM files: unused imports and missing `queryParams` exports in `api/crm/detail.ts` and `api/crm/leads.ts`. Current full-tree build verification must wait until that partial Phase 4 state is repaired or cleanly excluded when CRM resumes.
- No API-host/browser end-to-end check was run: Vite proxies `/api` to `localhost:3001`, and the Vercel CLI is not installed.
- Required Appwrite/VAPID variables are configured in ignored local `.env`; secret values are not included here. VAPID deployment configuration remains a production follow-up.
- Phase 4 CRM and later phases remain pending at the user's direction.

## Correction — Phase 3 API smoke check (12 October 2026)

- A Vercel development server is running at `http://localhost:3000` even though its CLI is not installed in this shell. The Staroot Hub root returned HTTP 200; unauthenticated session, approval-list, and push-public-key requests returned HTTP 401, confirming the API routes are live and session protected.
- This does not verify signed-in flows, offline replay, attachment storage, push subscription/delivery, or Appwrite-backed access. Authenticated browser validation remains outstanding.

## Phase 5 closeout — 12 October 2026

- Delivered the Site Progress module with Appwrite-backed projects/contractors, contractor progress dashboard, offline daily logs, 24-hour author edit window, and scoped API access.
- Added camera-only evidence capture, compressed JPEGs up to 1024px/0.65 quality, visible timestamp/GPS stamp, max three photos per section, 3 MB upload cap and server verification labels. Photo files upload before the parent record; metadata rows are created once with the final owner to keep `photo_records` append-only.
- Added the three-step report builder, searchable archive, viewer, immutable report snapshots, and branded PDF/DOCX exports. Large export libraries are dynamically loaded.
- Appwrite rejected a new `proofs` bucket because the plan bucket quota was reached. The existing private `attachments` bucket is shared for site photos (`APPWRITE_BUCKET_PROOFS=attachments`). `npm run setup:proofs` verified it supports private JPEG evidence; the API enforces 3 MB regardless of the bucket's larger limit.
- Verification: `npm run typecheck` and `npm run build` pass. Build retains a 601 kB main chunk warning and about 1.8 MB of precache; Phase 7 will address performance. Authenticated browser/offline replay and new unit tests were not run. No sample contractors were fabricated; projects/contractors remain Appwrite-managed.
- CRM is marked **Coming Soon** and remains only TODO stubs. Phase 3 remains pending at the user's direction; no Phase 3 work was done during this phase.
- Next: Phase 6 Inventory & Logistics. Continue append-only handoff and changelog updates at every phase boundary.

## Phase 6 closeout — 12 October 2026

- Implemented the inventory catalogue and administrator-only item creation, stock cards with reorder-level flags, and inventory movement APIs with role-scoped searchable movement history.
- Added dispatch, receipt, return, and positive inbound adjustment flows. Server validation rejects stale item versions and insufficient stock. Item stock changes and append-only movement creation share an Appwrite DocumentsDB transaction. Returns are limited to recorded dispatch balance per item/custodian; only returnable items can be returned. Adjustment is inbound-only and administrator-only.
- Added camera photo evidence for movements using the private shared attachments bucket, 3 MB JPEG/API limit, and append-only `photo_records` after parent creation. Authenticated movement photo reads check the caller’s inventory scope.
- Added offline movement queueing with local stock/movement visibility, queue status, custody aggregation, searchable movement history, and a shareable dispatch summary.
- **Verification:** `npm run typecheck` passed and `npm run build` passed. The build still reports a 619 kB main bundle and about 1.8 MB of precache. No authenticated Appwrite movement transaction, camera upload, offline replay, or browser flow was run; no tests were added/run. Appwrite runtime support and schema access remain to be confirmed in an authenticated environment.
- CRM remains **Coming Soon**. Phase 3 remains pending by your direction. Phase 2 end-of-sequence verification remains deferred.
- **Next priority: Phase 7 — hardening, performance, offline/device checks, PWA review, and deployment guide.**

## Phase 7 closeout — 12 October 2026

- Hardened offline writes by storing the creating account ID on every new outbox item. The sync engine drains and exposes only rows for the active account. Dexie migration moves legacy ownerless queue rows to Needs review instead of sending them under whichever account signs in next. Sign-out clears session/read caches while preserving each owner’s queued rows/blobs for later resume.
- Added common API response security headers and changed login rate-limit identity selection to prefer hosting-edge client IP headers. The login limiter remains process-local; a shared provider is still required for reliable limits across serverless instances.
- Moved shared camera capture and photo evidence into `src/core/evidence/`, preserving the module boundary. Lazy-loaded feature routes, removed unused Framer Motion runtime usage, excluded large PDF/DOCX renderers from install precache, and added cache-after-first-use behavior for lazy JS chunks. Main bundle reduced from about 619 kB to 433 kB; precache reduced from about 1.8 MB to 691 kB.
- Added persistent-storage request on app startup, `docs/TEST_MATRIX.md`, and a production deployment guide in `docs/DEPLOYMENT.md`. Added query indexes for inventory item listing and movement/custody searches, and applied them to the configured Appwrite project with the idempotent setup script. Script exited successfully; indexes created: `inventory_items.ix_active_name`, `movements.ix_item_custodian`, and `movements.ix_type_time`. Existing CRM schema was only checked by that setup script; no CRM implementation was changed.
- **Verification:** `npm test` passes: 63 passed, 5 skipped, 5 todo. This includes sync-engine account isolation. `npm run build` passes; no >500 kB chunk warning remains. PWA precache is 691.32 KiB. `npm audit` and `npm audit --omit=dev` both report zero vulnerabilities. Local unauthenticated smoke checks returned 200 for the app shell and 401 for auth session, inventory items, inventory movements, and inventory photo routes, confirming authentication gates.
- The device/offline matrix, authenticated Appwrite movement/photo flow, and actual Lighthouse PWA audit have not been run. Production platform/domain, VAPID environment values, and a shared rate-limit provider remain deployment-owner actions. The deployment guide records these gates.
- Phase 2 unit-level sync verification now passes; its end-to-end/device closeout remains pending alongside the offline matrix. Phase 3 stays pending by user direction. CRM stays **Coming Soon** and was not coded. No Phase 3 or CRM work was resumed.
- **Phase 7 implementation is complete; release validation remains pending** as listed above. Continue to leave Phase 3 and CRM untouched unless the user reprioritizes them.

### Phase 7 runtime verification follow-up — 12 October 2026

- The local development server on port 3000 returns Vite fallback HTML for `/service-worker.js` (PWA dev mode is disabled); do not count that route as worker verification.
- Started Vite’s production preview on port 4173. `/manifest.webmanifest` and `/service-worker.js` returned 200; the worker response was `text/javascript`, 26,650 bytes, and its SHA-256 matched `dist/service-worker.js`. The preview server was stopped after verification.
- Computer-use inspection of the open Firefox window was rejected with “Computer Use was not approved to use Firefox.” No authenticated browser inspection or account workflow was attempted. The authenticated device/offline matrix and Lighthouse audit remain open release checks.

### Phase 7 release validation follow-up — 12 October 2026

- Rechecked the current workspace after the user approved opening the authenticated app. Firefox was open to Staroot Hub, but Computer Use stopped because URL policy enforcement is unsupported for this Windows browser. No authenticated workflow was inspected or changed.
- Current `npm run typecheck` passes. Current `npm run build` passes and generates the production service worker; the main application chunk is 433.10 kB and the precache is 691.32 KiB.
- Phase 7 implementation remains complete; release validation is still pending for the authenticated browser/device/offline matrix, Appwrite-backed movement/photo flows, and Lighthouse PWA audit. Phase 2 end-to-end/device closeout remains part of that matrix.
- Continue to keep Phase 3 on hold and CRM marked Coming Soon per user direction. Production deployment configuration (domain/platform, VAPID secrets, shared rate-limit provider) remains an owner action.

### Phase 2 sync verification follow-up — 12 October 2026

- Reran the current Vitest suite after the Phase 5–7 implementation. `npm test` passes: 63 passed, 5 skipped, 5 TODO; the sync engine suite now has 18 passing tests, including account isolation.
- The first sandboxed attempt failed before tests started (`spawn EPERM` from esbuild); rerunning with approved elevated execution completed successfully. This verifies unit-level sync behavior only; the two-account offline/device replay matrix is still outstanding and requires an authenticated browser/device environment.
- Phase 3 remains on hold per user direction. CRM remains Coming Soon and untouched.

### Phase 7 static response headers — 12 October 2026

- Runtime recheck found the static app shell lacked security headers even though API handlers set them. Added Vercel `vercel.json` headers for `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, and `Referrer-Policy: no-referrer`; documented the hosting requirement.
- Verified locally against the running Vercel host: `/` returns 200 with all three headers; `/api/inventory/items` remains 401 and retains `Permissions-Policy: camera=(), microphone=(), geolocation=()`. The static header rule intentionally does not set Permissions-Policy, preserving camera/location evidence capture.
- This closes the static-response header gap for Vercel. Recheck headers on the selected production host during deployment; if it is not Vercel, configure equivalent static response headers there.

### Phase 7 dependency audit follow-up — 12 October 2026

- Reran `npm audit` and `npm audit --omit=dev` against the current lockfile. Both report zero vulnerabilities.

## UI foundation update — 12 October 2026

- Applied the user’s current official palette rules to shared CSS tokens: dark backgrounds and card surfaces remain neutral near-black; light backgrounds and surfaces remain neutral white; blue shades are reserved for accents and selected elevated dark surfaces. Status colors remain independent.
- Updated the light theme status-bar color to white and aligned the DOCX report’s hard-coded brand/text colors with the shared report palette.
- Updated `uiscope.md` so the latest palette rules supersede earlier appended palette notes. The viewport retains pinch zoom and `viewport-fit=cover`; safe-area helpers cover page edges, fixed banners, and modals.
- **Verification:** `npm run build` passes, including both TypeScript projects and the Vite production build. Authenticated iOS/Android safe-area checks remain pending; no device matrix or Lighthouse audit was run in this UI pass.
- Phase 3 remains on hold by user direction. CRM remains Coming Soon and was not changed. Continue with Site Progress, Inventory, then Phase 7 UI review per the current scope.

### UI viewport behavior follow-up — 12 October 2026

- Disabled page pinch scaling in the viewport meta (`maximum-scale=1`, `user-scalable=no`) to give the installed PWA a stable app-like interaction. `viewport-fit=cover` remains enabled for safe areas.
- Set input, select, and textarea text to 16px to prevent iOS focus-triggered zoom.
- Updated `uiscope.md`; this supersedes the prior instruction to preserve page zoom. No feature workflow changed. Build/device verification was not run for this metadata and CSS-only update.

### Module screen top inset follow-up — 12 October 2026

- Updated `.pt-safe` so module screens and nested screens begin at least 15px below the top safe-area/status-bar inset, while retaining a 16px minimum on screens without an inset. Applied the same rule to `.safe-modal` top padding.
- Updated `uiscope.md` to document the shared top-spacing requirement. Existing module and nested-screen wrappers already use `.pt-safe`.
- No feature behavior changed. Build/device validation was not run for this CSS-only adjustment.

### Module screen spacing adjustment — 12 October 2026

- Increased the top gap after the safe-area/status-bar inset from 5px to 15px in `.pt-safe` and `.safe-modal`.
- Updated the current UI scope wording and snippets. This adjustment supersedes the preceding 5px spacing note.
- No build or device check was run for this CSS-only adjustment.

### Module screen spacing adjustment — 12 October 2026

- Added 10px to the top gap, increasing it from 15px to 25px beyond the safe-area/status-bar inset in `.pt-safe` and `.safe-modal`.
- Updated the current UI scope and code snippets. This supersedes the preceding 15px spacing note.
- No build or device check was run for this CSS-only adjustment.

### Template auth screens restored — 13 October 2026

- Added the supplied blue abstract Welcome panel, static sign-up screen, static sign-in screen, and a brand splash preview. Used a local inline SVG background illustration and the committed app icon for the Staroot mark; no remote visual assets were added.
- Added preview routes `/welcome`, `/signup`, `/login`, and `/splash`; unauthenticated protected routes now redirect to `/welcome`. Welcome/sign-up/sign-in links allow screen preview navigation.
- Per request, form submit buttons, password recovery, social providers, and splash timer/auth transitions are not wired. The existing auth provider remains in the app but the new login UI does not invoke it; re-enable auth behavior in a later implementation pass.
- Updated `uiscope.md` to reflect the visual-only auth screens.
- **Verification:** Pending typecheck and production build.
- **Post-change verification:** `npm run build` passed, including TypeScript, Vite production output, and service-worker generation.

### Welcome background under the status bar — 13 October 2026

- Added a mobile-only full-viewport fixed artwork layer for Welcome, with the Welcome text/navigation layered above it. Removed the mobile device-frame background treatment so the art reaches the viewport's top edge.
- Existing `index.html` configuration includes `viewport-fit=cover` and iOS `black-translucent` status-bar metadata. Validate on an installed iOS Home Screen app; browser tabs and Android WebAPK status-bar behavior remain platform-controlled.
- **Verification:** `npm run build` passed; `git diff --check` passed (only Git line-ending warnings).

### Welcome background image assets — 13 October 2026

- Copied five supplied images to `public/assets`: `welcome-rooftop.png`, `creative-nebula.png`, `rooftop-swimmer.png`, `courtyard-pool.png`, and `facade-building.png`.
- Welcome now uses the fourth supplied image (`Gemini Courtyard (8).png`) with a right-shifted cover crop to keep the building/courtyard architecture prominent.
- **Verification:** `npm run build` passed. It ran before the final CSS-only change that applies the right-shifted crop at all viewport sizes; rerun if a final build check is desired.

### Image precache size follow-up — 13 October 2026

- Original full-resolution PNGs are retained under `src/assets/library/`; optimized JPEG delivery copies are under `public/assets/` and each is below 2 MB. Welcome uses `public/assets/courtyard-pool.jpg` with right-shifted cover positioning.
- This resolves the initial service-worker build failure caused by public PNGs exceeding Workbox's 2 MiB precache limit.
- **Verification:** `npm run build` passed after the final crop and asset updates, including service-worker precaching (17 entries; 700.16 KiB total).

### Welcome copy and values layout — 13 October 2026

- Replaced the Welcome heading/body with the supplied STAROOT HUB eyebrow and an accessible values list (Innovation, Experience, Trust). Applied the requested eyebrow position, values-list sizing/bottom placement, and mobile stacking order.
- Kept `welcome-art` and the existing `welcome-switch` styling unchanged.
- **Verification:** Not run; `git diff --check` passed (line-ending warnings only).

### Welcome safe-area blur without tint — 13 October 2026

- Added transparent `backdrop-filter: blur(12px)` strips for the top and bottom safe-area insets on the Welcome artwork layer. No tint/background color is applied; photo sizing/position and text block rules remain unchanged.
- Android WebAPK status-bar color remains shell-controlled when its viewport does not extend behind the native bar; CSS can only blur the page safe area that is actually rendered by the web view.
- **Verification:** `git diff --check` passed (line-ending warnings only); no physical-device check was run.

### Safe-area blur reverted — 13 October 2026

- Removed the top and bottom Welcome safe-area backdrop-blur pseudo-elements. Welcome image positioning and all content styles remain unchanged.
- **Verification:** `git diff --check` passed; no device test run.

### Welcome bottom photo bleed fix — 13 October 2026

- Changed the fixed mobile Welcome wrapper from `overflow: hidden` to `overflow: visible`. This avoids clipping the fixed photo layer at the viewport wrapper's bottom; the photo layer still extends 40px past the viewport.
- The wrapper remains fixed with `touch-action: none` and overscroll disabled. Status-bar metadata and text styles are unchanged.
- **Verification:** `git diff --check` passed; confirm the bottom edge on the installed iPhone app.

### Welcome viewport locked to screen — 13 October 2026

- Fixed the mobile Welcome wrapper to the viewport (`100dvh`) and prevented scroll/overscroll. The existing fixed image layer remains full-bleed through the bottom safe area.
- Status-bar metadata and text styles were left unchanged.
- **Verification:** `git diff --check` passed; no device test run.

### Ignore dotenv files — 13 October 2026

- `.gitignore` now ignores dotenv names (`.env*`, `*.env`, `*.env.*`) at root and in nested directories, including examples and local variants.
- Removed tracked `.env.example` from the index without deleting the developer's local copy. No other dotenv files were tracked.
- **Verification:** Confirmed ignore matching and no remaining tracked dotenv files; `git diff --check` passed (line-ending warning only).

### Welcome photo anchored to bottom edge — 13 October 2026

- Extended the fixed mobile Welcome artwork layer 200px below the viewport and set the facade image to bottom alignment, so the image reaches past the lower safe-area edge.
- Kept `background-size: cover` to preserve the image's aspect ratio. The mobile status bar and Welcome text styles were not changed.
- **Verification:** `git diff --check` passed; verify on the installed phone to confirm the platform's bottom viewport edge.

### Welcome image extension reverted — 13 October 2026

- Reverted the attempted mobile image-layer extension and returned to the prior `inset: -40px` and centered vertical framing. The facade image asset remains unchanged; the attempted image generation did not produce a project asset. Status-bar and text styling are unchanged.
- **Verification:** `git diff --check` passed; no device test run.

### Welcome Get started button — 13 October 2026

- Replaced Welcome's Sign in/Sign up split navigation with a centered black pill-style “Get started” link to `/login`.
- Placed it at the bottom safe-area edge and clipped horizontal overflow for the mobile Welcome view.
- **Verification:** `git diff --check` passed; no automated tests run.

### Welcome background overscan — 13 October 2026

- Enlarged the fixed mobile Welcome artwork layer to overshoot the viewport by 200px on each side and kept the image at `88% center / cover`.
- Added the same facade image to the Welcome-scoped root canvas with the existing blue as a load fallback; the page body is transparent only while Welcome is active.
- Left status-bar settings and text styling unchanged; retained horizontal overflow clipping.
- **Verification:** `git diff --check` passed; native-device validation remains needed.

### Welcome photo reaches the screen bottom — 13 October 2026

- Returned the mobile Welcome photo to an absolute image layer filling the Welcome screen container (`inset: 0`), with the screen fixed to the viewport and clipped against overscroll.
- Removed the separate Welcome-scoped `html:has(...)` photo canvas and blue fallback, which could show as a band when its painted area did not match the installed app viewport.
- Kept the facade photo, image framing (`88% center`, `cover`), status-bar metadata, text blocks, and Get started button styling unchanged.
- **Verification:** Live `/welcome` page still renders the expected content and navigation; `git diff --check` passed. Physical-device confirmation remains necessary.

### Welcome courtyard image — 13 October 2026

- Added the supplied `Gemini Courtyard (4).png` to `src/assets/library/courtyard-evening.png` and generated an optimized JPEG for app delivery at `public/assets/courtyard-evening.jpg` (2048px wide, quality 86).
- Switched only the Welcome background image URL to the new courtyard asset. Existing image sizing/position, status-bar treatment, text, and button layout are unchanged.
- **Verification:** Confirmed optimized asset size is 1.28 MB and `git diff --check` passed. Visual and installed-device review remains pending.

### Welcome mobile viewport sizing — 13 October 2026

- Removed the remaining `100dvh` declarations from the mobile Welcome wrapper and phone sizing; those elements now use `100vh`, matching the sizing used by the other auth screens.
- Kept the current status-bar metadata, text layout, photo crop, and button placement unchanged. Preserved the Welcome no-swipe and horizontal-overflow protections.
- **Verification:** `git diff --check` passed; installed iOS PWA confirmation remains pending.
