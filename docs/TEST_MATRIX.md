# Offline and device release matrix

Run these checks against staging before each production release. Record browser, OS, build SHA, result, and any issue in the release record. The matrix is a checklist; entries are not marked passed until someone runs them.

| Area | Device / setup | Steps | Expected result |
|---|---|---|---|
| Sign-in and account boundary | Desktop Chromium, two staff accounts | Sign in as A, queue a write offline, sign out, sign in as B, go online | B sees no A request details; the engine does not send A-owned writes. A can sign in again and resume A’s queue. |
| Offline reads | Desktop Chromium and Android Chrome | Open approvals, site progress and inventory while online; disconnect and reload | Cached rows are shown with offline status. No API response is served from the service worker cache. |
| Outbox replay | Desktop Chromium, network throttling | Queue approval with file, site log with photos, and inventory movement; reconnect | Each account-owned row sends once; binary uploads precede parent creation; successful blobs are removed. |
| Conflict handling | Two devices signed in as same user | Load one stock item on both; dispatch from A, then submit stale movement from B | B’s stale write becomes Needs review; on-hand quantity never drops below zero. |
| Camera evidence | Android Chrome, HTTPS | Deny then allow camera and location; capture movement/site evidence | Camera denial is recoverable; allowed capture stores compressed JPEG; no GPS is explicitly marked unverified; image is viewable only to authorized scope. |
| iOS behavior | Current supported iOS Safari, installed PWA and browser tab | Queue while offline; return online; test camera and push in tab and installed app | Queue drains on app visibility/online fallback; camera requires HTTPS; push behavior follows iOS installed-PWA requirements. |
| Update lifecycle | Desktop Chromium and iOS installed PWA | Deploy a new build while an old client is open | New worker waits; update prompt appears; user update reloads to the new version without losing local queued records. |
| Storage cleanup | Desktop Chromium | Queue a photo, complete sync, inspect status and sign out | Synced blobs are removed; sign-out clears session/read cache; queued writes remain partitioned by owner so the owner can resume later. |
| Export chunks | Desktop Chromium | Open a report and generate PDF and DOCX online, then repeat offline after each export was loaded once | Lazy export chunks load online and are reused from the service worker cache afterward. First offline use before download is not guaranteed. |
| PWA audit | Lighthouse on production-like HTTPS URL | Run installability, performance, accessibility and best-practices audits on mobile and desktop | Save reports; investigate any failed installability/security criteria and performance regressions before release. |

## Current code-level safeguards

- Session and CSRF cookies are same-site; the session cookie is HttpOnly and Secure in production. All write endpoints check the double-submit CSRF token.
- Browser code never receives the Appwrite API key. Appwrite collections and Storage remain private; API endpoints enforce role/scope checks.
- Offline outbox records carry their creating user ID. The sync engine drains only the active account’s records; legacy rows without an owner are held in Needs review.
- Authenticated read caches are keyed by user ID and cleared at sign-out. Outbox blobs remain local while queued so the owner can resume after signing in again.
- Login rate limits are process-local. Configure a shared rate-limit store before relying on the thresholds across multiple serverless instances.
