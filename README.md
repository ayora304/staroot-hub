# Staroot Hub

Internal offline-first PWA for Staroot Real Estate: approvals, CRM, site progress reporting, inventory and logistics.

**Start here:** `docs/HANDOFF.md`, then `docs/ARCHITECTURE.md`.

## Status
Phase 0 complete. Phase 1 code written (toolchain, auth, RBAC, shell, theme, Hub, service worker); first install and typecheck still to be confirmed. Phase 2 (offline outbox and sync engine) next.

## Run it
```powershell
npm install
copy .env.example .env      # fill in Appwrite values
npm run setup:appwrite      # creates collections + seed rows (use a throwaway project first)
npm run typecheck
npm test
npm run dev                 # UI on http://localhost:5173, proxies /api to API_DEV_TARGET
```
The `api/` handlers use a Node `(req, res)` signature and must be served separately in dev (any host tooling that runs them on `API_DEV_TARGET`).

## Key rules
- Greenfield: do not copy from the old Asset Tracker.
- RBAC and timestamps are decided on the server, never the client.
- Log every task: `.\scripts\add-changelog.ps1 -Agent "<name>" -Phase "<n>" -Type <type> -Message "..." -Files "a","b"`
- Secrets live in env vars only (`.env.example`).

## Layout
`api/` serverless endpoints, `appwrite/` collection definitions + seeds, `src/core` shared infra, `src/modules` features, `tests/`, `docs/`.
