# Appwrite Permissions Policy

## Principle
Appwrite is the data store. **Trusted logic lives in `api/`**, which uses a server API key. Browsers never get write access to any collection.

## Rules
1. **Collection-level permissions: none for clients.** Create/update/delete are granted to no user label. Only the server API key writes.
2. **Reads go through the API** (`GET /api/...`). The API applies the role + scope from `role_permissions` and returns only permitted rows. Responses are cached in IndexedDB for offline viewing.
3. **Two direct-read exceptions**, via document-level permissions set by the server at creation:
   - `notifications`: owner may read, and update only `read` / `read_at`.
   - `users_profiles`: owner may read own row.
4. **Storage buckets** (`proofs` may share the private `attachments` bucket when plans limit bucket count):
   - File create: server only (API streams the upload after validating type, size, owner).
   - File read: through authenticated API endpoints that verify access to the owning log, report, or inventory movement. Buckets are not public.
   - Limits: site evidence is compressed JPEG up to 3 MB; approval attachments are PDF/JPEG/PNG up to 10 MB. The API enforces type and size even when the shared bucket permits larger files.
   - Photo verification records are created once, after their parent log/report/movement is written, so `photo_records` remains append-only.
5. **Append-only collections** (`movements`, `approval_events`, `lead_activities`, `photo_records`, `reports`, `sync_audit`) expose no update or delete route in the API. Do not add one.
6. **Admin** actions require `users_profiles.is_admin = true`, checked server-side on every call.
7. **Inventory stock** is updated only in the same Appwrite transaction that creates its append-only movement row. Dispatch decrements stock; receipts, returns, and positive adjustments increment it. The client submits the inventory item version it read; stale writes conflict.

## Per-collection summary
See the `permissions_note` in each `appwrite/collections/*.json` and `docs/DATA_MODEL.md`.
