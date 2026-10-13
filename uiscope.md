# Staroot Hub UI Scope

## Purpose

Define the user-facing screens and interaction patterns that the Staroot Hub UI work covers. This scope describes the current product and separates shipped interfaces from planned or deferred work; a module appearing in a roadmap or data model does not mean its screen is implemented.

## Product and users

Staroot Hub is an internal, installable, offline-first PWA for Staroot Real Estate. Staff use it on phones at offices and construction sites, sometimes with unreliable connectivity. The UI supports five role groups from the handoff: Executive, Manager, Sales & Marketing, Operations & Front Office, and Site Engineer / Field Staff. Server-side permissions remain authoritative; hiding a screen or action in the UI is not an access control.

## UI principles

- Mobile-first, responsive layouts with one-handed use and large touch targets.
- Support the official blue-palette dark theme and light theme.
- Use clear labels and statuses for online/offline, queued, syncing, failed, and needs-review work.
- Give each screen loading, empty, error, retry, and success feedback where applicable.
- Keep offline-created records visible with their sync state; explain when a feature needs connectivity.
- Capture evidence with the in-app camera only. Show permission errors and unverified timestamp/GPS evidence clearly.
- Maintain keyboard access, visible focus, semantic headings/labels, ARIA state where needed, and reduced-motion support.
- Keep role-specific actions understandable while leaving access enforcement to the API.

## Current screen inventory

| Area | UI scope | Current implementation status |
|---|---|---|
| Welcome / sign-up / sign-in / splash | Blue abstract welcome panel, static sign-up and sign-in forms, and a static brand splash preview | Visual-only screens restored from the supplied template. Links switch between preview routes; form, forgot-password, social, and splash timing/auth actions are not wired. |
| Hub / app shell | Greeting and role, permission-filtered module cards, approval and unsynced badges, offline notice, retry, theme toggle, sign-out warning, install/update prompts, push pre-prompt | Implemented. This is the main navigation and global status surface. |
| Approvals and Inbox | Approval tabs, request form/detail/timeline, decision actions, attachments, queued request visibility, notification list/read state | Existing UI is implemented. **Phase 3 is on hold by user direction; do not extend or redesign it as part of the current UI pass.** |
| Site Progress (Phase 5) | Project selector, contractor progress, recent daily logs, add/edit log, camera evidence, report builder, reports archive/viewer, PDF/DOCX export | Implemented. First UI review priority, following the user’s phase order. |
| Inventory & Logistics (Phase 6) | Stock and reorder indicators, admin-only catalogue entry, movement wizard (dispatch/receipt/return/adjustment), photo evidence, custody, searchable movement history, dispatch summary | Implemented. Second UI review priority. |
| Administration | Role, project, contractor, and approval-rule management | **Not implemented:** registry route currently renders a placeholder and `src/modules/admin` contains TODO stubs. Do not present these tools as shipped. Scope/priority requires a separate decision. |
| CRM (Phase 4) | Leads, pipeline, lead profile, activity timeline, reports | **Coming Soon only.** CRM is explicitly deferred; do not code or redesign it. Its route is a placeholder. |
| Other future modules | Leasing, Maintenance, Finance, Analytics | Non-interactive Coming Soon cards only. No feature screens are included. |

## Cross-cutting UI behavior

- **Navigation:** authenticated users land on the Hub. Each visible module is permission-filtered; module screens provide a clear route back to the Hub.
- **Offline and sync:** surface connection status and the user’s pending work; keep queued records visible; provide retry or review actions when supported. Never imply that a queued write has been accepted by the server.
- **Forms:** use explicit labels, inline validation, sensible input types, clear cancel/save actions, and a success state that explains whether the data is local or server-synced.
- **Lists and detail:** show useful empty/loading/error states, status and date context, and search where the module supports it.
- **Evidence:** explain camera/location access before capture and label evidence as verified or unverified based on server results.
- **PWA:** expose install and update prompts without interrupting active work; preserve queued records during an update.

## UI work sequence

1. Establish consistent visual hierarchy, spacing, typography, navigation, and shared states using the existing theme and UI primitives.
2. Review and refine **Site Progress** screens and workflows.
3. Review and refine **Inventory & Logistics** screens and workflows.
4. Review the **Phase 7** cross-cutting experience: responsive behavior, accessibility, offline/sync visibility, PWA install/update, and error recovery.
5. Keep Phase 3 frozen and CRM deferred. Treat Administration as a placeholder until it is explicitly prioritized.

## Out of scope for this UI pass

- Reopening Phase 3 work, including approval/attachment/push UI changes.
- CRM implementation or redesign; CRM remains Coming Soon.
- Building Leasing, Maintenance, Finance, or Analytics.
- Claiming the Admin management screens are available before their implementation.
- Changing server authorization, business rules, schema, or deployment configuration as a UI-only task.

## Source of truth and known limits

This scope was derived from the handoff’s product requirements and user phase directions, `docs/ARCHITECTURE.md`, `src/app/router.tsx`, `src/modules/hub/registry.ts`, and the current module screens. The current router and source files determine what is actually rendered; older phase-status prose in the append-only handoff may describe earlier states. Authenticated browser/device validation remains pending, so this scope is not a claim that every workflow has passed runtime QA.
 
 #update 1 from Grok AI
 # Staroot Hub UI Scope

## Purpose

Define the user-facing screens and interaction patterns that the Staroot Hub UI work covers. This scope describes the current product and separates shipped interfaces from planned or deferred work; a module appearing in a roadmap or data model does not mean its screen is implemented.

This document is the single source of truth for UI decisions, visual system, and current priorities.

---

## Product and users

Staroot Hub is an internal, installable, offline-first PWA for Staroot Real Estate. Staff use it on phones at offices and construction sites, sometimes with unreliable connectivity. The UI supports five role groups from the handoff: Executive, Manager, Sales & Marketing, Operations & Front Office, and Site Engineer / Field Staff. Server-side permissions remain authoritative; hiding a screen or action in the UI is not an access control.

---

## UI principles

- Mobile-first, responsive layouts with one-handed use and large touch targets (minimum 44×44 px).
- Full support for **Dark mode** and **Light mode** using the official color palette below.
- Use clear labels and statuses for online / offline / queued / syncing / failed / needs-review work.
- Give each screen loading, empty, error, retry, and success feedback where applicable.
- Keep offline-created records visible with their sync state; explain when a feature needs connectivity.
- Capture evidence with the in-app camera only. Show permission errors and unverified timestamp/GPS evidence clearly.
- Maintain keyboard access, visible focus, semantic headings/labels, ARIA state where needed, and reduced-motion support.
- Keep role-specific actions understandable while leaving access enforcement to the API.

---

## Official Color Palette & Usage Rules

| Hex       | Name              | Role                                      |
|-----------|-------------------|-------------------------------------------|
| `#011025` | Deep Navy         | Dark mode background; strongest text in light mode |
| `#052659` | Dark Blue         | Primary accent in light mode; elevated dark surfaces |
| `#5482B4` | Medium Blue       | Primary accent in dark mode; icons, links, active states |
| `#7EA0C5` | Soft Blue         | Secondary accent, secondary text, hover states |
| `#C2E8FF` | Pale Blue         | Very subtle light-mode backgrounds only |

### Critical usage rules
- Keep backgrounds and large surfaces neutral: near-black in dark mode and white in light mode.
- Restrict blue to accents, icons, links, and status indicators. Do not give different blue shades to every card or section.
- Keep success green, warning amber, and error red independent from the blue palette.
- Both dark and light modes are mandatory.

### Light Mode Tokens
- Background and large surfaces: neutral white (`#FFFFFF`) with neutral near-white secondary surfaces.
- Primary accent: `#052659`; strongest text: `#011025`.
- `#C2E8FF` is reserved for very subtle tinted backgrounds only.

### Dark Mode Tokens
- Background: `#011025`; regular surfaces: neutral near-black.
- Primary accent: `#5482B4`; secondary text and hover: `#7EA0C5`.
- Use `#052659` only for selected elevated surfaces, not as the default card color.
- Primary text uses a neutral near-white for readability.

Gold is no longer used as the primary accent. The blue palette above is the single source of brand color.

### Safe Areas, Status Bar & Platform Insets

The mobile-first installable PWA must keep content clear of status bars, cutouts, home indicators, and navigation bars on iOS and Android. `index.html` must use `width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover` so the screen behaves like an app and does not zoom during touch gestures. Keep form controls at least 16px to avoid iOS focus zoom. Top content in module and nested screens must begin at least 25px beyond the top safe-area inset; use the shared `.pt-safe` helper, which adds 25px after the system inset (and keeps at least 16px padding on devices without an inset). Apply `env(safe-area-inset-top/bottom/left/right)` to headers, fixed actions, scroll endings, modals, and interactive content near screen edges. Theme color follows the active theme; dark mode uses `#011025`, light mode uses neutral white. Device-specific notch, navigation, and landscape validation remains a runtime checklist item.

---

## Design System Foundations

### Typography
- Page title: 20–22 px / semibold
- Section title: 16–17 px / semibold
- Body: 15 px / normal / relaxed
- Label / caption: 12–13 px / medium
- Status pill: 11–12 px / semibold / uppercase tracking-wider
- Button: 14–15 px / medium

### Spacing & Layout
- Base unit: 4 px
- Screen padding: 16–20 px
- Card padding: 16–20 px
- Section gaps: 20–24 px
- Border radius: Cards 20–24 px, pills/buttons full or 12–14 px, inputs 12 px
- Minimum touch target: 44 × 44 px

### Core Shared Components
- **StatusPill** — online, offline, queued, syncing, failed, needs-review, success
- **OfflineBanner** — persistent when relevant, with retry action
- **ModuleCard** — used on Hub (icon, title, description, status badge)
- **Button** — primary, secondary, destructive, loading, disabled
- **Form primitives** — labeled inputs, validation, cancel/save with local vs synced feedback
- **Empty / Loading / Error states** — required on every major screen
- **Evidence capture** — camera + verified/unverified labeling

### Navigation & Shell
- Authenticated users land on the Hub.
- Hub shows greeting + role, permission-filtered module cards, approval/unsynced badges, offline notice, theme toggle, sign-out confirmation, install/update prompts.
- Every module screen provides a clear route back to the Hub.
- Theme toggle is always available in the shell.

---

## Current Screen Inventory

| Area                            | UI scope                                                                                                                                                                               | Current implementation status                                                                                                                                                                        |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sign-in                         | Company email/password sign-in, busy and error states, account-provisioning guidance                                                                                                   | Implemented. No self-sign-up or password-reset screen is in scope today.                                                                                                                             |
| Hub / app shell                 | Greeting and role, permission-filtered module cards, approval and unsynced badges, offline notice, retry, theme toggle, sign-out warning, install/update prompts, push pre-prompt      | Implemented. This is the main navigation and global status surface.                                                                                                                                  |
| Approvals and Inbox             | Status tabs, request form/detail/timeline, decision actions, attachments, queued request visibility, notification list/read state                                                    | Existing UI is implemented. **Phase 3 is on hold by user direction; do not extend or redesign it as part of the current UI pass.**                                                                   |
| Site Progress (Phase 5)         | Project selector, contractor progress, recent daily logs, add/edit log, camera evidence, report builder, reports archive/viewer, PDF/DOCX export                                       | Implemented. **First UI review priority.**                                                                                                                                                           |
| Inventory & Logistics (Phase 6) | Stock and reorder indicators, admin-only catalogue entry, movement wizard (dispatch/receipt/return/adjustment), photo evidence, custody, searchable movement history, dispatch summary | Implemented. **Second UI review priority.**                                                                                                                                                          |
| Administration                  | Role, project, contractor, and approval-rule management                                                                                                                                | **Not implemented:** registry route currently renders a placeholder and `src/modules/admin` contains TODO stubs. Do not present these tools as shipped. Scope/priority requires a separate decision. |
| CRM (Phase 4)                   | Leads, pipeline, lead profile, activity timeline, reports                                                                                                                              | **Coming Soon only.** CRM is explicitly deferred; do not code or redesign it. Its route is a placeholder.                                                                                            |
| Other future modules            | Leasing, Maintenance, Finance, Analytics                                                                                                                                               | Non-interactive Coming Soon cards only. No feature screens are included.                                                                                                                             |

---

## Cross-cutting UI behavior

- **Navigation:** authenticated users land on the Hub. Each visible module is permission-filtered; module screens provide a clear route back to the Hub.
- **Offline and sync:** surface connection status and the user’s pending work; keep queued records visible; provide retry or review actions when supported. Never imply that a queued write has been accepted by the server.
- **Forms:** use explicit labels, inline validation, sensible input types, clear cancel/save actions, and a success state that explains whether the data is local or server-synced.
- **Lists and detail:** show useful empty/loading/error states, status and date context, and search where the module supports it.
- **Evidence:** explain camera/location access before capture and label evidence as verified or unverified based on server results.
- **PWA:** expose install and update prompts without interrupting active work; preserve queued records during an update.
- **Theme:** every screen must correctly support both Dark and Light modes using the official palette.

---

## UI work sequence

1. Establish consistent visual hierarchy, spacing, typography, navigation, safe-area handling, and shared states using the design system defined above.
2. Review and refine **Site Progress** screens and workflows.
3. Review and refine **Inventory & Logistics** screens and workflows.
4. Review the **Phase 7** cross-cutting experience: responsive behavior, accessibility, offline/sync visibility, PWA install/update, error recovery, and safe-area/status-bar compliance.
5. Keep Phase 3 frozen and CRM deferred. Treat Administration as a placeholder until it is explicitly prioritized.

---

## Out of scope for this UI pass

- Reopening Phase 3 work, including approval/attachment/push UI changes.
- CRM implementation or redesign; CRM remains Coming Soon.
- Building Leasing, Maintenance, Finance, or Analytics.
- Claiming the Admin management screens are available before their implementation.
- Changing server authorization, business rules, schema, or deployment configuration as a UI-only task.
- Introducing any accent color outside the official five-color blue palette.

---

## Source of truth and known limits

This scope was derived from the handoff’s product requirements and user phase directions, `docs/ARCHITECTURE.md`, `src/app/router.tsx`, `src/modules/hub/registry.ts`, the current module screens, and the agreed design system (color palette, tokens, components, and dark/light mode).

The current router and source files determine what is actually rendered; older phase-status prose in the append-only handoff may describe earlier states. Authenticated browser/device validation remains pending, so this scope is not a claim that every workflow has passed runtime QA.

#update 2 from grok ai
Here’s the required addition to the UI Scope.  
Add this new section under **Design System Foundations** (or as its own top-level section).

---

### Safe Areas, Status Bar & Platform Insets

Staroot Hub is a mobile-first installable PWA. All screens **must** respect the system safe areas on both iOS and Android so content is never obscured by the status bar, notch, Dynamic Island, home indicator, or Android navigation bar.

#### 1. Required Viewport Meta

```html
<meta 
  name="viewport" 
  content="width=device-width, initial-scale=1, viewport-fit=cover"
/>
```

`viewport-fit=cover` is mandatory so that `env(safe-area-inset-*)` values are available.
Disable page scaling so the installed app keeps a stable app-like viewport; retain `viewport-fit=cover` for safe-area support.

#### 2. CSS Environment Variables (use everywhere)

| Variable                      | Purpose                              |
|-------------------------------|--------------------------------------|
| `env(safe-area-inset-top)`    | Status bar + notch / Dynamic Island  |
| `env(safe-area-inset-bottom)` | Home indicator / Android nav bar     |
| `env(safe-area-inset-left)`   | Landscape / foldable cutouts         |
| `env(safe-area-inset-right)`  | Landscape / foldable cutouts         |

#### 3. Practical Rules

- **App shell / Hub header**  
  Always apply top safe-area padding:
  ```css
  padding-top: max(16px, calc(env(safe-area-inset-top, 0px) + 25px));
  ```

- **Fixed bottom bars, FABs, or action rows**  
  Always apply bottom safe-area padding:
  ```css
  padding-bottom: max(16px, env(safe-area-inset-bottom));
  ```

- **Full-bleed backgrounds** (cards that go edge-to-edge) may ignore horizontal insets, but **text, icons, and interactive elements** must never sit under the system UI.

- **Scrollable content** should have enough bottom padding so the last item is not hidden behind the home indicator.

- **Modals / bottom sheets** must also respect `safe-area-inset-bottom`.

#### 4. Status Bar Styling

| Mode   | Status bar style          | Theme color (meta) | Notes                                      |
|--------|---------------------------|--------------------|--------------------------------------------|
| Dark   | `black-translucent` or light content | `#011025`         | Light text/icons on dark background        |
| Light  | `default` (dark content)  | `#FFFFFF` | Dark text/icons on neutral light background |

Use the following meta tags (update dynamically on theme change if possible):

```html
<meta name="theme-color" content="#011025" media="(prefers-color-scheme: dark)">
<meta name="theme-color" content="#FFFFFF" media="(prefers-color-scheme: light)">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
```

#### 5. Implementation Checklist (every screen)

- [ ] Top header respects `safe-area-inset-top`
- [ ] Bottom actions / tab bar / FABs respect `safe-area-inset-bottom`
- [ ] No interactive element is closer than 8 px to any safe-area edge
- [ ] Status bar color matches current theme
- [ ] Tested on:
  - iPhone with notch / Dynamic Island
  - iPhone SE (no notch)
  - Android with gesture navigation
  - Android with 3-button navigation
  - Landscape orientation

#### 6. Tailwind / Utility Helpers (recommended)

```css
/* globals.css or Tailwind layer */
.pt-safe {
  padding-top: max(1rem, calc(env(safe-area-inset-top, 0px) + 25px));
}
.pb-safe {
  padding-bottom: max(1rem, env(safe-area-inset-bottom));
}
.px-safe {
  padding-left: max(1rem, env(safe-area-inset-left));
  padding-right: max(1rem, env(safe-area-inset-right));
}
.min-h-screen-safe {
  min-height: calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom));
}
```

---

### Updated UI Work Sequence (minor addition)

1. Establish consistent visual hierarchy, spacing, typography, navigation, **safe-area handling**, and shared states using the design system.
2. Review and refine **Site Progress** screens and workflows (including safe areas).
3. Review and refine **Inventory & Logistics** screens and workflows (including safe areas).
4. Review the **Phase 7** cross-cutting experience: responsive behavior, accessibility, offline/sync visibility, PWA install/update, error recovery, **and full safe-area / status-bar compliance**.
5. Keep Phase 3 frozen and CRM deferred. Treat Administration as a placeholder until it is explicitly prioritized.

---

This section is now part of the official UI Scope.  
All future screens and components must comply with these safe-area and status-bar rules.

#grok ui update again section only implement
## Official Color Palette & Usage Rules (current)

| Hex       | Name         | Allowed Usage                                      |
|-----------|--------------|----------------------------------------------------|
| `#011025` | Deep Navy    | Dark mode background, strongest text (light mode)  |
| `#052659` | Dark Blue    | Primary accent (light mode), elevated dark surfaces|
| `#5482B4` | Medium Blue  | Primary accent (dark mode), icons, links, active   |
| `#7EA0C5` | Soft Blue    | Secondary accent, secondary text, hover            |
| `#C2E8FF` | Pale Blue    | Very subtle light-mode backgrounds only            |

### Critical Rules
- Backgrounds and large surfaces must stay neutral (near-black or white).
- Blue is restricted to accents, icons, links, and status indicators.
- Never apply different blue shades to every card or section.
- Status colors (success green, warning amber, error red) remain independent for clarity.
- Both Dark and Light modes are mandatory and must follow the token mapping above.

This current palette section supersedes earlier palette tokens in the appended design notes above. Pale Blue is restricted to very subtle light-mode backgrounds; it is not dark-mode text or a theme-bar color.
