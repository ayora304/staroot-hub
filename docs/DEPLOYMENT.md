# Deployment

> Draft for Phase 0. Finalised in Phase 7. Hosting choices below are **not yet decided** (see Open Questions in `HANDOFF.md`).

## Components
1. **Appwrite** (cloud or self-hosted): database `staroot_hub`, buckets `proofs` and `attachments`, API key with database + storage scopes.
2. **Serverless API** (`api/`): any Node-compatible host (e.g. Vercel, Netlify, Cloudflare).
3. **Static frontend** (Vite build): same host or any CDN; must be served over HTTPS (required for PWA, camera, push).

## Setup order
1. Create the Appwrite project, database and buckets.
2. Create collections from `appwrite/collections/*.json` (a Phase 1 script will automate this).
3. Seed `role_permissions`, `approval_rules`, `projects` from `appwrite/seed/`.
4. Copy `.env.example` to `.env`, fill values, generate VAPID keys (`npx web-push generate-vapid-keys`).
5. Set the same variables in the host's secret store.
6. Deploy API and frontend; confirm `/api/auth/session` responds.
7. Create the first user, set role `executive` and `is_admin=true` manually in Appwrite.

## Environments
`local` (dev Appwrite project), `staging`, `production`. Never share API keys or VAPID keys between them.

## Release checklist
Lighthouse PWA audit passes; offline test matrix green (`TEST_MATRIX.md`); service worker version bumped; CHANGELOG entry written; rollback = redeploy previous build (service worker update prompt handles clients).
