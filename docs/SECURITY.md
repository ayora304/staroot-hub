# Security

## Authentication
- Individual accounts via Appwrite Auth. Sign-up/sign-in restricted to `ALLOWED_EMAIL_DOMAIN`; email verification required.
- Session in an `HttpOnly; Secure; SameSite=Lax` cookie (or Appwrite session via the API). CSRF token required on mutating requests.
- Deactivated users (`active=false`) are rejected on every request.

## Authorization
- RBAC check on every endpoint, from server-loaded profile and `role_permissions`. Never from client claims.
- Approval decisions: the API verifies `approval.status == pending` **and** the actor equals `assigned_to` (or holds `assigned_role` within department scope), and `baseVersion` matches.
- Routing is computed on the server from `approval_rules`; client-supplied assignee is ignored.

## Integrity
- Server timestamps only for decisions and ordering.
- Append-only collections have no update/delete code path.
- Idempotency via unique `client_id`.
- Photos: server computes skew, checks GPS presence/accuracy, size, MIME, and marks `unverified` with reasons. Never silently accepted.

## Input handling
zod schemas for every body; unknown fields rejected; strings length-capped; phone numbers normalised; file MIME sniffed server-side, not trusted from the client.

## Abuse controls
Per-user and per-IP rate limits on auth and write endpoints; upload size limits; sync batch size cap.

## Secrets
Env vars only (`.env.example` lists names). API key scoped to the minimum Appwrite permissions. Rotate VAPID and session secrets on suspected leak.

## Client data
Cache is per user, cleared on sign-out. Warn that offline data lives on the device; recommend device lock. No sensitive data in `localStorage`.

## Push
Subscriptions stored per device in `users_profiles.push_subscriptions`; expired endpoints (410) pruned. Payloads carry no sensitive detail, only a title and route.

## Review checklist (Phase 7)
Endpoint-by-endpoint RBAC test, IDOR tests (access another user's record by ID), rate-limit test, upload abuse test, dependency audit, CSP headers.
