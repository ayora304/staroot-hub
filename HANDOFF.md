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

##start of claude code again
---

## 15. Progress update: Appwrite setup fixes and Phase 2 code (Sunday, 11 October 2026)

*Appended; earlier sections are unchanged. Where this section disagrees with section 1 or 14, this section is newer and wins.*

### 15.1 Corrections to earlier statements

- **Database ID is `staroot_hub`, not `staroot_hub_db`.** `APPWRITE_DATABASE_ID=staroot_hub` in `.env` and in the host's env settings. It must match whatever the API code reads.
- **Storage buckets (`proofs`, `attachments`) are NOT created by `scripts/appwrite-setup.ts`.** They must be created by hand in the Appwrite console (or the script extended) before Phase 3 (attachments) and Phase 5 (photos).
- **Section 1 verification status is out of date.** `npm install`, `npm run typecheck`, the real Vitest run and the Appwrite setup script have now all been run. See 15.4. `npm run build` and `vercel dev` have NOT been run yet.

### 15.2 Appwrite setup: what broke and how it was fixed

1. **`TypeError: fetch failed ... invalid onError method`** on Node v26. Cause: old `node-appwrite` bundled an undici dispatcher that the newer built-in fetch rejects. Fix: `npm install node-appwrite@latest`.
2. **`IndexType` is no longer exported.** The enum is now `DatabasesIndexType` (also `TablesDBIndexType`, `DocumentsDBIndexType`, `VectorsDBIndexType`). Script updated to `DatabasesIndexType.Unique` / `.Key`.
3. **`Invalid databaseId`**: IDs must be at most 36 chars of `a-z A-Z 0-9 . - _`, not starting with a special char. Fixed by setting `APPWRITE_DATABASE_ID=staroot_hub`.
4. **`missing scopes ["collections.write"]`**: the API key needs these scopes: `databases.read/write`, `collections.read/write`, `attributes.read/write`, `indexes.read/write`, `documents.read/write`. Fixed by creating a key with all Databases scopes.
5. **`maximum number of databases ... reached` (403)** on re-run. Appwrite checks the plan limit before the duplicate check, so `db.create` returns 403 instead of 409 once the database exists. Fix: the script now calls `db.get(DB)` first and only creates on 404.
6. **`attribute_limit_exceeded` on `site_logs`.** Cause: collection row-size limit. Every `text` attribute was 5000 chars. Fix: `text` attributes are now 2000 chars (except `snapshot`, which stays 1,000,000). `site_logs` was deleted in the console and rebuilt by re-running the script. **If a long-text field is ever needed, store it in a separate collection linked by an ID string, not in the same row.**
7. The script now finishes with `Done.` and seeded `approval_rules` (6 rows) and `projects` (2 rows) along with `role_permissions`.
8. `scripts/appwrite-setup.ts` is now fully typed (no implicit `any`) and passes strict `tsc`. It is idempotent: existing items print `exists`.

### 15.3 First admin user

- Created in Appwrite Auth, email verified, with a matching `users_profiles` row. Login confirmed working by the owner.
- **Valid `role` values:** `executive`, `manager`, `sales_marketing`, `ops_frontoffice`, `site_engineer`. There is no `admin` role. Admin access comes from the separate `is_admin: true` flag on the profile (use `role: executive` plus `is_admin: true` for the owner).
- `scripts/create-profile.ts` is a one-off helper used to create the profile row from code and print the real Appwrite error (the console form hid it). It is not part of the app and can be deleted.
- `department` may also be an enum. If profile creation complains about it, use one of the values the error lists.

### 15.4 Phase 2: offline outbox and sync engine (code written, tested)

**Files (all under `src/core/offline/` unless noted):**

| File | Purpose |
|---|---|
| `types.ts` | `OutboxItem`, `OutboxStore` interface, `SyncError`, `SyncHandler`, `SyncSnapshot`. No runtime imports. |
| `dexieStore.ts` | Dexie implementation. Own database `staroot-outbox` with tables `items` (`++seq, &id, status`) and `blobs` (`id`). |
| `syncEngine.ts` | `createSyncEngine`, `backoffMs`, `classifyError`. Single-flight drain loop, triggers, status snapshot. |
| `instance.ts` | App-wide singletons `outboxStore` and `syncEngine`. |
| `index.ts` | Re-exports plus `useSyncStatus()` hook and `unsyncedCount()`. |
| `tests/unit/helpers/memoryStore.ts` | In-memory store with the same contract, for engine tests. |
| `tests/unit/sync/syncEngine.test.ts` | 17 tests for the engine. |

**Behaviour:**

- `enqueue()` writes to IndexedDB first and returns at once. Passing the same `id` twice stores one item (idempotent). `item.id` is the `client_id` the server must use for idempotency.
- Items are sent oldest-first (by `seq`). One failing item does not block the others.
- Error classes (`classifyError`, or throw `SyncError(kind, msg)` from a handler): network error with no status, 5xx, 408, 425, 429 = retry with exponential backoff (2 s base, 5 min cap, equal jitter), `failed` after 8 attempts. Other 4xx = `failed` immediately. 409 = `needs_review` (never silently overwritten). **401 = pause the loop without burning attempts.** 403 fails only that item.
- Triggers: after enqueue, `online`/`offline` events, tab becomes visible, a 30 s poll, and a timer scheduled for the next retry. There is **no dependency on Background Sync**, so it works on iOS Safari.
- Items stuck in `syncing` after a crash or closed tab are returned to `pending` at the start of the next drain.
- Successful items are deleted from the outbox together with their blobs. Handlers receive `getBlob(id)`. Photos must be uploaded before the metadata is written (handler's job).
- An item whose type has no registered handler is marked `failed` (it does not loop). **Register handlers before calling `syncEngine.start()`.**
- UI API: `useSyncStatus()` returns `{pending, syncing, failed, needsReview, online, running, paused, lastSyncAt}`. Engine methods: `retry(id)`, `retryAllFailed()`, `discard(id)`, `hasUnsynced()`.

**Decisions added (extend DECISIONS.md, continuing from D19):**

- **D20.** The outbox uses its own Dexie database (`staroot-outbox`), separate from the session/`meta` database, so the two cannot conflict.
- **D21.** 401 pauses the loop; 403 fails a single item. Reason: the existing rule "401 or 403 wipes local data" in `AuthProvider` would destroy unsynced work, so the wipe must be guarded (see 15.6).
- **D22.** `text` attributes are capped at 2000 characters because of the Appwrite row-size limit (see 15.2 item 6).
- **D23.** The engine polls every 30 s as the iOS fallback; Background Sync is an optional extra, never a requirement.

### 15.5 Verification status (supersedes section 1)

- **Passing:** `npm test` = 32 tests pass, 7 `it.todo` (3 files run: emailDomain 4, rbac 11, syncEngine 17).
- **Tooling changes:** Vitest upgraded from 2.1.9 to 3.2.x (`npm install -D vitest@^3`) because Vitest 2 bundled its own Vite 5 and its plugin types clashed with the project's Vite 6 in `vite.config.ts`. Check `npm ls vite` shows a single version.
- **Test stubs:** the empty stub test files (`approvals/audit`, `approvals/routing`, `camera/compress`, `crm/stale`, `sync/conflict`, `sync/idempotency`, `sync/outbox`) now contain a single `it.todo` so the suite is green. Replace them as each phase lands. The outbox and idempotency behaviour is currently covered inside `syncEngine.test.ts`.
- **Typecheck:** was down to one error (file name casing: `memorystore.ts` vs `memoryStore.ts` on disk; TypeScript is case-sensitive about names on Windows). Fix: rename the file to `memoryStore.ts`. Re-run `npm run typecheck` to confirm it is clean.
- **Not run yet:** `npm run build`, `vercel dev` login test in the browser, any Playwright test, and a real-IndexedDB test of `dexieStore.ts` (it is only exercised in a browser; the engine tests use the in-memory store).

### 15.6 Still to do to close Phase 2

1. Call `syncEngine.start()` once in `src/main.tsx`, after handlers are registered.
2. Replace the hard-coded zero in `BADGES` in `HubScreen.tsx` with `unsyncedCount(useSyncStatus())`.
3. Guard `clearAllLocalData()`: await `syncEngine.hasUnsynced()` and warn or block before wiping. Also review `AuthProvider`'s "401 or 403 wipes local data" rule against D21.
4. Run `npm run build` and fix any errors.
5. Log changelog entries with `scripts/add-changelog.ps1`.
6. Optional but recommended once Phase 3 provides a real action: a Playwright offline test (go offline, submit, reconnect, confirm no duplicates).

### 15.7 Other open items

- `npm audit` reports 8 vulnerabilities (5 moderate, 1 high, 2 critical). Review with `npm audit`; do not run `npm audit fix --force` blindly.
- npm warns that esbuild's postinstall is not covered by `allowScripts` (`npm install-scripts ls`, `npm install-scripts approve esbuild`). Only needed if `tsx` or Vite fail to start.
- No handlers are registered yet, so nothing actually syncs until Phase 3 registers the first one.
- Open questions in section 12 are still unanswered (thresholds, email domain, real project list, Appwrite hosting, API host).

**Next step: finish 15.6, then start Phase 3 (Approvals Engine).** Before Phase 3, the author needs the real shape of `api/` (`apiFetch`, `ApiError`, `requireAccess`) so handlers are written against the actual code.



---

## 16. Progress update: Phase 2 wiring and code review (Sunday, 11 October 2026)

*Appended after section 15; earlier sections are unchanged. Read this before starting Phase 3.*

### 16.1 Verified since section 15

- `npm run typecheck` is clean and `npm run build` passes (Vite 6.4, 477 modules, service worker built, 10 precache entries, about 565 KiB). Only a chunk-size warning (main bundle 533 kB). Code-splitting is a Phase 7 task.
- `npm test`: 32 passed, 7 todo (emailDomain 4, rbac 11, syncEngine 17). The `memorystore.ts` casing error was fixed by renaming the file to `memoryStore.ts`.
- NOT yet verified: the wiring edits below (typecheck after applying them), `vercel dev` login in a browser, and the PWA/service worker at runtime.

### 16.2 Phase 2 wiring (files written; owner must copy them into the repo)

| File | Change |
|---|---|
| `src/main.tsx` | Imports `syncEngine` from `./core/offline` and calls `syncEngine.start()` once at module level (not in an effect, so StrictMode cannot start it twice). Handlers must be registered before this call. |
| `src/modules/hub/components/HubScreen.tsx` | Uses `useSyncStatus()` and `unsyncedCount()`. Shows a live banner when items are queued (syncing, waiting for connection, needs attention, or sign in again) with a Retry button for failed items. Sign-out now asks for confirmation if items are unsynced and then calls `outboxStore.clear()` before `signOut()`. |

Why the sign-out clear matters: the outbox is a separate Dexie database (`staroot-outbox`, D20), so the older `clearAllLocalData()` almost certainly does not touch it. Without clearing, user A's queued actions could be sent under user B's session on a shared device and be attributed to B.

### 16.3 Recommended edits from the code review (NOT confirmed applied; check each)

1. **`src/core/offline/instance.ts`:** pass a `classify` function to `createSyncEngine` so session-level server codes pause the queue instead of failing items. Codes treated as session problems: `unauthenticated`, `unverified`, `no_profile`, `csrf`. Do NOT include `forbidden` (it is also the RBAC denial code, which should fail only that item). Everything else falls through to `classifyError`. This works because `ApiError.code` carries the server's `code` and `api/_lib/http.ts` returns `{ error, code }`.
2. **`src/core/api/` (`apiFetch`):** add `timeoutMs?: number` to `Options` and use `signal: opts.signal ?? AbortSignal.timeout(opts.timeoutMs ?? 30_000)`. Without a timeout one hung request stalls the whole sync queue. Raise the timeout for photo uploads.
3. **`api/_lib/auth.ts`:** in `authenticate()`, only treat an Appwrite error with `code === 401` as "session expired". Any other error from `Account.get()` should throw `HttpError(503, ..., 'auth_unavailable')`. Currently every failure becomes a 401, and `AuthProvider` wipes local data on 401, so a brief Appwrite outage could erase a field user's unsynced work.
4. **`api/_lib/http.ts` `readJson`:** wrap `JSON.parse` for a string `req.body` in try/catch and throw `HttpError(400, 'Invalid JSON', 'bad_json')` (currently a 500).
5. **`api/_lib/http.ts` `parseCookies`:** wrap `decodeURIComponent` in try/catch and keep the raw value on failure. A malformed cookie currently makes every request fail with a 500 before authentication.
6. **Phase 7 note:** `getIp` trusts the first `x-forwarded-for` value, which clients can spoof. Prefer the host's trusted header (`x-vercel-forwarded-for` or `x-real-ip` on Vercel) before relying on it for rate limiting.

### 16.4 Open item: `AuthProvider` wipe on 401/403

The brief says a 401 or 403 from the API wipes local data (`clearAllLocalData()`). The owner has not yet shown that file. To check: `Get-ChildItem src -Recurse -Include *.ts,*.tsx | Select-String clearAllLocalData`. Required behaviour: the automatic wipe must NOT delete `staroot-outbox` (the same user can sign back in and resume). Only the explicit, confirmed sign-out in `HubScreen` clears it. Also note a 403 from RBAC (`forbidden`) should not log the user out at all.

### 16.5 Rules for Phase 3 handlers (derived from the review)

- **Create endpoints must be idempotent and return 200 for a duplicate.** `handler()` in `api/_lib/http.ts` turns any non-`HttpError` into a 500. A retried create that hits the unique `client_id` index must catch the duplicate, load the existing record and return it with 200. Never return 409 for a replay: the sync engine treats 409 as `needs_review`, and a 500 would be retried forever.
- **Endpoint order (unchanged):** `authenticate(req)`, `assertCsrf(req)` for mutations, `requireAccess(ctx, module, action)`, zod validation, then the work. `requestor_id`, `requestor_email`, `department`, `status` and the assignee come from the server (session and routing), never from the client.
- **Routing:** match rules by `category`, `active`, and `currency` first, then `amount >= min_amount` and (`max_amount` is null or `amount < max_amount`), lowest `priority` number wins. Categories without an amount (`leave`, `contract`) need rules with `min_amount: 0` and no `max_amount`. Decide how to handle a request whose currency has no matching rule (suggest: reject with a clear validation error).
- **Concurrency:** `approvals.version` is optimistic concurrency. A stale version should return a conflict the engine routes to `needs_review`. Append an `approval_events` row for every transition (never update or delete events).
- **Schema notes:** `approvals.details` is `text` (2000 chars after decision D22). `approvals.department` enum is `executive, operations, sales, marketing`; the profile `department` enum may differ, so map it deliberately. `assigned_role` enum is `manager, executive`. `src/core/api` ENDPOINTS currently holds only `session` and `logout`; add the approvals routes there.
- **Handlers:** register each action type with `syncEngine.registerHandler(type, fn)` before `syncEngine.start()` in `main.tsx`. The handler sends `item.id` as `client_id`. For photos: upload the files first, then write the metadata.

### 16.6 Next steps, in order

1. Copy `src/main.tsx` and `HubScreen.tsx` into the repo; apply the recommended edits in 16.3; run `npm run typecheck`.
2. Run `vercel dev`, sign in at `http://localhost:3000`, confirm the Hub loads with no sync banner.
3. Resolve 16.4 (`clearAllLocalData` check).
4. Add changelog entries with `scripts/add-changelog.ps1` (Phase 2 and the wiring).
5. Start Phase 3 (Approvals Engine): routing logic with unit tests first, then endpoints, then UI, following 16.5.
6. Still open from section 15.7: `npm audit` findings, the esbuild install-scripts warning, creating the storage buckets by hand, and the unanswered owner questions in section 12.

###end of claude code again

##claude 111026 1944 start

---

## 17. Progress update: Phase 3a Approvals Engine (Sunday, 11 October 2026)

*Appended after section 16. Phase 2 close-out (section 15.6 and 16.6) is still PENDING by the owner's decision; Phase 3a was built on top of it. Where this section disagrees with earlier ones, this one is newer.*

### 17.1 What Phase 3a contains (code written)

| Area | Files |
|---|---|
| Pure domain logic (shared by API and tests) | `src/modules/approvals/types.ts`, `domain/routing.ts`, `domain/stateMachine.ts`, `domain/audit.ts` |
| Server layer | `api/approvals/{submit,decide,resubmit,list,detail}.ts`, `api/notifications/{list,read}.ts`, `api/_lib/{approvalsRepo,approvalsAccess,approvalsSchemas,notify}.ts` |
| Client | `src/modules/approvals/{services,hooks,components}/*`, `src/modules/notifications/components/InboxScreen.tsx` |
| Wiring | `src/core/api/endpoints.ts`, `src/modules/hub/registry.ts` (Inbox card), `src/app/router.tsx`, `main.tsx` calls `registerApprovalHandlers()` before `syncEngine.start()` |

### 17.2 Rules that must not be broken

- **Routing** (`routeApproval`): rule matches on category, currency, `active`, and `amount >= min_amount` and (`max_amount` null or `amount < max_amount`). Lowest `priority` wins, then highest `min_amount`. Leave and contract route as amount 0. No matching rule returns 422 `no_routing_rule` (the request is not created).
- **Who decides** (`isEligibleApprover`): executives decide any pending request; managers decide only manager-routed requests from their own department; nobody decides their own request.
- **Comments:** required for `reject` and `request_revision`, never for `approve`.
- **Versioning:** `approvals.version` starts at 1 (event seq 1 = submitted). Every transition writes an event with `seq = version + 1`, then updates the row to that version. Clients send `base_version`; a mismatch is 409 `conflict`, which the sync engine turns into `needs_review`.
- **Idempotency:** submit looks up `client_id` first and returns the existing record with 200. Decide and resubmit detect a retry by finding their own event at `seq = base_version + 1` (`findReplay`) and repair an interrupted row update.
- **Server owns:** `requestor_id`, `requestor_email`, `department`, `status`, `assigned_role`, `rule_id`, `version`, timestamps. Never accept them from the client.
- **Events are append-only:** `approvalsRepo.ts` has no update or delete for `approval_events`. Do not add one.
- **Endpoint order:** `authenticate`, `assertCsrf` (mutations), `requireAccess`, zod parse, then work. Non-visible records return 404, not 403.

### 17.3 Verification status

- **Run and passing (pure logic):** 30 unit tests for routing (13), state machine (12) and replay detection (5), executed with Node type-stripping and a small Vitest stand-in; strict `tsc` on the domain files is clean; every new file parses (no syntax errors).
- **NOT run:** `npm run typecheck` and `npm run build` on the full project, the API endpoints against a live Appwrite, the UI in a browser, and the offline end-to-end test. The author could not install packages.
- **Highest-risk assumptions** (isolated in two files): `outboxStore.enqueue({ id, type, payload })` in `services/approvals.service.ts`, and `syncEngine.registerHandler(type, handler)` in `services/approvals.sync.ts`. Also `node-appwrite` calls in `api/_lib/approvalsRepo.ts` use the same positional style as `api/_lib/appwrite.ts`.
- **Required Appwrite change:** new indexes (see `PHASE3_APPLY.md` step 3), then rerun `npm run setup:appwrite`.

### 17.4 Known gaps (Phase 3b and later)

- **No attachments** (receipts, quotations). Needs the `proofs`/`attachments` buckets created by hand, an upload endpoint, and outbox blobs.
- **No Web Push.** In-app inbox only. Needs VAPID keys, `web-push`, and `api/push/subscribe`.
- **Reads are online-only.** Lists and details are not cached in Dexie, and a request still sitting in the outbox is not shown in the list until it syncs.
- **Hub badge for "pending my action" is not wired** (still zero). Use `GET /api/approvals/list?tab=pending_mine` and count.
- **Lists show the newest 100, no pagination.**
- **No admin screen** to edit approval rules, so changing thresholds means editing the `approval_rules` collection in Appwrite.
- **Decision screen is a full page**, not the slide-up sheet in the spec.
- **A CEO's own request cannot be approved** (D27). Needs an admin reassign feature or a policy decision (open question).
- Event-then-update is not atomic; the retry repair covers crashes, but there is no background reconciler (Phase 7).

### 17.5 Next steps

1. Apply and verify Phase 3a (`PHASE3_APPLY.md`). Close Phase 2 using the earlier checklist.
2. Phase 3b: attachments, Web Push, badge wiring, read cache, queued-item visibility.
3. Then Phase 4 (CRM).

HANDOFF_SECTION_18.md is ready to paste onto the end of docs/HANDOFF.md. It covers:

Phase 3a delivered: the files and decisions D24 to D29, pointing back to section 17 for the rules.
Verification status, replacing section 17.3: your own run showed 62 tests passing and 5 todo. Typecheck still fails with the two errors, so the build stops. That means dist is stale.
Phase 2 pending: both open errors are written up with the fix for each. registerHandler produced no error, so that assumption held.
Android install investigation: it records that the manifest shows only warnings, lists the five likely causes in order, and includes the recommended manifest. The Installability section and how your phone opens the app are listed as unanswered.
Phase status table, open decision and next steps: the decision is whether the CEO may approve their own requests.

Once you fix the two errors, I’ll update it with the results. I’ll also need the output of Get-Content src\core\offline\types.ts to correct the enqueue call.

###end of claude code 111026 1950

###

## Update log — 12 October 2026

- `npm install` completed successfully. npm reported 5 vulnerabilities (3 moderate, 2 critical); inspect with `npm audit` before choosing remediation.
- `npm test` passed: 6 test files passed, 5 skipped; 62 tests passed and 5 are TODO/skipped.
- The initial `npm run typecheck` and `npm run build` both stopped on two TypeScript errors. Fixed the unused `actorOf` import in `api/approvals/resubmit.ts` and changed the approval service to call `syncEngine.enqueue(...)`, matching the actual sync-engine API.
- **Still to verify:** rerun `npm run typecheck` and `npm run build` after these fixes. Do not treat the previous `dist/` output as current until the build passes.
- **Next agent:** first run those two verification commands and append their results here. Then continue the open Phase 3a/Phase 2 closeout items above; review the audit findings separately. Preserve this append-only update log.

## Update log — 12 October 2026 (continued)

- **Phase 2 closeout:** `src/main.tsx` now registers approval sync handlers before calling `syncEngine.start()`. The outbox is a separate Dexie database; confirmed sign-out warns and explicitly clears it, while the auth cache wipe does not delete it. Approval lists now include local queued submissions/resubmissions with their queue status.
- **Phase 3a apply:** `PHASE3_APPLY.md` was not present in the workspace. Ran the idempotent `npm run setup:appwrite` path described by this handoff; the approvals collections and indexes reported as already existing. No Phase 3a schema migration was needed.
- **Phase 3b code added:** private approval attachment upload/download endpoints and offline file blobs; Web Push subscribe/unsubscribe and public-key endpoints, server delivery, and a post-login prompt; per-user cached approval list/detail reads; live pending-approval badge. Added `web-push` and its TypeScript types. The setup script now defines a private attachments bucket, and `.env.example` documents required configuration.
- **Local configuration:** generated a VAPID key pair in ignored `.env` without writing secret values into tracked files. `APPWRITE_BUCKET_ATTACHMENTS` is set locally to `attachments`.
- **External setup blocker:** the follow-up request to create the Appwrite attachments bucket was rejected, so that bucket has **not** been created or verified. Attachment upload/download will not work against Appwrite until the private bucket exists. Do not claim attachments are runtime-ready yet.
- **Verification:** `npm run typecheck` passes; `npm test` passes (62 tests, 5 TODO/skipped). A production build passed before the final attachment and bucket setup edits; the latest build attempt was interrupted, so rerun `npm run build` before treating the current tree as build-verified. The earlier build showed only the existing large-chunk warning.
- **Security/config follow-up:** npm reports 5 vulnerabilities (3 moderate, 2 critical); review `npm audit` without blindly applying force fixes. Configure the VAPID keys in the deployment environment as well as local `.env`.
- **Next agent:** obtain authorization to create/verify the private `attachments` bucket, run `npm run setup:appwrite`, then rerun build and browser-test offline attachment submission and push subscription/delivery. Finish Phase 3b runtime verification before starting Phase 4 (CRM). Keep appending new progress at the bottom.

## Phase 3 closeout — 12 October 2026

- The private Appwrite `attachments` bucket was created successfully with `fileSecurity`, no public permissions, a 10 MiB limit, PDF/JPEG/PNG extensions, encryption and antivirus enabled. The full `npm run setup:appwrite` run exited successfully; approvals schema/indexes were already present and the seed collections were checked.
- Latest `npm run typecheck` and `npm run build` pass. The production bundle still emits the known >500 kB chunk warning. `npm test`: 62 passed, 5 TODO/skipped.
- Phase 3 code is complete: approval file blobs queue offline and upload before idempotent submission, files are served only after approval visibility checks, Web Push subscription delivery is wired, approval reads cache per user, queued requests are shown, and Hub pending count is live.
- Browser/API-host end-to-end verification is still pending. The repository does not currently provide a configured API development host; run that check when the chosen host is available. VAPID keys are generated only in local ignored `.env`; configure deployment secrets before production.
- **Phase 4 is now next:** CRM. Build server-authorized lead CRUD/list, stage changes with required notes, activity timeline, offline outbox handling, stale lead state and manager reporting/filtering. At the Phase 4 boundary, append results to both handoff files and CHANGELOG.md before starting Phase 5.

## Update log — 12 October 2026 (CRM deferred)

- CRM work is **pending by user direction**. Stop implementation here and do not proceed into CRM or later phases until the user resumes that work.
- A partial CRM foundation was started in this worktree: lead/activity types, stale/stage domain helpers, Appwrite repo/schema helpers, and initial `leads` and `move-stage` API changes. These files are incomplete and unverified; do not treat Phase 4 as delivered.
- Phase 3 remains the last completed phase. Its outstanding item is live browser/API-host end-to-end validation; VAPID deployment secrets also need configuring before production.
- On resuming, first inspect the partial CRM diff and current handoff/PRD requirements, then finish or adjust Phase 4. Continue appending handoff and changelog updates at the end of each completed phase.

## Update log — 12 October 2026 (Phase 3 verification recheck)

- Rechecked the current tree after CRM was deferred. `npm run typecheck` fails on four errors in the partial Phase 4 CRM files (`api/crm/detail.ts` and `api/crm/leads.ts`: unused imports and `queryParams` is not exported by `api/_lib/http`). These are incomplete CRM work and remain pending; do not claim the current full tree is typecheck/build verified until Phase 4 is resumed and repaired or cleanly excluded.
- Local end-to-end API verification is not currently available: Vite proxies `/api` to `localhost:3001`, and the Vercel CLI is not installed. No API host/browser flow was run in this recheck.
- The required Appwrite/VAPID environment variables are present in ignored local `.env` (values intentionally not recorded here). VAPID deployment configuration remains a production follow-up.
- CRM and later phases remain pending by user direction. Phase 3 implementation and Appwrite bucket setup remain recorded as completed, with runtime verification limited by the missing API host and current unrelated CRM type errors.

## Correction — Phase 3 API smoke check (12 October 2026)

- A Vercel development server was already running on `http://localhost:3000` even though the Vercel CLI is not installed in this shell. The Staroot Hub root returned HTTP 200 and contained the app title; unauthenticated `/api/auth/session`, `/api/approvals/list`, and `/api/push/public-key` requests returned HTTP 401, confirming the live routes enforce session authentication.
- This is only an unauthenticated smoke check. It does not verify signed-in approval flows, file upload/download, offline replay, push subscription/delivery, or Appwrite-backed data access. Those checks still need an authenticated browser session.

## Phase 5 closeout — 12 October 2026

- Delivered Site Progress: active projects and contractors are loaded from Appwrite; the site dashboard shows contractor progress and recent daily logs; engineers can queue logs offline and edit their own synced entry within 24 hours. Server APIs enforce site read/write scope and idempotency.
- Added camera-only photo evidence capture, JPEG compression to 1024px at 0.65 quality, visible time/GPS stamp, up to three photos per log/report section, a 3 MB server upload limit, and server-side timestamp/GPS verification with explicit unverified reasons. Photos upload before parent records; `photo_records` are created once with their final parent, preserving append-only behavior.
- Added the three-step report builder, searchable archive and document viewer, immutable report snapshots, and branded PDF/DOCX export. Export libraries load on demand. Queued reports and logs remain visible with outbox state.
- Appwrite denied a new `proofs` bucket because the project plan has reached its bucket quota. Reused the existing private `attachments` bucket for photos (`APPWRITE_BUCKET_PROOFS=attachments`); `npm run setup:proofs` verified private file security, encryption, antivirus, JPEG support and sufficient bucket size. The API independently enforces its 3 MB JPEG limit and record-level authorization.
- Added the `setup:proofs` command and documented the shared-bucket configuration. Project/contractor records remain Appwrite-managed data; no sample contractor records were invented.
- **Verification:** `npm run typecheck` passes; `npm run build` passes and generates the PWA service worker. Build still warns that the main chunk is about 601 kB and the precache is about 1.8 MB; address this in Phase 7. No Phase 5 authenticated browser/offline replay test or new unit test was run. The existing Appwrite photo bucket verification succeeded.
- CRM is **Coming Soon** in the Hub and remains unimplemented. The earlier partial CRM files were removed/restored to their original TODO stubs so they no longer break typecheck. Phase 3 remains **pending by user direction**; no Phase 3 implementation or authenticated verification was continued.
- **Next priority: Phase 6 — Inventory & Logistics.** Continue appending each phase closeout here and to `docs/HANDOFF.md`, plus `CHANGELOG.md`.

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

- Extended the fixed mobile Welcome artwork layer 200px below the viewport and bottom-anchored the facade image. `background-size: cover` preserves its aspect ratio; status-bar and text styling are unchanged.
- **Verification:** `git diff --check` passed; installed-phone confirmation remains needed.

### Welcome image extension reverted — 13 October 2026

- Reverted the attempted 200px mobile artwork extension and restored the original `inset: -40px` layer and centered vertical framing. The Welcome continues to use `facade-building.jpg`; no image asset was modified or generated into the project. Status-bar and text styles are unchanged.
- **Verification:** `git diff --check` passed; no device test run.

### Welcome Get started action — 13 October 2026

- Replaced the split Sign in/Sign up tabs with a centered black pill button labeled “Get started” that navigates to `/login`.
- Anchored the button above the bottom safe area and clipped horizontal overflow on the mobile Welcome screen.
- **Verification:** `git diff --check` passed; no automated tests run.

### Welcome photo overscan and root canvas — 13 October 2026

- Oversized the mobile Welcome photo layer to `inset: -200px` and set its facade background to `88% center / cover`.
- Added a Welcome-scoped `html:has(...)` background using the same facade photo with `#4569c5` fallback; the matching `body` background is transparent only while Welcome is mounted.
- Kept status-bar settings and text block rules unchanged. Existing mobile horizontal overflow clipping remains in place.
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

### Welcome background asset swap — 13 October 2026

- Added the supplied full-resolution `Gemini rooftop (7).png` to `src/assets/library/rooftop-pool-evening.png` and generated `public/assets/rooftop-pool-evening.jpg` for delivery (2048px wide, quality 86; 1.98 MB).
- Changed only the Welcome background image URL to the new asset. Existing crop, sizing, position, status bar, text, button, and viewport rules were left unchanged.
- **Verification:** Confirmed the optimized file is below 2 MB and `git diff --check` passed. Device visual confirmation remains pending.

### Welcome Get started button size — 13 October 2026

- Increased only the Get started button dimensions by 30%: width cap from 190px to 247px and minimum height from 46px to 60px. Label size and button placement are unchanged.
- **Verification:** `git diff --check` passed; no physical-device visual check performed.

### Welcome image framing adjustment — 13 October 2026

- Updated only the Welcome background image's horizontal crop from 88% right-shifted to left-aligned, retaining `background-size: cover` and vertical centering to match the user's portrait crop reference.
- No text, button, status-bar, viewport, or other screen styling changed.
- **Verification:** `git diff --check` passed; compare the live and installed phone crop against the supplied reference.

### Welcome values text color — 13 October 2026

- Changed only the Innovation / Experience / Trust text color to `#e8c374`. Position, sizing, shadow, and all other screen styling remain unchanged.
- **Verification:** `git diff --check` passed.

### Welcome values spacing and position — 13 October 2026

- Moved the Innovation / Experience / Trust text block down 30 CSS px by reducing its bottom offset from 210px to 180px (safe-area offset retained).
- Increased the vertical gap between the words to `0.15em` (15% of their font size). Text color, size, and horizontal centering are unchanged.
- **Verification:** `git diff --check` passed.

### Welcome values brush backdrop — 13 October 2026

- Added a curved, translucent deep-navy brush-smudge SVG behind the Innovation / Experience / Trust block using a non-interactive pseudo-element.
- The mark sits behind the text only; text color, position, size, spacing, and the rest of the Welcome layout are unchanged.
- **Asset:** `public/assets/welcome-text-brush.svg`.
- **Verification:** `git diff --check` passed; visual review on device remains pending.

### Welcome brush backdrop removed — 13 October 2026

- Removed the translucent brush pseudo-element and its SVG asset from behind the Welcome values text. Text color, position, size, and spacing remain as before the brush was added.
- **Verification:** `git diff --check` passed.

### Welcome facade image restored — 13 October 2026

- Switched the Welcome background image URL to the existing `facade-building.jpg` asset and changed only its crop alignment to `88% center` to match the supplied portrait crop reference.
- Retained `background-size: cover` and all other Welcome styling and layout.
- **Verification:** Confirmed the referenced facade asset exists; `git diff --check` passed.

### Welcome courtyard image and crop — 13 October 2026

- Added the supplied `Gemini Courtyard (5).png` to `src/assets/library/courtyard-five.png` and generated `public/assets/courtyard-five.jpg` (2048×1500, quality 86).
- Changed the Welcome background to this asset and set its cover crop to `56% center` to match the supplied portrait reference. Other Welcome styling is unchanged.
- **Verification:** Optimized asset is 692 KB; `git diff --check` passed.

### Welcome values moved below brand line — 13 October 2026

- Grouped the Innovation / Experience / Trust list beneath the STAROOT HUB eyebrow with a 20px top gap, and left-aligned the values.
- Added a solid gold (`#e8c374`) rectangular block before each value. Text color, type size, line spacing, and all background/button/status-bar styling remain unchanged.
- **Verification:** `git diff --check` passed.

### Welcome values left alignment and scale — 13 October 2026

- Set the Welcome copy container's left and right inset to 5px, keeping the STAROOT HUB eyebrow centered while aligning the values list and its markers 5px from the screen edge.
- Reduced only the values list font size by 25%; marker dimensions and line gap scale with the text via `em` units.
- **Verification:** `git diff --check` passed.

### Welcome brand line removed and button restyled — 13 October 2026

- Removed the STAROOT HUB eyebrow line from the Welcome screen and removed the now-unused 20px spacing above the values list.
- Restyled Get started with a translucent `#e8c374` fill and a subtle backdrop blur so the photo shows through; increased its font size 40% (0.8rem to 1.12rem). Button size and position remain unchanged.
- **Verification:** `git diff --check` passed.
- Increased the Get started button's gold fill opacity from 38% to 49% (30% less transparency); left its border, blur, dimensions, position, and text unchanged.
- **Verification:** `git diff --check` passed.

### Welcome swipe navigation blocked — 13 October 2026

- Blocked browser history `POP` navigation while Welcome is open and immediately reset the blocker, preventing an edge-swipe/back gesture from navigating to another screen. The Get Started link still navigates to `/login`.
- Changed the button label casing to “Get Started”. Existing Welcome touch-action rules remain in place.
- **Verification:** `git diff --check` passed; typecheck not yet run.

### Welcome and Login swipe gestures — 13 October 2026

- Added a history `POP` blocker to Login as well as Welcome. Back and edge-swipe gestures no longer navigate away while either screen is open; explicit links and buttons remain available.
- **Verification:** `git diff --check` passed; typecheck not run.

### Welcome and Login horizontal swipe suppression — 13 October 2026

- Set Welcome and Login containers to `touch-action: pan-y` with horizontal overscroll disabled, suppressing horizontal swipe navigation while preserving vertical movement such as scrolling the Login form. Existing history blockers prevent browser back/edge gestures from changing routes.
- **Verification:** `git diff --check` passed; no automated tests run.

### Auth edge-swipe root suppression — 13 October 2026

- Extended horizontal overscroll suppression and `pan-y` touch behavior to `html` and `body` while Welcome or Login is mounted. This addresses the browser's edge-swipe preview, which was visible even when the React Router history blocker prevented the route change.
- **Verification:** `git diff --check` passed; device verification remains pending.

### Sign Up content offset — 13 October 2026

- Increased only the Sign Up white panel's top padding from 28px to 38px, moving its form content 10px downward without moving the panel, artwork, header, or other screens.
- **Verification:** `git diff --check` passed.

### Login screen card redesign — 13 October 2026

- Replaced the abstract Login artwork with the Welcome courtyard image alone behind a floating white card; removed the separate Staroot brand header from Login and changed the card title to “Login to Proceed.” Existing email/password input types, placeholders, remember-me, forgot-password, and Sign up link remain.
- Anchored the Sign in button at the same centered bottom position and safe-area offset as Welcome's Get Started button, matching its translucent gold styling and 247×60px dimensions. Added a Google G mark just below it.
- The Sign in and Google controls remain visual mockups; no authentication provider is wired to them in this screen yet. Actual email/password authentication logic is in `src/core/auth/AuthProvider.tsx`.
- **Verification:** `git diff --check` passed; no tests run.

### Sign Up screen restored — 13 October 2026

- Reverted the requested account-creation removal: restored the `/signup` route, Sign Up screen, Login-to-sign-up link, and supporting visual styles. Login retains its admin access copy is no longer displayed; the original sign-up prompt is back.
- **Verification:** `git diff --check` passed.

### Login card height reduced — 13 October 2026

- Kept the Login card's bottom edge fixed and moved its top from 32% to 59.2%, reducing its height by 40% relative to the prior viewport height. The card remains internally scrollable; the Sign in button retains its screen position.
- **Verification:** `git diff --check` passed.

### Login card shifted upward — 13 October 2026

- Shifted the Login card and its anchored Sign in and Google mark upward by 50px, preserving their relative placement and card height.
- **Verification:** `git diff --check` passed.

### Sign Up flow removed — 13 October 2026

- Removed the `/signup` route and Sign Up screen, its Login link, and signup-only artwork helpers and styles. The Login screen now states that access is managed by the organization. Email/password sign-in remains.
- **Verification:** `git diff --check` passed.

### Login actions layered above card — 13 October 2026

- Raised the anchored Sign in button and Google mark above the Login card's stacking layer so they render visibly over the card.
- **Verification:** `git diff --check` passed.

### Login actions integrated into card — 13 October 2026

- Moved the Sign in button and Google mark inside the Login card. Put the form fields and organization access note in a separate scroll area so the actions stay attached to the card as it moves.
- **Verification:** `git diff --check` passed.

### Login card height increased — 13 October 2026

- Increased the Login card height by 30% while keeping its bottom edge fixed, moving its top from 59.2% to 47% of the viewport. Button and Google mark remain in the card.
- **Verification:** `git diff --check` passed.

### Login scrolling and swipe disabled — 13 October 2026

- Disabled page and card scrolling and all touch panning on Login, including horizontal gestures. Kept the existing history POP guard so browser back gestures cannot change screens; visible navigation controls remain tappable.
- **Verification:** `git diff --check` passed.

### Login bottom safe-area background — 13 October 2026

- Matched the mobile Login wrapper and phone minimum heights to `100vh`, including overriding the base 600px phone minimum. The artwork remains fixed and extends 48px below the viewport outside the phone wrapper, covering the bottom safe-area strip.
- Kept the artwork's top edge, status-bar treatment, Login content positions, and scroll/swipe blocking unchanged.
- **Verification:** `git diff --check` passed; Android device validation was unavailable because `adb` is not installed in this shell.

### Login card scrolling and action placement — 13 October 2026

- Restored vertical scrolling inside the Login card by enabling scrolling on `.auth-login-content` and removing the page-level `touch-action: none` / overflow locks. The POP history guard remains so navigation can still use the explicit Back link.
- Removed the Google mark. Placed the Sign in button in the card flow below Remember me / Forgot password, so it scrolls with the form content.
- **Verification:** `git diff --check` passed; no automated tests run.

### Login card glass surface — 13 October 2026

- Applied the scoped `.glass3d` layered treatment to `.auth-white-panel-login`: a tinted 2px backdrop blur, specular inner edge, and layered shadow. The external noise image is omitted so the effect remains self-contained. Card layout and content remain unchanged.
- **Verification:** `git diff --check` passed; no automated tests run.

### Login field glass surface — 13 October 2026

- Applied a lighter translucent glass treatment to the email and password fields, with a subtle backdrop blur and specular edge. Labels, inputs, and field layout are unchanged.
- **Verification:** `git diff --check` passed; no automated tests run.

### Login text color — 13 October 2026

- Set the Login heading, email/password labels and input text, placeholders, and Forgot password control to white. Remember me and the organization note retain their prior colors.
- **Verification:** `git diff --check` passed; no automated tests run.

### Login organization note color — 13 October 2026

- Changed the organization-managed access note to white.
- **Verification:** `git diff --check` passed; no automated tests run.

### Login fields and remember option — 13 October 2026

- Restyled email/password as horizontal glass input rows with envelope and lock icons; kept accessible input names and existing input types/autocomplete. Changed the remember label to “Keep me signed in” and used the gold theme accent. Forgot password remains.
- **Verification:** `git diff --check` passed; no automated tests run.

### Login organization note size — 13 October 2026

- Increased the organization-access note from `0.76rem` to `0.95rem` (25%). Color and placement are unchanged.
- **Verification:** `git diff --check` passed; no automated tests run.

### Login options alignment — 13 October 2026

- Made the “Keep me signed in” checkbox circular and aligned its left edge with the email/password icons. Inset the options row so Forgot password aligns with the input fields.
- **Verification:** `git diff --check` passed; no automated tests run.

### Login options text size — 13 October 2026

- Set “Keep me signed in” and “Forgot password?” to `0.9rem`; checkbox size and alignment are unchanged.
- **Verification:** `git diff --check` passed; no automated tests run.

### Login access note spacing — 13 October 2026

- Added 10px to the access note's bottom margin, making its gap above the Login fields 26px.
- **Verification:** `git diff --check` passed; no automated tests run.

### Login field spacing and icons — 13 October 2026

- Increased the field gap from 16px to 24px and scaled the envelope/lock icons from 20px to 25px.
- **Verification:** `git diff --check` passed; no automated tests run.

### Welcome button position — 13 October 2026

- Raised the Get Started button by 15px through its bottom offset. Size and styling are unchanged.
- **Verification:** `git diff --check` passed; no automated tests run.

### Login button spacing — 13 October 2026

- Added 24px between the options row and Sign in button, moving the button down by the same amount.
- **Verification:** `git diff --check` passed; no automated tests run.

### Login Staroot mark — 13 October 2026

- Added the supplied white Staroot SVG as `public/assets/staroot-logo-white.svg` and extracted its star plus gold strike-through into `public/assets/staroot-mark-white.svg`.
- Placed the extracted mark centered on the Login screen, 55px below the top safe-area inset. It is independent of the card and page copy.
- **Verification:** `git diff --check` passed; no automated tests run.

### Hub wallpaper, theme, and radial wheel — 14 October 2026

- Added the stone wallpaper to the Hub as a fixed full-screen layer, with a subtle 1px blur; the fixed safe-area header stays above it while the page content scrolls underneath.
- Replaced the dark navy theme surfaces with a charcoal palette centered on `#3e3e45`; updated the PWA theme/background colors and favicon background. Blue accents remain unchanged.
- Removed the labels around the radial wheel while retaining the active module title and detail block. Enlarged the wheel for a 20px left inset, then reduced that enlargement by 20% and shifted the wheel 28px right from the initial enlarged position. Widened the wedge gap to compensate for the segment stroke so adjacent modules remain visibly separated.
- Kept the wheel's center slot aligned and adjusted pointer coordinate mapping to preserve drag interaction after scaling.
- **Verification:** `git diff --check` passed; no automated tests run.

### Hub wallpaper image and crop — 14 October 2026

- Replaced `public/assets/hub-stone-wallpaper.png` with the supplied rooftop photo at `public/assets/hub-rooftop-wallpaper.png`; the old stone image file was removed.
- Matched the portrait reference crop with the photo background layer at `background-size: auto 156%` and `background-position: 77% 100%`. The gradient layer remains full-screen.
- Removed the temporary 1px blur and its 1% overscale after the follow-up request. The final photo renders sharp with no blur.
- **Verification:** `git diff --check` passed; no automated tests run.
