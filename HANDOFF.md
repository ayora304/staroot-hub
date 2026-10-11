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


#google gemini agent worklflow update append
# Staroot Hub: Project Handoff Brief

*For any agent picking this up. Last updated Sunday, 11 October 2026 (Phase 1 code written). Location in repo: `docs/HANDOFF.md`.*

---

## 1. Current state

**Phase 0 is complete. Phase 1 code is written but has not been installed or built yet.** Feature modules (Approvals, CRM, Site Progress, Inventory) are not started; their routes show a placeholder.

| Item | Status |
| --- | --- |
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

* **Run and passing:** 15 unit tests for RBAC and email-domain logic (executed with Node type-stripping and a small Vitest stand-in), plus a strict `tsc` check of the pure files `roles.ts`, `permissions.ts`, `emailDomain.ts`.
* **Not yet run:** `npm install`, `npm run typecheck`, `npm run build`, `npm run dev`, the real Vitest run, the Appwrite setup script, and any browser testing. The sandbox that wrote this code had no network.
* **First task for the next agent:** run `npm install && npm run typecheck && npm test && npm run build`, fix any version or typing errors (dependency versions and the `node-appwrite` v14 call signatures are the most likely culprits), then log the result in the changelog.

**Next step: Phase 2** (offline outbox and sync engine with tests). Verify Phase 1 first.

**Placeholders to replace before go-live:** approval thresholds and currency in `appwrite/seed/approval_rules.json`, sample projects in `appwrite/seed/projects.json`, and the placeholder icons in `public/icons/`.

## 2. What we are building

**Staroot Hub** is a new internal Progressive Web App for Staroot Real Estate (Nairobi, Kenya). It is a single installable "everything app" that replaces paper, Excel sheets and WhatsApp approvals. It must work **offline** in basements and on remote construction sites, then sync when connectivity returns.

**It is a greenfield rebuild.** The company previously had a prototype called "Staroot Asset Tracker" (codebase folder `miral-pwa`). **Do not copy, reuse or imitate any of it**: no files, naming, structure or assets. Use original branding placeholders. The old prototype's concepts informed the requirements, but the new design is independent.

---

## 3. Tech stack

* **Frontend:** React + TypeScript + Vite, Tailwind CSS, Framer Motion
* **Backend:** Appwrite (Auth, Databases, Storage, Functions) behind a thin serverless API layer in `api/` for any trusted logic
* **Offline:** IndexedDB via Dexie (data and photo blobs), Workbox service worker
* **Exports:** PDF and DOCX generated client-side
* **Notifications:** Web Push with VAPID keys
* **Validation:** zod
* **Tests:** unit tests for sync, approval routing and RBAC, plus Playwright e2e for offline flows

---

## 4. Users and access

Five roles, **enforced server-side** (the UI only hides things):

1. **Executive (CEO):** global read, final approvals, dashboards
2. **Manager** (Operations, Sales, Marketing): read/write own department, approve/reject
3. **Sales & Marketing staff:** CRM, leads, marketing assets
4. **Operations & Front Office:** logistics, dispatch, submit requests, add leads
5. **Site Engineers / Field Staff:** site progress, photos, asset custody

Rules:

* Individual accounts only. **No shared logins.**
* Sign-up is restricted to a configurable company email domain (`ALLOWED_EMAIL_DOMAIN` env var).
* The role map lives in a database collection that admins can edit.

---

## 5. Modules

### 5.1 Hub

A role-aware home screen showing only modules the user can access. "Coming Soon" cards for Leasing, Maintenance, Finance and Analytics. Badges for pending actions and unsynced items.

### 5.2 Approvals Engine

* Categories: `petty_cash`, `procurement`, `leave`, `contract`
* Dynamic forms per category, with attachments (receipt, quotation)
* Tabs: Pending My Action, My Submissions, Approved, Rejected
* Actions: Approve, Reject, Request Revision (a comment is required for reject and revision)
* **Routing rules are configurable data:** thresholds, currency (default KES), category to approver role. Boundary behaviour is defined explicitly (for example, amount >= threshold goes to the CEO).
* The server checks that the acting user is the current assignee.
* The audit trail is an **append-only** `approval_events` collection (who, what, when, from_status, to_status, comment). It is never edited.
* Requestor and next approver are notified (push plus in-app).

### 5.3 CRM

* Kanban pipeline: Prospect, Viewing Scheduled, Negotiation, Won, Lost
* Stage changes work by drag-and-drop **and** a tap-based move menu, with a quick note prompted on each move
* Stale-lead flag after 48 hours without contact (configurable)
* Lead profile: tap-to-call, tap-to-WhatsApp, activity timeline
* Managers get a rep filter, pipeline velocity, and a monthly conversion report exported to PDF/DOCX
* Notes and activities are separate append-only records, not a JSON blob
* Lead sources: `social_media`, `referral`, `website`, `walk_in`

### 5.4 Site Progress & Reporting

This merges two overlapping modules from the original document.

* Projects and contractors are **admin-managed data**, not hard-coded
* Site dashboard: project selector, contractor grid with % progress bars
* Daily log: date, contractor, work done, materials used, blockers, status (`on_track | delayed | blocked`)
* Photo evidence: in-app camera capture only (no gallery upload), up to 3 per section, compressed to max 1024px at about 0.65 quality, stamped with timestamp and GPS
* The server verifies photos (timestamp skew, GPS presence) and marks them **"unverified"** rather than silently accepting
* 3-step Report Builder wizard: (1) global metadata and disclaimers, (2) per-project sections with headers, bullets and photos (repeatable), (3) publish, sync, export
* Reports archive: searchable, with status chips (Local / Syncing / Synced / Error)
* Full-screen document viewer, then branded PDF and Word export

### 5.5 Inventory & Logistics

* Dispatch and receipt of assets (marketing materials, tents, etc.)
* Items flagged consumable or returnable; stock counts update globally
* Asset custody: who holds what, where, since when
* Photo proof per movement, searchable movement log
* One-tap dispatch summary for drivers (shareable text, for example WhatsApp)

---

## 6. Offline and sync design

This is the riskiest part, so it gets built **before** the feature modules.

* Every write goes to an **IndexedDB outbox** first. The UI never waits on the network.
* Each queued action has: client UUID (idempotency key), type, payload, blob references, attempt count, status.
* Sync triggers: the `online` event, app foreground/visibility change, periodic retry with backoff, and Background Sync where supported. It must work acceptably on **iOS Safari, which has no Background Sync**.
* Server endpoints are idempotent, so retries never create duplicates.
* Photos upload first (resumably); metadata is written only after the file succeeds.
* **Conflicts:** server-assigned timestamps (never client clocks), field-level merge for edits, append-only for notes and audit events, and a "needs review" state for genuine conflicts instead of silent overwrite.
* Sync status is visible everywhere: Pending, Syncing, Synced, Failed with retry.
* Persistent storage is requested, with a warning on low space.

### Notifications

* Web Push (VAPID). Permission is requested after login via a friendly pre-prompt, not cold.
* Subscriptions are stored per device.
* iOS only supports push for installed PWAs, so an in-app install guide is required.
* Every push is mirrored in an in-app inbox.

### Security

* Server-side RBAC on every endpoint and every Appwrite collection permission
* HttpOnly secure session cookies or Appwrite sessions, plus CSRF protection
* Rate limiting, zod input validation, file type and size limits
* Never trust client role claims or client timestamps for decisions
* Secrets in env vars only; `.env.example` stays current

### Design

* Mobile-first, thumb-friendly, one-handed use on site
* Dark gold "luxury" theme plus a light theme; high contrast and large tap targets for sunlight
* Skeletons, empty states, optimistic UI, clear error recovery
* Accessible: keyboard navigation, ARIA labels, reduced-motion support
* Original branding placeholders only

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
9. **Added `photo_records**` (per-photo verification state) and **`role_permissions`** (admin-editable role map). That makes 16 collections, not the original 14.
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

* Every client-originated record has a unique `client_id` (idempotency key).
* Append-only: `movements`, `approval_events`, `lead_activities`, `photo_records`, `reports`, `sync_audit`. No update/delete path may be added.
* Approval ranges are `[min_amount, max_amount)`: an amount exactly at a threshold routes to the higher approver.
* Clients never write to Appwrite directly. Reads go through the API, except a user's own notifications and profile.
* Attachments and photos are arrays of Storage file IDs; per-photo verification lives in `photo_records`.

---

## 10. Working rules for any agent

1. **Read** `docs/` and this brief before changing anything.
2. **Work phase by phase**, and stop and summarise after each:
| Phase | Scope |
| --- | --- |
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

* Hub badges are hard-coded to zero (`BADGES` in `HubScreen.tsx`). Phase 2 supplies the unsynced count, Phase 3 the pending approvals.
* `clearAllLocalData()` will destroy unsynced outbox items on sign-out. Phase 2 must block or warn first.
* Rate limiting is in-memory per server instance (`api/_lib/rateLimit.ts`). Replace in Phase 7.
* No sign-up or password reset UI. Accounts are created in Appwrite, then a `users_profiles` row is added by hand (see `docs/DEPLOYMENT.md`).
* `api/` handlers use a Node `(req, res)` signature and extensionless relative imports. Confirm the chosen host's bundler accepts both before deploying.
* The `/api` dev proxy points at `API_DEV_TARGET` (default `http://localhost:3001`). Nothing serves it yet; local login needs whatever host tooling is chosen.
* Push: the service worker handles `push` and `notificationclick`, but subscribing and sending arrive in Phase 3.

---

## 12. Open questions (confirm with the owner before building)

* Approval threshold amounts and currency (seed values in `approval_rules.json` are placeholders; the original said $10,000, we default to KES)
* The real company email domain
* The actual project and contractor lists to seed (`projects.json` holds sample data)
* Whether Appwrite is cloud or self-hosted
* Where the serverless layer will be deployed (Vercel was used before, but it is not decided)

---

## 13. Change history of this brief

* **Phase 1 code written (11 Oct 2026):** toolchain, service worker, auth endpoints and UI, shared RBAC with tests, theme, UI primitives, Hub, Appwrite setup script, placeholder icons. Added decisions D15 to D19. Build not yet verified (see section 1).
* **Phase 0 completed (11 Oct 2026):** wrote 8 docs, 16 collection definitions, permissions policy, 3 seed files and README. Added collections `photo_records` and `role_permissions`. Added decisions 9 to 12. See `CHANGELOG.md` for stamped entries.

---

## 14. Latest Progress Update (11 October 2026)

* **Appwrite Infrastructure Provisioned:**
* Connected to Appwrite Cloud (`[https://sgp.cloud.appwrite.io/v1](https://sgp.cloud.appwrite.io/v1)`).
* Created the target database (`staroot_hub_db`) and all 16 collections complete with attributes and indexes.
* Created storage buckets: `proofs` (for photo evidence) and `attachments` (for approval documents).
* Seeded initial datasets (`role_permissions`, `approval_rules`, and `projects`).
* Resolved `scripts/appwrite-setup.ts` TypeScript casting issues on `listAttributes` status checking and handled Node v26 native fetch/`undici` module loader compatibility.


* **Current Status / Next Steps:**
* Create the initial admin/CEO user in Appwrite Auth, set email verification to `true`, and insert the matching `users_profiles` record.
* Verify login flow via `vercel dev` on `http://localhost:3000`.
* Execute `npm run typecheck` and `npm run build` verification.
* Transition to **Phase 2: Offline Outbox & Sync Engine** (`src/core/offline/`).

##ed of google gemini workflow