# Decisions (ADR log)

Format: ID, decision, reason, consequence. Add new entries at the bottom. Never rewrite old ones; supersede them.

| ID | Decision | Reason | Consequence |
|---|---|---|---|
| D1 | Greenfield rebuild, reuse nothing from the old "Asset Tracker" | Owner requirement; original had structural flaws | New names, assets, structure |
| D2 | Individual accounts, no shared logins | Roles and audit are impossible with shared credentials | Auth + profile provisioning needed |
| D3 | IndexedDB (Dexie) for all offline data | localStorage ~5 MB limit breaks on photos | Outbox + blob store |
| D4 | Server timestamps + field-level merge, not client "Last Write Wins" | Phone clocks are wrong; LWW loses data | `version` fields, 409 flow, `needs_review` state |
| D5 | Audit/notes as separate append-only collections | JSON blobs in one field are editable and unqueryable | More collections, clean history |
| D6 | Approval routing is configurable data with `[min, max)` ranges | Hard-coded thresholds and ambiguous boundaries | `approval_rules` + admin UI; exact threshold routes upward |
| D7 | Honest browser limits: in-app capture + server verification, "unverified" label | Live capture cannot be enforced in a browser | Photo verification pipeline |
| D8 | Merge contractor and construction reporting into Site Progress & Reporting | Original had two overlapping "3.4" modules | One module, one data flow |
| D9 | Projects and contractors are data | Names must not be hard-coded | Admin screens |
| D10 | Add `photo_records` collection | Per-photo verification state does not fit inside arrays of file IDs | 16 collections, not 14 |
| D11 | Add `role_permissions` collection | "Role map in a database, admin-editable" needs a table | Seeded from `role_map.json` |
| D12 | Published reports are immutable JSON snapshots | A published report is a document of record; sections are not queried individually | Corrections create a superseding report |
| D13 | Clients never write to Appwrite directly; reads via API except own notifications/profile | Server must enforce RBAC and idempotency | Slightly more API surface, much stronger security |
| D14 | Approval thresholds/currency in seed are placeholders (KES) | Owner has not confirmed values | Must confirm before go-live |
| D15 | Use Appwrite sessions inside an HttpOnly cookie, not a custom HMAC session | Less custom crypto to get wrong; Appwrite validates and can revoke sessions | `SESSION_SECRET` env var removed; double-submit CSRF cookie added |
| D16 | Tailwind v4 with CSS-variable tokens; theme chosen by `data-theme` | One token set drives dark gold and light themes with no rebuild | Components use token classes (`bg-surface`, `text-accent`), never raw hex |
| D17 | Service worker via vite-plugin-pwa `injectManifest` + Workbox; `/api/*` is NetworkOnly | Full control of the SW for Phase 2 sync; offline writes belong to the outbox, not an HTTP cache | API responses are cached by app code in Dexie, not by the SW |
| D18 | Cache the last session payload in IndexedDB so the app opens offline | Field staff must reach the Hub with no signal | Session is re-verified on the `online` event; 401/403 wipes local data |
| D19 | `src/core/rbac/permissions.ts` is shared by browser and API | One rule set, one test suite; the UI cannot drift from the server | File must stay free of runtime imports (types only) |

| D20 | Both themes use neutral large surfaces; the official blues are restricted to accents, icons, links, status indicators, and selected elevated dark surfaces | Preserve legibility and avoid blue-tinted cards throughout the app while retaining the approved palette | Shared CSS variables enforce near-black/white surfaces; light mode uses #052659 accent, dark mode uses #5482B4; #C2E8FF is reserved for subtle light backgrounds |
