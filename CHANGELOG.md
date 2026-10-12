# Staroot Hub - Changelog

All work on this project is logged here, newest first.
Header format: [date HHmmss] Day | UTC+3 | Agent: name
Add entries with: .\scripts\add-changelog.ps1 -Agent "name" -Phase "n" -Type Added -Message "..." -Files "a","b"

<!-- ENTRIES -->

## [2026-10-12 112407] Monday | UTC+3 | Agent: Codex
- **Phase:** 3
- **Type:** Added
- **Status:** Done
- **Summary:** Completed Phase 3 approval attachments and Web Push wiring, offline approval list/detail cache and queued-request visibility, live approval badge, and sync handler startup ordering. Created and verified private Appwrite attachments bucket; build, typecheck, and 62 tests pass (5 TODO/skipped). Browser/API-host validation remains pending.
- **Files:**
  - `api/approvals/upload.ts`
  - `api/approvals/attachment.ts`
  - `api/push/subscribe.ts`
  - `api/push/public-key.ts`
  - `api/_lib/push.ts`
  - `src/modules/approvals/services/approvals.service.ts`
  - `src/modules/approvals/services/approvals.sync.ts`
  - `src/modules/hub/components/HubScreen.tsx`
  - `scripts/appwrite-setup.ts`


## [2026-10-12 111646] Monday | UTC+3 | Agent: Codex
- **Phase:** 3b
- **Type:** Changed
- **Status:** Done
- **Summary:** Allowed the new .env.example template to be tracked so deployment configuration requirements are visible without committing local secrets.
- **Files:**
  - `.gitignore`
  - `.env.example`


## [2026-10-12 111636] Monday | UTC+3 | Agent: Codex
- **Phase:** 3b
- **Type:** Docs
- **Status:** In progress
- **Summary:** Updated both append-only handoff logs with verification status, Phase 3b scope, missing PHASE3_APPLY.md note, and the Appwrite bucket approval blocker.
- **Files:**
  - `HANDOFF.md`
  - `docs/HANDOFF.md`


## [2026-10-12 111632] Monday | UTC+3 | Agent: Codex
- **Phase:** 3b
- **Type:** Added
- **Status:** In progress
- **Summary:** Added approval attachment capture, offline blob queuing, private server-side upload/download endpoints, Web Push subscription and delivery, per-user approval read caching, queued request visibility, and live pending-approval badges. Runtime attachment storage still requires the private Appwrite bucket.
- **Files:**
  - `api/_lib/approvalsRepo.ts`
  - `api/_lib/approvalsSchemas.ts`
  - `api/_lib/notify.ts`
  - `api/_lib/push.ts`
  - `api/approvals/submit.ts`
  - `api/approvals/upload.ts`
  - `api/approvals/attachment.ts`
  - `api/push/subscribe.ts`
  - `api/push/public-key.ts`
  - `src/core/api/client.ts`
  - `src/core/api/endpoints.ts`
  - `src/core/offline/db.ts`
  - `src/core/offline/dexieStore.ts`
  - `src/core/offline/syncEngine.ts`
  - `src/core/offline/types.ts`
  - `src/core/push/pushClient.ts`
  - `src/core/push/usePushPermission.ts`
  - `src/modules/approvals/components/ApprovalList.tsx`
  - `src/modules/approvals/components/RequestDetail.tsx`
  - `src/modules/approvals/components/RequestForm.tsx`
  - `src/modules/approvals/hooks/use-approvals.ts`
  - `src/modules/approvals/services/approvals.service.ts`
  - `src/modules/approvals/services/approvals.sync.ts`
  - `src/modules/hub/components/HubScreen.tsx`
  - `src/modules/notifications/components/PushPrePrompt.tsx`
  - `scripts/appwrite-setup.ts`
  - `package.json`
  - `package-lock.json`


## [2026-10-12 111622] Monday | UTC+3 | Agent: Codex
- **Phase:** 2 / 3a
- **Type:** Changed
- **Status:** Done
- **Summary:** Closed the verified Phase 2 sync wiring and Phase 3a schema check: approval handlers now register before the engine starts; typecheck and Appwrite setup succeeded, with approval collections and indexes already present.
- **Files:**
  - `src/main.tsx`
  - `api/approvals/resubmit.ts`
  - `src/modules/approvals/services/approvals.service.ts`


## [2026-10-12 105458] Monday | UTC+3 | Agent: Codex
- **Phase:** 2
- **Type:** Fixed
- **Status:** Done
- **Summary:** Fixed two typecheck blockers: removed an unused resubmit import and routed approval writes through the sync engine enqueue API.
- **Files:**
  - `api/approvals/resubmit.ts`
  - `src/modules/approvals/services/approvals.service.ts`


## [2026-10-11 142222] Sunday | UTC+3 | Agent: Scaffold Script
- **Phase:** 0
- **Type:** Added
- **Status:** Done
- **Summary:** Created initial folder and file structure
- **Files:**
  - `docs/`
  - `appwrite/`
  - `api/`
  - `src/`
  - `tests/`
  - `scripts/`

## [2026-10-12] Monday | UTC+3 | Agent: Codex
- **Phase:** 4 (deferred)
- **Type:** Status
- **Status:** Pending
- **Summary:** Deferred CRM implementation at the user's direction. Recorded the partial, unverified CRM foundation and marked Phase 4 and subsequent phases pending until resumed.
- **Files:**
  - `HANDOFF.md`
  - `docs/HANDOFF.md`
  - `api/crm/`
  - `api/_lib/crmRepo.ts`
  - `api/_lib/crmSchemas.ts`
  - `src/modules/crm/`

## [2026-10-12] Monday | UTC+3 | Agent: Codex
- **Phase:** 3 verification recheck / Phase 4 deferred
- **Type:** Status
- **Status:** Pending verification
- **Summary:** Rechecked the current tree. Full-project typecheck is blocked by four diagnostics in incomplete, deferred CRM files. API-host browser verification is still unavailable because no Vercel CLI/API service is running. Recorded current blockers without continuing CRM implementation.
- **Files:**
  - `HANDOFF.md`
  - `docs/HANDOFF.md`
  - `api/crm/detail.ts`
  - `api/crm/leads.ts`
  - `vite.config.ts`

## [2026-10-12] Monday | UTC+3 | Agent: Codex
- **Phase:** 3 verification recheck
- **Type:** Changed
- **Status:** Partial
- **Summary:** Corrected the API-host status: an existing Vercel dev server on port 3000 serves Staroot Hub and returns 401 for unauthenticated session-protected routes. This smoke check does not replace authenticated Phase 3 end-to-end validation.
- **Files:**
  - `HANDOFF.md`
  - `docs/HANDOFF.md`

## [2026-10-12] Monday | UTC+3 | Agent: Codex
- **Phase:** 5
- **Type:** Added
- **Status:** Done; authenticated runtime validation pending
- **Summary:** Implemented Site Progress logs, camera evidence, verification, cached/offline reporting, report archive/viewer, and branded PDF/DOCX exports. Reused the verified private attachments bucket because Appwrite plan quota prevented creating a second bucket. Typecheck and production build pass; performance warning and authenticated runtime validation are recorded in the handoff.
- **Files:**
  - `src/modules/site-progress/`
  - `api/site/`
  - `api/_lib/siteRepo.ts`
  - `api/_lib/siteSchemas.ts`
  - `api/_lib/sitePhotos.ts`
  - `src/core/camera/`
  - `src/core/export/`
  - `src/core/api/client.ts`
  - `src/core/api/endpoints.ts`
  - `src/app/router.tsx`
  - `src/main.tsx`
  - `scripts/appwrite-proofs.ts`
  - `scripts/appwrite-setup.ts`
  - `package.json`
  - `package-lock.json`
  - `.env.example`
  - `docs/DEPLOYMENT.md`
  - `appwrite/permissions.md`
  - `HANDOFF.md`
  - `docs/HANDOFF.md`

## Phase 6 — Inventory & Logistics

- Implemented inventory catalogue, stock/reorder view, authorized catalogue creation, transactional append-only movement ledger, offline queueing, custody view, movement search, dispatch sharing, and camera evidence.
- Stock writes are paired atomically with movement rows; return quantities are checked against custodian dispatch history. Photo evidence remains private and uses the shared attachments bucket.
- Typecheck and production build pass. Authenticated runtime and offline replay validation remain pending. Build warning remains: 619 kB main chunk and approximately 1.8 MB PWA precache.
- CRM remains Coming Soon; Phase 3 remains pending by user direction; Phase 2 final verification stays deferred.

## Phase 7 — Hardening and release preparation

- Partitioned the offline outbox by account, held legacy ownerless writes for review, added API security headers, and preferred hosting-edge IP headers for login throttling.
- Moved shared evidence UI into core, lazy-loaded feature routes, removed unused animation runtime usage, and added runtime caching for lazy chunks. Main bundle fell from approximately 619 kB to 433 kB; install precache fell from approximately 1.8 MB to 691 kB.
- Added inventory search indexes and applied them to the configured Appwrite project; added persistent-storage request, device/offline test matrix, and deployment guide.
- Verification: 63 tests passed (5 skipped, 5 todo), build passed, npm audit reports zero vulnerabilities, and unauthenticated API smoke checks return 401. Authenticated browser/device matrix and Lighthouse audit remain release gates.

## [2026-10-12] Monday | UTC+3 | Agent: Codex
- **Phase:** 7 release validation
- **Type:** Verified
- **Status:** Implementation complete; release checks pending
- **Summary:** Revalidated the current tree: typecheck and production build pass; build emits the service worker with a 433.10 kB main chunk and 691.32 KiB precache. Firefox was open to Staroot Hub, but authenticated inspection could not proceed because Computer Use stopped on unsupported URL policy enforcement for this Windows browser. Authenticated device/offline and Lighthouse checks remain pending.
- **Files:**
  - `HANDOFF.md`
  - `docs/HANDOFF.md`
  - `CHANGELOG.md`

## [2026-10-12] Monday | UTC+3 | Agent: Codex
- **Phase:** 7 hardening
- **Type:** Changed and verified
- **Status:** Static response headers implemented; production host check pending
- **Summary:** Added Vercel static/API response headers for content-type sniffing, framing, and referrer controls. Local runtime confirms the app shell returns these headers and API handlers keep their camera/microphone/geolocation restriction. Documented equivalent configuration for non-Vercel hosts.
- **Files:**
  - `vercel.json`
  - `docs/DEPLOYMENT.md`
  - `HANDOFF.md`
  - `docs/HANDOFF.md`
  - `CHANGELOG.md`

## [2026-10-12] Monday | UTC+3 | Agent: Codex
- **Phase:** 2 sync closeout verification
- **Type:** Verified
- **Status:** Unit-level sync checks pass; device replay pending
- **Summary:** Current Vitest suite passes (63 passed, 5 skipped, 5 TODO); sync engine has 18 passing tests including account isolation. The initial sandbox run failed before tests due to esbuild `spawn EPERM`; approved elevated rerun passed. Authenticated two-account offline replay remains open.
- **Files:**
  - `HANDOFF.md`
  - `docs/HANDOFF.md`
  - `CHANGELOG.md`

## [2026-10-12] Monday | UTC+3 | Agent: Codex
- **Phase:** 7 security verification
- **Type:** Verified
- **Status:** No dependency vulnerabilities reported
- **Summary:** Rechecked the current lockfile with both `npm audit` and `npm audit --omit=dev`; each reports zero vulnerabilities.
- **Files:**
  - `HANDOFF.md`
  - `docs/HANDOFF.md`
  - `CHANGELOG.md`

## [2026-10-12] Monday | UTC+3 | Agent: Codex
- **Phase:** UI foundations / Phase 7 UI review
- **Type:** Changed and verified
- **Status:** Shared palette and responsive safe-area foundations updated; physical-device validation pending
- **Summary:** Applied the current blue-palette usage rules with neutral large surfaces in both themes, updated the light theme status-bar color and DOCX report colors, and reconciled `uiscope.md` with the latest palette and safe-area requirements while preserving page zoom.
- **Verification:** `npm run build` passes (TypeScript and Vite production build). No authenticated device matrix or Lighthouse audit was run.
- **Scope:** Phase 3 remains on hold; CRM remains Coming Soon and unchanged.
- **Files:** `uiscope.md`, `src/styles/index.css`, `src/core/theme/themes.ts`, `src/core/export/docx.ts`, `HANDOFF.md`, `docs/HANDOFF.md`, `CHANGELOG.md`

## [2026-10-12] Monday | UTC+3 | Agent: Codex
- **Type:** Changed
- **Summary:** Disabled page pinch scaling for a stable app-like viewport, retained `viewport-fit=cover`, set form controls to 16px to avoid iOS focus zoom, and updated `uiscope.md` to reflect the user's current direction.
- **Verification:** Not run; metadata/CSS-only change.
- **Files:** `index.html`, `src/styles/index.css`, `uiscope.md`, `HANDOFF.md`, `docs/HANDOFF.md`, `CHANGELOG.md`

## [2026-10-12] Monday | UTC+3 | Agent: Codex
- **Type:** Changed
- **Summary:** Increased shared top safe-area padding to include a 5px gap below the system inset on module and nested screens; matched modal top padding and documented the rule in `uiscope.md`.
- **Verification:** Not run; CSS-only adjustment.
- **Files:** `src/styles/index.css`, `uiscope.md`, `HANDOFF.md`, `docs/HANDOFF.md`, `CHANGELOG.md`

## [2026-10-12] Monday | UTC+3 | Agent: Codex
- **Type:** Changed
- **Summary:** Increased the module and nested-screen top gap after the safe-area inset to 15px, including modal top padding; updated `uiscope.md` accordingly.
- **Verification:** Not run; CSS-only adjustment.
- **Files:** `src/styles/index.css`, `uiscope.md`, `HANDOFF.md`, `docs/HANDOFF.md`, `CHANGELOG.md`

## [2026-10-12] Monday | UTC+3 | Agent: Codex
- **Type:** Changed
- **Summary:** Added 10px to the module and nested-screen top gap, increasing it from 15px to 25px beyond the safe-area inset; modal top padding matches.
- **Verification:** Not run; CSS-only adjustment.
- **Files:** `src/styles/index.css`, `uiscope.md`, `HANDOFF.md`, `docs/HANDOFF.md`, `CHANGELOG.md`
