# Staroot Hub - Changelog

All work on this project is logged here, newest first.
Header format: [date HHmmss] Day | UTC+3 | Agent: name
Add entries with: .\scripts\add-changelog.ps1 -Agent "name" -Phase "n" -Type Added -Message "..." -Files "a","b"

<!-- ENTRIES -->

## [2026-10-14 180600] Wednesday | UTC+3 | Agent: Codex
- **Phase:** Render deployment preparation
- **Type:** Added
- **Status:** Done
- **Summary:** Added a same-origin Node server for Render that serves the Vite PWA, handles SPA routes, and dispatches authenticated API paths to the existing TypeScript handlers. Added the npm start command, documented Render setup, and matched the local Vite VAPID public key to the existing server key without recording secrets.
- **Files:**
  - `server.ts`
  - `package.json`
  - `tsconfig.json`
  - `docs/DEPLOYMENT.md`
  - `CHANGELOG.md`
  - `HANDOFF.md`
  - `docs/HANDOFF.md`

## [2026-10-14 175300] Wednesday | UTC+3 | Agent: Codex
- **Phase:** Approvals and Site Progress UI replacement
- **Type:** Changed
- **Status:** Done
- **Summary:** Replaced the legacy Approvals request screens with the supplied Permits workflow as the direct landing screen. Matched Site Progress to the reference’s 480px mobile layout, theme palette, sticky header/menu, project chips, progress ring/tiles, trade chart, grouped sections, look-ahead, photo strip, and slider-driven updates while retaining the offline daily-log/photo queue, reports, and exports.
- **Files:**
  - `src/modules/approvals/components/ApprovalsApp.tsx`
  - `src/modules/approvals/components/ApprovalList.tsx` (removed)
  - `src/modules/approvals/components/ApprovalTimeline.tsx` (removed)
  - `src/modules/approvals/components/RequestDetail.tsx` (removed)
  - `src/modules/approvals/components/RequestForm.tsx` (removed)
  - `src/modules/approvals/components/format.ts` (removed)
  - `src/app/router.tsx`
  - `src/modules/site-progress/components/SiteProgressApp.tsx`
  - `src/modules/site-progress/components/SiteDashboard.tsx`
  - `src/modules/site-progress/components/ContractorGrid.tsx`
  - `src/modules/site-progress/components/ProgressEntry.tsx`
  - `src/modules/site-progress/site-progress.css`
  - `src/core/evidence/PhotoEvidence.tsx`
  - `HANDOFF.md`
  - `docs/HANDOFF.md`
  - `CHANGELOG.md`

## [2026-10-14 174000] Wednesday | UTC+3 | Agent: Codex
- **Phase:** Site Progress workflow UI
- **Type:** Changed
- **Status:** Done
- **Summary:** Reworked the Site Progress dashboard toward the supplied workflow with an overall progress ring, project metrics, expandable trade sections, blocker look-ahead, and recent photo timeline. Progress entry now uses a percentage slider while keeping daily logs and photo evidence in the existing offline queue. Made Permits the default Approvals view so the supplied permits workflow is the landing screen; Requests remains available.
- **Files:**
  - `src/modules/site-progress/components/SiteDashboard.tsx`
  - `src/modules/site-progress/components/ContractorGrid.tsx`
  - `src/modules/site-progress/components/ProgressEntry.tsx`
  - `src/modules/approvals/components/ApprovalsApp.tsx`
  - `HANDOFF.md`
  - `docs/HANDOFF.md`
  - `CHANGELOG.md`

## [2026-10-14 173500] Wednesday | UTC+3 | Agent: Codex
- **Phase:** Approvals permits module
- **Type:** Added
- **Status:** Done
- **Summary:** Added a Permits area alongside the existing Approvals request workflow, including expiry dashboard, permit filters/list, application-stage tracking, expiry calendar, permit detail/edit/create, renewal, and copyable share summary. Permit data currently persists locally in this browser because no permits API is defined.
- **Files:**
  - `src/modules/approvals/components/ApprovalsApp.tsx`
  - `src/modules/approvals/components/PermitManager.tsx`
  - `src/core/auth/accessCode.ts`
  - `HANDOFF.md`
  - `docs/HANDOFF.md`
  - `CHANGELOG.md`

## [2026-10-14 165000] Wednesday | UTC+3 | Agent: Codex
- **Phase:** Light wallpaper and module description typography
- **Type:** Changed
- **Status:** Done
- **Summary:** Added a generated soft ivory and gold wallpaper throughout authenticated light mode, visible behind the header and safe area. Increased all active module descriptions by 50% and expanded the detail area to fit the larger text.
- **Files:**
  - `public/assets/staroot-light-flow.png`
  - `src/styles/index.css`
  - `src/components/RadialHub.tsx`
  - `HANDOFF.md`
  - `docs/HANDOFF.md`
  - `CHANGELOG.md`

## [2026-10-14 164900] Wednesday | UTC+3 | Agent: Codex
- **Phase:** Active module details placement and transition
- **Type:** Changed
- **Status:** Done
- **Summary:** Moved the active details block down 20dp and removed its fade-and-rise animation so content changes in place.
- **Files:**
  - `src/components/RadialHub.tsx`
  - `HANDOFF.md`
  - `docs/HANDOFF.md`
  - `CHANGELOG.md`

## [2026-10-14 164800] Wednesday | UTC+3 | Agent: Codex
- **Phase:** Radial hub segment labels
- **Type:** Changed
- **Status:** Done
- **Summary:** Removed all visible text labels from wheel wedges; kept module names in the active details panel and accessible option names. Other wheel styling and layout remain unchanged.
- **Files:**
  - `src/components/RadialHub.tsx`
  - `HANDOFF.md`
  - `docs/HANDOFF.md`
  - `CHANGELOG.md`

## [2026-10-14 164700] Wednesday | UTC+3 | Agent: Codex
- **Phase:** Active module action button
- **Type:** Changed
- **Status:** Done
- **Summary:** Simplified the action to “Open” plus a chevron, and enlarged only its label text by 20%.
- **Files:**
  - `src/components/RadialHub.tsx`
  - `HANDOFF.md`
  - `docs/HANDOFF.md`
  - `CHANGELOG.md`

## [2026-10-14 164600] Wednesday | UTC+3 | Agent: Codex
- **Phase:** Active module detail typography correction
- **Type:** Changed
- **Status:** Done
- **Summary:** Restored the active module title to its original size; enlarged only the blue-marked description and Open button label text by 20%.
- **Files:**
  - `src/components/RadialHub.tsx`
  - `HANDOFF.md`
  - `docs/HANDOFF.md`
  - `CHANGELOG.md`

## [2026-10-14 164500] Wednesday | UTC+3 | Agent: Codex
- **Phase:** Active module typography
- **Type:** Changed
- **Status:** Done
- **Summary:** Increased the active module title and Open button label text by 20%, keeping the other labels and button dimensions unchanged.
- **Files:**
  - `src/components/RadialHub.tsx`
  - `HANDOFF.md`
  - `docs/HANDOFF.md`
  - `CHANGELOG.md`

## [2026-10-14 164400] Wednesday | UTC+3 | Agent: Codex
- **Phase:** Hub hint and Coming Soon spacing
- **Type:** Changed
- **Status:** Done
- **Summary:** Moved the drag hint and the full Coming Soon section down by 15px; arrow button positions remain unchanged.
- **Files:**
  - `src/components/RadialHub.tsx`
  - `src/modules/hub/components/HubScreen.tsx`
  - `HANDOFF.md`
  - `docs/HANDOFF.md`
  - `CHANGELOG.md`

## [2026-10-14 164300] Wednesday | UTC+3 | Agent: Codex
- **Phase:** Radial hub hint placement
- **Type:** Changed
- **Status:** Done
- **Summary:** Moved only the “Drag around the ring” hint 40px down, keeping the arrow buttons in place.
- **Files:**
  - `src/components/RadialHub.tsx`
  - `HANDOFF.md`
  - `docs/HANDOFF.md`
  - `CHANGELOG.md`

## [2026-10-14 164200] Wednesday | UTC+3 | Agent: Codex
- **Phase:** Radial hub controls placement
- **Type:** Changed
- **Status:** Done
- **Summary:** Moved the arrow and hint row below the marked line on hover-capable fine-pointer devices; touch-first devices keep the existing control spacing.
- **Files:**
  - `src/components/RadialHub.tsx`
  - `HANDOFF.md`
  - `docs/HANDOFF.md`
  - `CHANGELOG.md`

## [2026-10-14 164100] Wednesday | UTC+3 | Agent: Codex
- **Phase:** Coming Soon section placement
- **Type:** Changed
- **Status:** Done
- **Summary:** Moved the full Coming Soon block down by increasing its top spacing to 50px, placing its heading and chips below the marked line.
- **Files:**
  - `src/modules/hub/components/HubScreen.tsx`
  - `HANDOFF.md`
  - `docs/HANDOFF.md`
  - `CHANGELOG.md`

## [2026-10-14 164000] Wednesday | UTC+3 | Agent: Codex
- **Phase:** Radial hub module details placement
- **Type:** Changed
- **Status:** Done
- **Summary:** Moved the active module details down into the green-marked area and widened the text block to match its outline; the wheel and wedge labels are unchanged.
- **Files:**
  - `src/components/RadialHub.tsx`
  - `HANDOFF.md`
  - `docs/HANDOFF.md`
  - `CHANGELOG.md`

## [2026-10-14 163800] Wednesday | UTC+3 | Agent: Codex
- **Phase:** Radial hub placement
- **Type:** Changed
- **Status:** Done
- **Summary:** Shifted the wheel 10px right on mobile and desktop while keeping the text panel in place.
- **Files:**
  - `src/components/RadialHub.tsx`
  - `HANDOFF.md`
  - `docs/HANDOFF.md`
  - `CHANGELOG.md`

## [2026-10-14 163700] Wednesday | UTC+3 | Agent: Codex
- **Phase:** Radial hub icon positioning
- **Type:** Changed
- **Status:** Done
- **Summary:** Shifted only the wedge icons outward by 12dp along their radial direction.
- **Files:**
  - `src/components/RadialHub.tsx`
  - `HANDOFF.md`
  - `docs/HANDOFF.md`
  - `CHANGELOG.md`

## [2026-10-14 163500] Wednesday | UTC+3 | Agent: Codex
- **Phase:** Dark hub wallpaper and wheel detail layout
- **Type:** Changed
- **Status:** Done
- **Summary:** Added the generated flowing graphite wallpaper beneath the translucent black and gold dark-mode gradient with a 1.5px blur. Hid the active wedge label while keeping labels visible on inactive wedges, moved the active module text block down 25 SVG units, and kept Coming Soon 30px below the wheel component.
- **Files:**
  - `public/assets/staroot-dark-flow.png`
  - `src/styles/index.css`
  - `src/components/RadialHub.tsx`
  - `src/modules/hub/components/HubScreen.tsx`
  - `HANDOFF.md`
  - `docs/HANDOFF.md`
  - `CHANGELOG.md`

## [2026-10-14 160300] Wednesday | UTC+3 | Agent: Codex
- **Phase:** Radial wheel label and interaction polish
- **Type:** Changed
- **Status:** Done
- **Summary:** Restored upright labels inside each wedge beneath the icons, wrapped longer labels, returned the center opening to its prior radius, and added 30dp spacing above Coming Soon; retained the left-side module details and recent wheel adjustments.
- **Files:**
  - `src/components/RadialHub.tsx`
  - `src/modules/hub/components/HubScreen.tsx`
  - `HANDOFF.md`
  - `docs/HANDOFF.md`
  - `CHANGELOG.md`

## [2026-10-14 160100] Wednesday | UTC+3 | Agent: Codex
- **Phase:** Hub wheel and Coming Soon sizing
- **Type:** Changed
- **Status:** Done
- **Summary:** Shifted the radial wheel down 20dp and right 16dp total, then enlarged the Coming Soon heading, chips, and icons by 20%.
- **Files:**
  - `src/components/RadialHub.tsx`
  - `src/modules/hub/components/HubScreen.tsx`
  - `HANDOFF.md`
  - `CHANGELOG.md`

## [2026-10-14 160000] Wednesday | UTC+3 | Agent: Codex
- **Phase:** Dark-mode text contrast
- **Type:** Changed
- **Status:** Done
- **Summary:** Changed dark-mode muted and accent text to `#E5E5E5` to reduce contrast and remove the blue tint, while preserving blue accent surfaces and light-mode colors.
- **Files:**
  - `src/styles/index.css`
  - `HANDOFF.md`
  - `CHANGELOG.md`

## [2026-10-14 155300] Wednesday | UTC+3 | Agent: Codex
- **Phase:** Hub profile name casing
- **Type:** Changed
- **Status:** Done
- **Summary:** Applied title-style capitalization to the displayed Hub profile name, preserving spaces.
- **Files:**
  - `src/modules/hub/components/HubScreen.tsx`
  - `HANDOFF.md`
  - `docs/HANDOFF.md`
  - `CHANGELOG.md`

## [2026-10-14 155100] Wednesday | UTC+3 | Agent: Codex
- **Phase:** Hub profile name size
- **Type:** Changed
- **Status:** Done
- **Summary:** Adjusted the Hub profile display name to 27px and retained truncation for narrow screens.
- **Files:**
  - `src/modules/hub/components/HubScreen.tsx`
  - `HANDOFF.md`
  - `docs/HANDOFF.md`
  - `CHANGELOG.md`

## [2026-10-14 154900] Wednesday | UTC+3 | Agent: Codex
- **Phase:** Hub profile name size
- **Type:** Changed
- **Status:** Done
- **Summary:** Doubled the Hub profile display name from 16px to 32px and retained truncation for narrow screens.
- **Files:**
  - `src/modules/hub/components/HubScreen.tsx`
  - `HANDOFF.md`
  - `docs/HANDOFF.md`
  - `CHANGELOG.md`

## [2026-10-14 154700] Wednesday | UTC+3 | Agent: Codex
- **Phase:** Hub profile avatar size
- **Type:** Changed
- **Status:** Done
- **Summary:** Increased the circular profile avatar from 44px to 48px, approximately 10% larger.
- **Files:**
  - `src/modules/hub/components/HubScreen.tsx`
  - `HANDOFF.md`
  - `docs/HANDOFF.md`
  - `CHANGELOG.md`

## [2026-10-14 154500] Wednesday | UTC+3 | Agent: Codex
- **Phase:** Hub header row alignment
- **Type:** Changed
- **Status:** Done
- **Summary:** Returned the profile initials/photo and name to the original vertical position alongside the inbox/menu icons, removing the temporary row offsets while keeping the translucent header layer.
- **Files:**
  - `src/modules/hub/components/HubScreen.tsx`
  - `src/styles/index.css`
  - `HANDOFF.md`
  - `docs/HANDOFF.md`
  - `CHANGELOG.md`

## [2026-10-14 154300] Wednesday | UTC+3 | Agent: Codex
- **Phase:** Header action icon size
- **Type:** Changed
- **Status:** Done
- **Summary:** Increased the Hub inbox and menu/close icons from 20px to 23px (15%) without changing their controls or positions.
- **Files:**
  - `src/modules/hub/components/HubScreen.tsx`
  - `HANDOFF.md`
  - `docs/HANDOFF.md`
  - `CHANGELOG.md`

## [2026-10-14 154100] Wednesday | UTC+3 | Agent: Codex
- **Phase:** Header action icon position
- **Type:** Changed
- **Status:** Done
- **Summary:** Returned the inbox and menu icons to their original vertical position while keeping the profile row raised and preserving the translucent header layer.
- **Files:**
  - `src/modules/hub/components/HubScreen.tsx`
  - `src/styles/index.css`
  - `HANDOFF.md`
  - `docs/HANDOFF.md`
  - `CHANGELOG.md`

## [2026-10-14 153900] Wednesday | UTC+3 | Agent: Codex
- **Phase:** Hub header glass layering
- **Type:** Changed
- **Status:** Done
- **Summary:** Added a subtle translucent blurred backdrop behind the fixed header and explicitly layered header content above it so the icons and text remain sharp.
- **Files:**
  - `src/modules/hub/components/HubScreen.tsx`
  - `src/styles/index.css`
  - `HANDOFF.md`
  - `docs/HANDOFF.md`
  - `CHANGELOG.md`

## [2026-10-14 153700] Wednesday | UTC+3 | Agent: Codex
- **Phase:** Header item rendering clarity
- **Type:** Fixed
- **Status:** Done
- **Summary:** Replaced the translated Hub header row with a relative top offset to retain its position while avoiding mobile compositing that can blur text and icons.
- **Files:**
  - `src/styles/index.css`
  - `HANDOFF.md`
  - `docs/HANDOFF.md`
  - `CHANGELOG.md`

## [2026-10-14 153500] Wednesday | UTC+3 | Agent: Codex
- **Phase:** Hub header item position
- **Type:** Changed
- **Status:** Done
- **Summary:** Moved the Hub avatar, name, inbox, and menu row upward 25px to the bottom of the status-bar safe area without changing the header band or page content spacing.
- **Files:**
  - `src/modules/hub/components/HubScreen.tsx`
  - `src/styles/index.css`
  - `HANDOFF.md`
  - `docs/HANDOFF.md`
  - `CHANGELOG.md`

## [2026-10-14 153200] Wednesday | UTC+3 | Agent: Codex
- **Phase:** Status-bar gradient continuity
- **Type:** Changed
- **Status:** Done
- **Summary:** Extended the authenticated gold-to-black gradient behind the translucent iOS status bar and through the fixed Hub header for a continuous transition.
- **Files:**
  - `src/modules/hub/components/HubScreen.tsx`
  - `src/styles/index.css`
  - `HANDOFF.md`
  - `docs/HANDOFF.md`
  - `CHANGELOG.md`

## [2026-10-14 153000] Wednesday | UTC+3 | Agent: Codex
- **Phase:** Hub header gradient
- **Type:** Changed
- **Status:** Done
- **Summary:** Applied a restrained gold-on-black gradient to the fixed Hub header below the safe-area inset, preserving a solid-black iOS status-bar safe area.
- **Files:**
  - `src/modules/hub/components/HubScreen.tsx`
  - `src/styles/index.css`
  - `HANDOFF.md`
  - `docs/HANDOFF.md`
  - `CHANGELOG.md`

## [2026-10-14 152700] Wednesday | UTC+3 | Agent: Codex
- **Phase:** Authenticated dark gradient
- **Type:** Changed
- **Status:** Done
- **Summary:** Updated the shared post-login dark backdrop to use a stronger Staroot gold glow fading into pure black, while preserving the solid-black Hub safe-area/header band.
- **Files:**
  - `src/styles/index.css`
  - `HANDOFF.md`
  - `docs/HANDOFF.md`
  - `CHANGELOG.md`

## [2026-10-14 152500] Wednesday | UTC+3 | Agent: Codex
- **Phase:** Safe-area troubleshooting note
- **Type:** Documentation
- **Status:** Done
- **Summary:** Recorded the iOS translucent-status-bar cause of the gray/blur-like strip above the authenticated header and the working dark-mode fix: black document background while authenticated, with the shared gradient below the header.
- **Files:**
  - `HANDOFF.md`
  - `docs/HANDOFF.md`
  - `CHANGELOG.md`

## [2026-10-14 152400] Wednesday | UTC+3 | Agent: Codex
- **Phase:** Hub safe-area header
- **Type:** Changed
- **Status:** Done
- **Summary:** Made the fixed Home header solid black through its existing height and the dark-mode document background black behind the translucent iOS status bar. The safe area no longer reveals the gray gradient; the shared black-and-gold gradient remains below the header.
- **Files:**
  - `src/modules/hub/components/HubScreen.tsx`
  - `src/styles/index.css`
  - `HANDOFF.md`
  - `docs/HANDOFF.md`
  - `CHANGELOG.md`

## [2026-10-14 150924] Wednesday | UTC+3 | Agent: Codex
- **Phase:** Radial icon alignment
- **Type:** Changed
- **Status:** Done
- **Summary:** Tilted the radial wheel icons an additional 10 degrees left, for a total 25-degree counterclockwise tilt around each icon's own center; icon centers remain aligned with their wedges.
- **Files:**
  - `src/components/RadialHub.tsx`
  - `HANDOFF.md`
  - `docs/HANDOFF.md`
  - `CHANGELOG.md`


## [2026-10-14 150137] Wednesday | UTC+3 | Agent: Codex
- **Phase:** Hub visual refresh
- **Type:** Changed
- **Status:** Done
- **Summary:** Removed the Hub photo wallpaper and asset, replaced it with a gold-accented dark gradient, made the fixed header transparent, removed the search bar, and made radial icons rotate with their wedges without distorting their shape.
- **Files:**
  - `src/modules/hub/components/HubScreen.tsx`
  - `src/components/RadialHub.tsx`
  - `src/styles/index.css`
  - `public/assets/hub-rooftop-wallpaper.png`
  - `HANDOFF.md`
  - `docs/HANDOFF.md`
  - `CHANGELOG.md`


## [2026-10-14 144158] Wednesday | UTC+3 | Agent: Codex
- **Phase:** Hub light wallpaper
- **Type:** Removed
- **Status:** Done
- **Summary:** Removed the monochrome network-globe light-mode wallpaper and its CSS override after visual review; deleted the added asset. Light mode again uses the existing rooftop wallpaper.
- **Files:**
  - `src/styles/index.css`
  - `public/assets/hub-light-network-wallpaper.png`
  - `HANDOFF.md`
  - `docs/HANDOFF.md`
  - `CHANGELOG.md`


## [2026-10-14 144001] Wednesday | UTC+3 | Agent: Codex
- **Phase:** Hub light wallpaper
- **Type:** Changed
- **Status:** Done
- **Summary:** Added the supplied monochrome network-globe graphic as the light-mode Hub wallpaper, using a centered cover crop. Dark mode continues to use its rooftop wallpaper; the obsolete stone asset was already removed. No layout or component styling changed.
- **Files:**
  - `public/assets/hub-light-network-wallpaper.png`
  - `src/styles/index.css`
  - `HANDOFF.md`
  - `docs/HANDOFF.md`
  - `CHANGELOG.md`


## [2026-10-14 142818] Wednesday | UTC+3 | Agent: Codex
- **Phase:** Auth image alignment
- **Type:** Fixed
- **Status:** Done
- **Summary:** Unified the mobile Welcome and Login photo layers to use identical fixed viewport bounds (inset: -40px) and the shared crop, preventing the background from shifting when switching screens. Text, card, and status-bar positioning remain unchanged.
- **Files:**
  - `src/styles/index.css`
  - `HANDOFF.md`
  - `docs/HANDOFF.md`
  - `CHANGELOG.md`


## [2026-10-14 120528] Wednesday | UTC+3 | Agent: Codex
- **Phase:** Hub refresh
- **Type:** Changed
- **Status:** Done
- **Summary:** Added the fixed, subtly blurred stone wallpaper and charcoal dark palette; fixed the safe-area header above scrolling Hub content. RadialHub now shows labels only in the active module panel, uses enlarged but reduced sizing with a 20px left inset and 28px rightward adjustment, and has wider visible gaps between segments. Preserved center-slot alignment and drag coordinate mapping.
- **Files:**
  - `src/components/RadialHub.tsx`
  - `src/modules/hub/components/HubScreen.tsx`
  - `src/styles/index.css`
  - `src/core/theme/themes.ts`
  - `index.html`
  - `public/manifest.webmanifest`
  - `public/favicon.svg`
  - `public/assets/hub-stone-wallpaper.png`
  - `HANDOFF.md`
  - `docs/HANDOFF.md`
  - `CHANGELOG.md`


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

## [2026-10-13] Tuesday | UTC+3 | Agent: Codex
- **Type:** Fixed
- **Summary:** Matched the mobile Login wrapper and phone minimum heights to `100vh`, removing the inherited 600px phone minimum as a source of a viewport gap. Kept the Login artwork extended 48px below the viewport. The status-bar edge, card, text, controls, and scroll/swipe blocking rules are unchanged.
- **Verification:** `git diff --check` passed; Android device validation was unavailable because `adb` is not installed in this shell; no automated tests run.
- **Files:** `src/styles/index.css`, `HANDOFF.md`, `docs/HANDOFF.md`, `CHANGELOG.md`

## [2026-10-13] Tuesday | UTC+3 | Agent: Codex
- **Type:** Changed
- **Summary:** Restored vertical scrolling inside the Login card and removed page-level touch/overflow locks. Removed the Google mark and placed the Sign in button in the card's scrolling content below the account options.
- **Verification:** `git diff --check` passed; no automated tests run.
- **Files:** `src/core/auth/SignInScreen.tsx`, `src/styles/index.css`, `HANDOFF.md`, `docs/HANDOFF.md`, `CHANGELOG.md`

## [2026-10-13] Tuesday | UTC+3 | Agent: Codex
- **Type:** Changed
- **Summary:** Changed only the Login card surface to translucent white with a 14px backdrop blur and a subtle glass edge, revealing the existing background through the card.
- **Verification:** `git diff --check` passed; no automated tests run.
- **Files:** `src/styles/index.css`, `HANDOFF.md`, `docs/HANDOFF.md`, `CHANGELOG.md`

## [2026-10-13] Tuesday | UTC+3 | Agent: Codex
- **Type:** Changed
- **Summary:** Replaced the Login card's simple translucent surface with its scoped layered glass treatment: tinted backdrop blur, specular inner edge, and layered shadow. Preserved the card's existing layout and kept the treatment self-contained without its remote noise image.
- **Verification:** `git diff --check` passed; no automated tests run.
- **Files:** `src/core/auth/SignInScreen.tsx`, `src/styles/index.css`, `HANDOFF.md`, `docs/HANDOFF.md`, `CHANGELOG.md`

## [2026-10-13] Tuesday | UTC+3 | Agent: Codex
- **Type:** Changed
- **Summary:** Applied a lighter, translucent glass surface with a subtle blur and inner edge to the Login email and password fields. Input text, labels, and field layout are unchanged.
- **Verification:** `git diff --check` passed; no automated tests run.
- **Files:** `src/core/auth/SignInScreen.tsx`, `src/styles/index.css`, `HANDOFF.md`, `docs/HANDOFF.md`, `CHANGELOG.md`

## [2026-10-13] Tuesday | UTC+3 | Agent: Codex
- **Type:** Changed
- **Summary:** Set the Login heading, email/password labels and input text, placeholders, and Forgot password control to white. Remember me and the organization note are unchanged.
- **Verification:** `git diff --check` passed; no automated tests run.
- **Files:** `src/styles/index.css`, `HANDOFF.md`, `docs/HANDOFF.md`, `CHANGELOG.md`

## [2026-10-13] Tuesday | UTC+3 | Agent: Codex
- **Type:** Changed
- **Summary:** Changed the Login organization-managed access note to white.
- **Verification:** `git diff --check` passed; no automated tests run.
- **Files:** `src/styles/index.css`, `HANDOFF.md`, `docs/HANDOFF.md`, `CHANGELOG.md`

## [2026-10-13] Tuesday | UTC+3 | Agent: Codex
- **Type:** Changed
- **Summary:** Restyled Login email and password inputs as horizontal glass rows with envelope/lock icons, and changed the remember option to “Keep me signed in” with the gold theme accent. Forgot password remains in place.
- **Verification:** `git diff --check` passed; no automated tests run.
- **Files:** `src/core/auth/SignInScreen.tsx`, `src/styles/index.css`, `HANDOFF.md`, `docs/HANDOFF.md`, `CHANGELOG.md`

## [2026-10-13] Tuesday | UTC+3 | Agent: Codex
- **Type:** Changed
- **Summary:** Increased the Login organization-access note font size by 25%, from 0.76rem to 0.95rem, without changing its color or placement.
- **Verification:** `git diff --check` passed; no automated tests run.
- **Files:** `src/styles/index.css`, `HANDOFF.md`, `docs/HANDOFF.md`, `CHANGELOG.md`

## [2026-10-13] Tuesday | UTC+3 | Agent: Codex
- **Type:** Changed
- **Summary:** Made the Login “Keep me signed in” checkbox circular and aligned it with the email/password icons; inset the options row to align Forgot password with the fields.
- **Verification:** `git diff --check` passed; no automated tests run.
- **Files:** `src/styles/index.css`, `HANDOFF.md`, `docs/HANDOFF.md`, `CHANGELOG.md`

## [2026-10-13] Tuesday | UTC+3 | Agent: Codex
- **Type:** Changed
- **Summary:** Set the Login “Keep me signed in” and “Forgot password?” text to 0.9rem after adjusting the oversized option text.
- **Verification:** `git diff --check` passed; no automated tests run.
- **Files:** `src/styles/index.css`, `HANDOFF.md`, `docs/HANDOFF.md`, `CHANGELOG.md`

## [2026-10-13] Tuesday | UTC+3 | Agent: Codex
- **Type:** Changed
- **Summary:** Increased the spacing below the Login organization-access note by 10px, bringing its gap above the fields to 26px.
- **Verification:** `git diff --check` passed; no automated tests run.
- **Files:** `src/styles/index.css`, `HANDOFF.md`, `docs/HANDOFF.md`, `CHANGELOG.md`

## [2026-10-13] Tuesday | UTC+3 | Agent: Codex
- **Type:** Changed
- **Summary:** Increased the Login email/password field gap by 8px to 24px and the envelope/lock icon dimensions by 25% to 25px.
- **Verification:** `git diff --check` passed; no automated tests run.
- **Files:** `src/styles/index.css`, `HANDOFF.md`, `docs/HANDOFF.md`, `CHANGELOG.md`

## [2026-10-13] Tuesday | UTC+3 | Agent: Codex
- **Type:** Changed
- **Summary:** Raised the Welcome Get Started button by 15px by increasing its bottom offset; button size and styling are unchanged.
- **Verification:** `git diff --check` passed; no automated tests run.
- **Files:** `src/styles/index.css`, `HANDOFF.md`, `docs/HANDOFF.md`, `CHANGELOG.md`

## [2026-10-13] Tuesday | UTC+3 | Agent: Codex
- **Type:** Changed
- **Summary:** Added 24px between the Login options row and Sign in button by increasing its top margin; the button moves down accordingly.
- **Verification:** `git diff --check` passed; no automated tests run.
- **Files:** `src/styles/index.css`, `HANDOFF.md`, `docs/HANDOFF.md`, `CHANGELOG.md`

### Login Staroot mark — 13 October 2026

- Added the supplied white Staroot SVG as `public/assets/staroot-logo-white.svg` and extracted its star plus gold strike-through into `public/assets/staroot-mark-white.svg`.
- Placed the extracted mark centered on the Login screen, 55px below the top safe-area inset. It is independent of the card and page copy.
- **Verification:** `git diff --check` passed; no automated tests run.
### Hub header redesign — 14 October 2026

- Reworked the fixed home header into a two-row mobile layout: a circular initials avatar and current user name on the left, Inbox and menu actions on the right, and a module search field below.
- Moved theme switching and sign-out into the menu, retaining the existing unsynced-work confirmation and queue-clearing behavior. The Inbox icon links to Notifications.
- Search matches accessible module names and descriptions, offers matching module links, and reports no matches. Increased the header spacer so the page content starts below the expanded fixed header.
- The current profile schema has no photo URL, so the avatar uses initials from the authenticated user’s display name.
- **Verification:** `git diff --check` passed; no automated tests run.

## [2026-10-14] Wednesday | UTC+3 | Agent: Codex
- **Type:** Changed
- **Summary:** Wrapped all authenticated routes in a shared full-viewport backdrop. Dark mode uses a black-to-charcoal gradient with a subtle #e8c374 glow; Welcome and Login are excluded. Removed Hub-only gold surface overrides and kept the backdrop free of blur filters.
- **Verification:** `git diff --check` passed; no automated tests run.
- **Files:** `src/core/auth/RequireAuth.tsx`, `src/styles/index.css`, `HANDOFF.md`, `docs/HANDOFF.md`, `CHANGELOG.md`
