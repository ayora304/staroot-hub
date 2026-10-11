# Appwrite Permissions Policy

## Principle
Appwrite is the data store. **Trusted logic lives in `api/`**, which uses a server API key. Browsers never get write access to any collection.

## Rules
1. **Collection-level permissions: none for clients.** Create/update/delete are granted to no user label. Only the server API key writes.
2. **Reads go through the API** (`GET /api/...`). The API applies the role + scope from `role_permissions` and returns only permitted rows. Responses are cached in IndexedDB for offline viewing.
3. **Two direct-read exceptions**, via document-level permissions set by the server at creation:
   - `notifications`: owner may read, and update only `read` / `read_at`.
   - `users_profiles`: owner may read own row.
4. **Storage buckets** (`proofs`, `attachments`):
   - File create: server only (API streams the upload after validating type, size, owner).
   - File read: via signed, short-lived API URLs. Buckets are not public.
   - Limits: images `image/jpeg,image/webp` up to 2 MB; attachments `application/pdf,image/jpeg,image/png` up to 10 MB.
5. **Append-only collections** (`movements`, `approval_events`, `lead_activities`, `photo_records`, `reports`, `sync_audit`) expose no update or delete route in the API. Do not add one.
6. **Admin** actions require `users_profiles.is_admin = true`, checked server-side on every call.

## Per-collection summary
See the `permissions_note` in each `appwrite/collections/*.json` and `docs/DATA_MODEL.md`.
