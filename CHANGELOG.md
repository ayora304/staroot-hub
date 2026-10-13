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

## [2026-10-13] Tuesday | UTC+3 | Agent: Codex
- **Type:** Changed
- **Summary:** Restored the template-based Welcome, sign-up, and sign-in visual screens plus a static Staroot splash preview route. Added local navigation between preview screens; form submission, password recovery, social sign-in, and splash timing/auth transitions are intentionally not wired, per request.
- **Verification:** Pending typecheck and production build.
- **Files:** `src/core/auth/AuthArtwork.tsx`, `src/core/auth/WelcomeScreen.tsx`, `src/core/auth/SignUpScreen.tsx`, `src/core/auth/SignInScreen.tsx`, `src/core/auth/SplashScreen.tsx`, `src/core/auth/RequireAuth.tsx`, `src/app/router.tsx`, `src/styles/index.css`, `uiscope.md`, `HANDOFF.md`, `docs/HANDOFF.md`, `CHANGELOG.md`
- **Post-change verification:** `npm run build` passed, including TypeScript, Vite production output, and service-worker generation.

## [2026-10-13] Tuesday | UTC+3 | Agent: Codex
- **Type:** Changed
- **Summary:** Extended the Welcome screen artwork behind the mobile status-bar/safe-area region by making its background viewport-fixed and full-bleed on small screens. Welcome content remains layered above it; desktop preview framing is unchanged.
- **Verification:** `npm run build` passed; `git diff --check` passed (Git reported line-ending conversion warnings only).
- **Platform note:** On iOS this relies on the existing `viewport-fit=cover` and `black-translucent` PWA metadata and should be checked from the installed Home Screen app. Android status-bar drawing is ultimately controlled by the installed WebAPK/native shell.
- **Files:** `src/core/auth/WelcomeScreen.tsx`, `src/styles/index.css`, `HANDOFF.md`, `docs/HANDOFF.md`, `CHANGELOG.md`

## [2026-10-13] Tuesday | UTC+3 | Agent: Codex
- **Type:** Changed
- **Summary:** Aligned the Welcome values list and markers 5px from the left screen edge and reduced the values text size by 25%. The STAROOT HUB line remains centered.
- **Verification:** `git diff --check` passed.
- **Files:** `src/styles/index.css`, `HANDOFF.md`, `docs/HANDOFF.md`, `CHANGELOG.md`

## [2026-10-13] Tuesday | UTC+3 | Agent: Codex
- **Type:** Changed
- **Summary:** Removed the Welcome STAROOT HUB line; changed Get started to translucent gold and increased its label font size by 40%, leaving button dimensions and position unchanged.
- **Verification:** `git diff --check` passed.
- **Files:** `src/core/auth/WelcomeScreen.tsx`, `src/styles/index.css`, `HANDOFF.md`, `docs/HANDOFF.md`, `CHANGELOG.md`

## [2026-10-13] Tuesday | UTC+3 | Agent: Codex
- **Type:** Changed
- **Summary:** Added the five supplied PNGs to `public/assets` with descriptive filenames and replaced the Welcome screen's abstract SVG background with the fourth supplied image, `Gemini Courtyard (8).png`. Shifted the cover crop right to feature the building and courtyard structure.
- **Verification:** `npm run build` passed; build was run before the final CSS-only crop-position adjustment from mobile-only to all Welcome sizes.
- **Files:** `public/assets/welcome-rooftop.png`, `public/assets/creative-nebula.png`, `public/assets/rooftop-swimmer.png`, `public/assets/courtyard-pool.png`, `public/assets/facade-building.png`, `src/core/auth/WelcomeScreen.tsx`, `src/styles/index.css`, `HANDOFF.md`, `docs/HANDOFF.md`, `CHANGELOG.md`

## [2026-10-13] Tuesday | UTC+3 | Agent: Codex
- **Type:** Fixed
- **Summary:** Preserved the original five PNGs under `src/assets/library/` and generated JPEG delivery copies under `public/assets/` (quality 86) to keep each served image below the PWA precache limit. Updated Welcome to use `courtyard-pool.jpg`.
- **Verification:** `npm run build` passed, including TypeScript, Vite, and service-worker precache generation (17 entries; 700.16 KiB total).
- **Files:** `src/assets/library/*.png`, `public/assets/*.jpg`, `src/styles/index.css`, `CHANGELOG.md`, `HANDOFF.md`, `docs/HANDOFF.md`

## [2026-10-13] Tuesday | UTC+3 | Agent: Codex
- **Type:** Changed
- **Summary:** Updated the Welcome screen per the supplied layout: removed the welcome headline/body copy, retained the eyebrow, added the Innovation/Experience/Trust values list, and applied the requested positioning, typography, spacing, and stacking styles. Background image and sign-in/sign-up switch styling remain unchanged.
- **Verification:** Not run; checked the patch for whitespace errors.
- **Files:** `src/core/auth/WelcomeScreen.tsx`, `src/styles/index.css`, `CHANGELOG.md`, `HANDOFF.md`, `docs/HANDOFF.md`

## [2026-10-13] Tuesday | UTC+3 | Agent: Codex
- **Type:** Changed
- **Summary:** Added transparent backdrop blur to the Welcome screen's top and bottom safe-area strips, with no color overlay. Left the background image and all text styles unchanged.
- **Verification:** `git diff --check` passed (line-ending warnings only); no device build/test run.
- **Platform note:** The existing Android WebAPK shell may still color the native status bar from its theme; page CSS cannot blur pixels in a native bar that does not display the page beneath it.
- **Files:** `src/styles/index.css`, `HANDOFF.md`, `docs/HANDOFF.md`, `CHANGELOG.md`

## [2026-10-13] Tuesday | UTC+3 | Agent: Codex
- **Type:** Changed
- **Summary:** Added the supplied Courtyard (5) image to the asset library and switched Welcome to its optimized copy, using a 56% centered cover crop matching the supplied reference.
- **Verification:** Optimized image is 692 KB; `git diff --check` passed.
- **Files:** `src/assets/library/courtyard-five.png`, `public/assets/courtyard-five.jpg`, `src/styles/index.css`, `HANDOFF.md`, `docs/HANDOFF.md`, `CHANGELOG.md`

## [2026-10-13] Tuesday | UTC+3 | Agent: Codex
- **Type:** Changed
- **Summary:** Moved the Welcome values list to 20px below the STAROOT HUB line, left-aligned each word, and added a solid gold block before each one.
- **Verification:** `git diff --check` passed.
- **Files:** `src/core/auth/WelcomeScreen.tsx`, `src/styles/index.css`, `HANDOFF.md`, `docs/HANDOFF.md`, `CHANGELOG.md`

## [2026-10-13] Tuesday | UTC+3 | Agent: Codex
- **Type:** Changed
- **Summary:** Added a translucent curved brush-smudge behind the Welcome values text to improve contrast, without changing the text or other screen elements.
- **Verification:** `git diff --check` passed; device visual review remains pending.
- **Files:** `public/assets/welcome-text-brush.svg`, `src/styles/index.css`, `HANDOFF.md`, `docs/HANDOFF.md`, `CHANGELOG.md`

## [2026-10-13] Tuesday | UTC+3 | Agent: Codex
- **Type:** Changed
- **Summary:** Set Welcome's background to the existing facade image with right-shifted `88% center` cover framing to match the supplied crop reference. Other screen styling was left unchanged.
- **Verification:** Confirmed the facade asset exists; `git diff --check` passed.
- **Files:** `src/styles/index.css`, `HANDOFF.md`, `docs/HANDOFF.md`, `CHANGELOG.md`

## [2026-10-13] Tuesday | UTC+3 | Agent: Codex
- **Type:** Reverted
- **Summary:** Removed the Welcome values brush backdrop and its SVG asset; restored the prior clean background behind the unchanged text block.
- **Verification:** `git diff --check` passed.
- **Files:** `public/assets/welcome-text-brush.svg`, `src/styles/index.css`, `HANDOFF.md`, `docs/HANDOFF.md`, `CHANGELOG.md`

## [2026-10-13] Tuesday | UTC+3 | Agent: Codex
- **Type:** Changed
- **Summary:** Moved the Welcome values text block down 30 CSS px and added 0.15em vertical spacing between its lines; retained existing text color, size, and alignment.
- **Verification:** `git diff --check` passed.
- **Files:** `src/styles/index.css`, `HANDOFF.md`, `docs/HANDOFF.md`, `CHANGELOG.md`

## [2026-10-13] Tuesday | UTC+3 | Agent: Codex
- **Type:** Changed
- **Summary:** Set the Welcome Innovation / Experience / Trust text color to `#e8c374`; made no other visual changes.
- **Verification:** `git diff --check` passed.
- **Files:** `src/styles/index.css`, `HANDOFF.md`, `docs/HANDOFF.md`, `CHANGELOG.md`

## [2026-10-13] Tuesday | UTC+3 | Agent: Codex
- **Type:** Changed
- **Summary:** Reframed only the Welcome background photo to the left side of its source image to match the supplied portrait reference; retained cover sizing and vertical centering.
- **Verification:** `git diff --check` passed; visual comparison on the installed phone remains pending.
- **Files:** `src/styles/index.css`, `HANDOFF.md`, `docs/HANDOFF.md`, `CHANGELOG.md`

## [2026-10-13] Tuesday | UTC+3 | Agent: Codex
- **Type:** Changed
- **Summary:** Swapped only the Welcome background asset to the supplied rooftop pool image. Kept existing crop, sizing, framing, status-bar, text, button, and viewport styling unchanged.
- **Verification:** Optimized delivery image is 1.98 MB, below the 2 MB asset limit; `git diff --check` passed. Device visual confirmation remains pending.
- **Files:** `src/assets/library/rooftop-pool-evening.png`, `public/assets/rooftop-pool-evening.jpg`, `src/styles/index.css`, `HANDOFF.md`, `docs/HANDOFF.md`, `CHANGELOG.md`

## [2026-10-13] Tuesday | UTC+3 | Agent: Codex
- **Type:** Changed
- **Summary:** Increased only the Welcome Get started button dimensions by 30%; preserved its label size and position and left other screen elements unchanged.
- **Verification:** `git diff --check` passed; no physical-device visual check performed.
- **Files:** `src/styles/index.css`, `HANDOFF.md`, `docs/HANDOFF.md`, `CHANGELOG.md`

## [2026-10-13] Tuesday | UTC+3 | Agent: Codex
- **Type:** Changed
- **Summary:** Added the supplied courtyard image to the asset library and switched the Welcome background to its optimized JPEG copy. No Welcome layout or styling changed.
- **Verification:** Optimized delivery image is 1.28 MB; `git diff --check` passed. Device visual check remains pending.
- **Files:** `src/assets/library/courtyard-evening.png`, `public/assets/courtyard-evening.jpg`, `src/styles/index.css`, `HANDOFF.md`, `docs/HANDOFF.md`, `CHANGELOG.md`

## [2026-10-13] Tuesday | UTC+3 | Agent: Codex
- **Type:** Fixed
- **Summary:** Removed the remaining `100dvh` sizing overrides from the mobile Welcome screen so its wrapper and phone use `100vh`, matching the auth sizing used elsewhere. Preserved no-swipe and horizontal-overflow behavior, status-bar metadata, image framing, text, and button placement.
- **Verification:** `git diff --check` passed; installed-device visual confirmation remains pending.
- **Files:** `src/styles/index.css`, `HANDOFF.md`, `docs/HANDOFF.md`, `CHANGELOG.md`

## [2026-10-13] Tuesday | UTC+3 | Agent: Codex
- **Type:** Changed
- **Summary:** Bound the Welcome facade photo to a full-viewport screen layer and removed the separate blue page-canvas fallback layer. Photo framing, status-bar metadata, Welcome text, and button styling were preserved.
- **Verification:** Live `/welcome` content and navigation were inspected; `git diff --check` passed. Physical-device confirmation remains needed.
- **Files:** `src/styles/index.css`, `HANDOFF.md`, `docs/HANDOFF.md`, `CHANGELOG.md`

## [2026-10-13] Tuesday | UTC+3 | Agent: Codex
- **Type:** Fixed
- **Summary:** Removed clipping from the fixed mobile Welcome wrapper so the fixed background photo can paint through the bottom safe area. The wrapper remains fixed and non-scrollable; status-bar and text styles are unchanged.
- **Verification:** `git diff --check` passed; physical-device verification remains needed.
- **Files:** `src/styles/index.css`, `HANDOFF.md`, `docs/HANDOFF.md`, `CHANGELOG.md`

## [2026-10-13] Tuesday | UTC+3 | Agent: Codex
- **Type:** Changed
- **Summary:** Locked the mobile Welcome screen wrapper to the full dynamic viewport and disabled scrolling/overscroll so the fixed background photo continues to the bottom safe area. Status-bar metadata and text styles were not changed.
- **Verification:** `git diff --check` passed; no device test run.
- **Files:** `src/styles/index.css`, `HANDOFF.md`, `docs/HANDOFF.md`, `CHANGELOG.md`

## [2026-10-13] Tuesday | UTC+3 | Agent: Codex
- **Type:** Security
- **Summary:** Expanded `.gitignore` to exclude dotenv files in all folders, including `.env*`, `*.env`, and `*.env.*`. Removed the tracked `.env.example` from Git's index while keeping the local copy on disk.
- **Verification:** Confirmed dotenv patterns match root, nested, example, local, and `*.env` names; no dotenv files remain tracked; `git diff --check` passed (line-ending warning only).
- **Files:** `.gitignore`, `.env.example`, `CHANGELOG.md`, `HANDOFF.md`, `docs/HANDOFF.md`

## [2026-10-13] Tuesday | UTC+3 | Agent: Codex
- **Type:** Reverted
- **Summary:** Removed the Welcome safe-area backdrop-blur strips. The existing Welcome photo and text styling are unchanged.
- **Verification:** `git diff --check` passed; no device test run.
- **Files:** `src/styles/index.css`, `HANDOFF.md`, `docs/HANDOFF.md`, `CHANGELOG.md`

## [2026-10-13] Tuesday | UTC+3 | Agent: Codex
- **Type:** Fixed
- **Summary:** Removed clipping from the fixed mobile Welcome wrapper so the fixed background photo can paint through the bottom safe area. The wrapper remains fixed and non-scrollable; status-bar and text styles are unchanged.
- **Verification:** `git diff --check` passed; physical-device verification remains needed.
- **Files:** `src/styles/index.css`, `HANDOFF.md`, `docs/HANDOFF.md`, `CHANGELOG.md`

## [2026-10-13] Tuesday | UTC+3 | Agent: Codex
- **Type:** Fixed
- **Summary:** Extended the fixed mobile Welcome photo layer 200px below the viewport and bottom-anchored the facade image. The image keeps its proportions through `background-size: cover`; status-bar and text styling are unchanged.
- **Verification:** `git diff --check` passed; installed-phone confirmation remains needed.
- **Files:** `src/styles/index.css`, `HANDOFF.md`, `docs/HANDOFF.md`, `CHANGELOG.md`

## [2026-10-13] Tuesday | UTC+3 | Agent: Codex
- **Type:** Reverted
- **Summary:** Reverted the attempted 200px mobile Welcome image-layer extension; restored `inset: -40px` and centered vertical framing. The existing facade photo and status-bar/text styles are unchanged, and no generated image asset was added.
- **Verification:** `git diff --check` passed; no device test run.
- **Files:** `src/styles/index.css`, `HANDOFF.md`, `docs/HANDOFF.md`, `CHANGELOG.md`

## [2026-10-13] Tuesday | UTC+3 | Agent: Codex
- **Type:** Changed
- **Summary:** Replaced the Welcome Sign in/Sign up split buttons with a centered black pill “Get started” button that links to `/login`, anchored above the device bottom safe area. Disabled horizontal overflow on the mobile Welcome screen.
- **Verification:** `git diff --check` passed; no automated tests run.
- **Files:** `src/core/auth/WelcomeScreen.tsx`, `src/styles/index.css`, `HANDOFF.md`, `docs/HANDOFF.md`, `CHANGELOG.md`

## [2026-10-13] Tuesday | UTC+3 | Agent: Codex
- **Type:** Changed
- **Summary:** Applied the two-layer Welcome background approach: mobile artwork overscans by 200px, while the Welcome-scoped root canvas paints the same facade image with a blue loading fallback. Text and status-bar settings remain untouched; horizontal overflow clipping remains enabled.
- **Verification:** `git diff --check` passed; native-device validation remains needed.
- **Files:** `src/styles/index.css`, `HANDOFF.md`, `docs/HANDOFF.md`, `CHANGELOG.md`
- **Type:** Changed
- **Summary:** Reduced Get started button transparency by 30% by raising the translucent gold fill opacity from 0.38 to 0.49. No other button properties changed.
- **Verification:** `git diff --check` passed; no automated tests run.
- **Files:** `src/styles/index.css`, `HANDOFF.md`, `docs/HANDOFF.md`, `CHANGELOG.md`

## [2026-10-13] Tuesday | UTC+3 | Agent: Codex
- **Type:** Changed
- **Summary:** Blocked history POP navigation while the Welcome screen is active so browser edge-swipe/back gestures keep the user on Welcome. Kept Get Started as the screen's navigation action and corrected its title casing.
- **Verification:** `git diff --check` passed; no automated tests run.
- **Files:** `src/core/auth/WelcomeScreen.tsx`, `HANDOFF.md`, `docs/HANDOFF.md`, `CHANGELOG.md`

## [2026-10-13] Tuesday | UTC+3 | Agent: Codex
- **Type:** Changed
- **Summary:** Added a history POP blocker to both Welcome and Login so back and edge-swipe gestures cannot navigate away from these screens. Explicit links and buttons remain usable.
- **Verification:** `git diff --check` passed; no automated tests run.
- **Files:** `src/core/auth/WelcomeScreen.tsx`, `src/core/auth/SignInScreen.tsx`, `HANDOFF.md`, `docs/HANDOFF.md`, `CHANGELOG.md`

## [2026-10-13] Tuesday | UTC+3 | Agent: Codex
- **Type:** Changed
- **Summary:** Suppressed horizontal touch swipes on Welcome and Login with `touch-action: pan-y` and disabled horizontal overscroll. Vertical movement remains available for Login form scrolling; existing POP blockers guard edge/back navigation.
- **Verification:** `git diff --check` passed; no automated tests run.
- **Files:** `src/core/auth/SignInScreen.tsx`, `src/styles/index.css`, `HANDOFF.md`, `docs/HANDOFF.md`, `CHANGELOG.md`

## [2026-10-13] Tuesday | UTC+3 | Agent: Codex
- **Type:** Fixed
- **Summary:** Extended horizontal gesture suppression to the document and body while Welcome or Login is mounted, addressing the edge-swipe preview that appeared despite the router guard.
- **Verification:** `git diff --check` passed; physical-device verification remains pending.
- **Files:** `src/styles/index.css`, `HANDOFF.md`, `docs/HANDOFF.md`, `CHANGELOG.md`

## [2026-10-13] Tuesday | UTC+3 | Agent: Codex
- **Type:** Changed
- **Summary:** Moved only the Sign Up form content down 10px by increasing the form panel's top padding; artwork, panel position, header, and other screens stay put.
- **Verification:** `git diff --check` passed; no automated tests run.
- **Files:** `src/styles/index.css`, `HANDOFF.md`, `docs/HANDOFF.md`, `CHANGELOG.md`

## [2026-10-13] Tuesday | UTC+3 | Agent: Codex
- **Type:** Reverted
- **Summary:** Restored the user-facing Sign Up screen and route, the Login sign-up link, and its form and social sign-up presentation after reverting account-creation removal.
- **Verification:** `git diff --check` passed; no automated tests run.
- **Files:** `src/app/router.tsx`, `src/core/auth/AuthArtwork.tsx`, `src/core/auth/SignInScreen.tsx`, `src/core/auth/SignUpScreen.tsx`, `src/styles/index.css`, `HANDOFF.md`, `docs/HANDOFF.md`, `CHANGELOG.md`

## [2026-10-13] Tuesday | UTC+3 | Agent: Codex
- **Type:** Changed
- **Summary:** Reduced the Login card's vertical height by 40% by moving only its top edge down; kept the bottom edge and Sign in button position fixed. Card content remains scrollable.
- **Verification:** `git diff --check` passed; no automated tests run.
- **Files:** `src/styles/index.css`, `HANDOFF.md`, `docs/HANDOFF.md`, `CHANGELOG.md`

## [2026-10-13] Tuesday | UTC+3 | Agent: Codex
- **Type:** Changed
- **Summary:** Moved the entire Login card assembly upward by 50px, including the card panel, Sign in button, and Google mark, without changing card height.
- **Verification:** `git diff --check` passed; no automated tests run.
- **Files:** `src/styles/index.css`, `HANDOFF.md`, `docs/HANDOFF.md`, `CHANGELOG.md`

## [2026-10-13] Tuesday | UTC+3 | Agent: Codex
- **Type:** Removed
- **Summary:** Removed the Sign Up page and route, Login sign-up link, and signup-only visual helpers/styles because accounts are provisioned by organization administrators. Login now says access is managed by the organization; email/password sign-in remains.
- **Verification:** `git diff --check` passed; no automated tests run.
- **Files:** `src/app/router.tsx`, `src/core/auth/AuthArtwork.tsx`, `src/core/auth/SignInScreen.tsx`, `src/core/auth/SignUpScreen.tsx`, `src/styles/index.css`, `HANDOFF.md`, `docs/HANDOFF.md`, `CHANGELOG.md`

## [2026-10-13] Tuesday | UTC+3 | Agent: Codex
- **Type:** Fixed
- **Summary:** Raised the Login Sign in button and Google mark above the transformed white card so the card no longer covers them.
- **Verification:** `git diff --check` passed; no automated tests run.
- **Files:** `src/styles/index.css`, `HANDOFF.md`, `docs/HANDOFF.md`, `CHANGELOG.md`

## [2026-10-13] Tuesday | UTC+3 | Agent: Codex
- **Type:** Changed
- **Summary:** Moved the Sign in button and Google mark into the Login card and gave the form its own scroll area, keeping the controls visually attached to the card.
- **Verification:** `git diff --check` passed; no automated tests run.
- **Files:** `src/core/auth/SignInScreen.tsx`, `src/styles/index.css`, `HANDOFF.md`, `docs/HANDOFF.md`, `CHANGELOG.md`

## [2026-10-13] Tuesday | UTC+3 | Agent: Codex
- **Type:** Changed
- **Summary:** Increased the Login card height by 30%, holding its bottom edge and contents in place while raising its top edge.
- **Verification:** `git diff --check` passed; no automated tests run.
- **Files:** `src/styles/index.css`, `HANDOFF.md`, `docs/HANDOFF.md`, `CHANGELOG.md`
