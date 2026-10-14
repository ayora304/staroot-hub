# Deployment

## Runtime layout

The repository supports same-origin deployments: Vite builds the static PWA and the `api/` directory exposes authenticated API handlers under `/api`. Same-origin hosting keeps the session and CSRF cookies available to both the PWA and API. The API requires Node.js 20.12 or newer. HTTPS is required for camera capture, service workers, and push.

### Render Web Service

Use a Node **Web Service**, not a Static Site, so the frontend and authenticated `/api/*` endpoints share one origin. `server.ts` serves `dist/`, applies SPA history fallback, and dispatches `/api/*` requests to the existing TypeScript handlers.

- Build Command: `npm ci --include=dev && npm run build`
- Start Command: `npm start`
- Health Check Path: `/`
- Set `NODE_ENV=production` so session cookies use the `Secure` attribute.

Set the environment variables below in Render. Keep server secrets (`APPWRITE_API_KEY`, `VAPID_PRIVATE_KEY`) out of build-time `VITE_` variables. The frontend uses the default same-origin `/api` base. Render must install development dependencies during build because the start script uses `tsx` to run the existing TypeScript API handlers.

The API uses Appwrite as its only server-side data store. The browser receives no Appwrite API key. Do not put server secrets in variables prefixed with `VITE_`.

For Vercel deployments, `vercel.json` applies `X-Content-Type-Options`, `X-Frame-Options`, and `Referrer-Policy` to static and API responses. API handlers additionally set a restrictive `Permissions-Policy`; the static app must keep camera and location available for evidence capture, so do not apply that API-only restriction globally. Other hosting platforms must configure equivalent headers on static responses.

## Appwrite setup

1. Create separate Appwrite projects for development, staging, and production.
2. Configure a local `.env` from `.env.example`; keep `.env` out of source control.
3. Create an Appwrite API key limited to the required authentication, database, and storage operations.
4. Run `npm run setup:appwrite` to create/check database collections, attributes, indexes, private attachments storage, and seed rows. Check that inventory collections and indexes are present.
5. Set `APPWRITE_BUCKET_ATTACHMENTS=attachments` and `APPWRITE_BUCKET_PROOFS=attachments` when sharing the private bucket. `npm run setup:proofs` verifies the selected bucket and its private file security. Upload APIs still enforce 10 MB approval files and 3 MB JPEG evidence separately.
6. Create the first verified user and set its `users_profiles` row to role `executive`, `is_admin=true`, and `active=true`.
7. Confirm the Appwrite deployment supports DocumentsDB transactions; inventory movement creation depends on a transaction to keep the stock count and append-only ledger in sync.

The setup script seeds `role_permissions`, `approval_rules`, and sample `projects`. Review seed data before running it against production.

## Build and environment variables

Run `npm run typecheck` and `npm run build`. Build artifacts are written to `dist/`; the serverless platform must also package the root `api/` functions. Configure these environment variables in each environment’s secret manager:

| Variable | Where | Purpose |
|---|---|---|
| `APPWRITE_ENDPOINT` | Server | Appwrite API URL |
| `APPWRITE_PROJECT_ID` | Server | Appwrite project |
| `APPWRITE_API_KEY` | Server secret | Server-side authentication, database and storage access |
| `APPWRITE_DATABASE_ID` | Server | Defaults to `staroot_hub` |
| `APPWRITE_BUCKET_ATTACHMENTS` | Server | Approval file bucket |
| `APPWRITE_BUCKET_PROOFS` | Server | Photo bucket; may share `attachments` |
| `ALLOWED_EMAIL_DOMAIN` | Server | Comma-separated permitted email domains |
| `DEFAULT_CURRENCY` | Server/build | Defaults to `KES` |
| `VAPID_PUBLIC_KEY` | Server | Web Push public key |
| `VAPID_PRIVATE_KEY` | Server secret | Web Push private key |
| `VAPID_SUBJECT` | Server | `mailto:` contact for push delivery |
| `VITE_VAPID_PUBLIC_KEY` | Build-time public value | Same VAPID public key used by the server |
| `VITE_API_BASE` | Build-time public value | Keep `/api` for same-origin requests |

Generate a matching VAPID pair with `npx web-push generate-vapid-keys`. Keep the private key server-only. Do not reuse keys between environments. `API_DEV_TARGET` is for local Vite proxying and is not needed in production.

## Release procedure

1. Deploy a staging build over HTTPS with the API functions and static output on the same origin.
2. Check an unauthenticated API request returns 401, sign in with a verified active profile, then validate approvals, inventory stock movement and photo access with role-restricted accounts.
3. Complete the [offline and device release matrix](TEST_MATRIX.md), including a two-account same-device check and an offline replay with attachments/photos.
4. Run Lighthouse on mobile and desktop. Save the reports and fix installability or security failures before production. Verify first-load performance and offline loading after the module chunks have been visited online.
5. Deploy the same commit to production, verify the API, Appwrite connectivity, camera, push subscription, service worker update prompt, and monitor server logs.
6. Roll back by redeploying the prior frontend and API build together. The service worker update prompt lets clients take the prior/current deployment transition deliberately.

## Operational limits and follow-ups

- Login rate limiting is process-local. Add a shared rate-limit store before relying on the configured thresholds across multiple serverless instances.
- Site and inventory evidence is stored in a private bucket and served through authenticated owner-scope APIs. Keep the bucket private; do not add public file permissions.
- PDF/DOCX renderer chunks are excluded from install precache to reduce every PWA update download. They are cached after online use; first-time offline export is not guaranteed.
- Browser IndexedDB is not encrypted by this app. On shared or managed devices, use OS/browser-profile protection. Sign-out clears session/read caches; account-tagged queued writes and blobs remain so their owner can resume them.
- The deployment platform, domain, VAPID production pair, and shared rate-limit provider still need environment-owner configuration before production release.
