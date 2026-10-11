# Data Model

Appwrite database `staroot_hub`. **16 collections.** Every document also has Appwrite system fields `$id`, `$createdAt`, `$updatedAt`; these are the **server-assigned timestamps** used for all ordering and conflict decisions.

Legend: `req` = required. `string[]` = array attribute. IDs referencing other collections are plain strings (Appwrite has no enforced foreign keys), validated by the API.

**Global rules**
- Clients never write to collections directly. All writes go through `api/` (server API key).
- Every client-originated record carries `client_id` (UUID) with a unique index, making retries idempotent.
- Append-only collections (`movements`, `approval_events`, `lead_activities`, `photo_records`, `reports`) have no update or delete paths.
- Currency defaults to `KES` and is stored per record.

## `users_profiles`
One row per staff member: role, department, devices.

| Field | Type | Req | Notes |
|---|---|---|---|
| `user_id` | string | yes | Appwrite Auth user ID, unique |
| `email` | string | yes | Must match ALLOWED_EMAIL_DOMAIN |
| `display_name` | string | yes |  |
| `role` | enum[executive,manager,sales_marketing,ops_frontoffice,site_engineer] | yes | Server-controlled |
| `department` | enum[executive,operations,sales,marketing] | yes |  |
| `is_admin` | bool | yes | Can edit roles/projects/rules; default false |
| `active` | bool | yes | Deactivated users are rejected by the API |
| `push_subscriptions` | string[] | no | One JSON string per device (endpoint + keys) |

Indexes: `uq_user` (unique: user_id), `uq_email` (unique: email), `ix_role` (key: role)

Permissions: Users read own row only. All writes via API (admin endpoints), except push_subscriptions via /api/push/subscribe.

## `role_permissions`
Admin-editable role to module permission map.

| Field | Type | Req | Notes |
|---|---|---|---|
| `role` | enum[executive,manager,sales_marketing,ops_frontoffice,site_engineer] | yes |  |
| `module` | enum[hub,approvals,crm,site,inventory,notifications,admin] | yes |  |
| `can_read` | bool | yes |  |
| `can_write` | bool | yes |  |
| `can_approve` | bool | yes |  |
| `scope` | enum[own,department,all] | yes | Row visibility scope |

Indexes: `uq_role_module` (unique: role, module)

Permissions: Read via API (cached client-side for UI hiding only). Write: admin API only.

## `projects`
Building projects/sites. Data, never hard-coded.

| Field | Type | Req | Notes |
|---|---|---|---|
| `name` | string | yes |  |
| `slug` | string | yes | Stable key, unique |
| `location` | string | no |  |
| `status` | enum[active,archived] | yes |  |
| `sort_order` | int | no |  |

Indexes: `uq_slug` (unique: slug), `ix_status` (key: status)

Permissions: Read via API for any signed-in user. Write: admin API only.

## `contractors`
Contractor firm assigned to a project (one row per project assignment).

| Field | Type | Req | Notes |
|---|---|---|---|
| `name` | string | yes |  |
| `trade` | string | yes | e.g. masonry, plumbing |
| `project_id` | string | yes | -> projects |
| `progress_pct` | int | yes | 0-100, set by site log updates |
| `active` | bool | yes |  |

Indexes: `ix_project` (key: project_id, active)

Permissions: Read: site/ops/executive via API. Write: admin API; progress_pct via site log endpoint.

## `inventory_items`
Catalogue of trackable assets and consumables.

| Field | Type | Req | Notes |
|---|---|---|---|
| `sku` | string | yes | Unique |
| `name` | string | yes |  |
| `category` | string | no | e.g. marketing, tents |
| `kind` | enum[consumable,returnable] | yes |  |
| `unit` | string | yes | e.g. pcs |
| `quantity_on_hand` | int | yes | Changed only by movements |
| `reorder_level` | int | no |  |
| `active` | bool | yes |  |
| `version` | int | yes | Optimistic concurrency |

Indexes: `uq_sku` (unique: sku), `ix_kind` (key: kind, active)

Permissions: Read via API by role scope. quantity_on_hand never written directly.

## `movements`
Append-only ledger of dispatch/receipt/return/adjustment.

| Field | Type | Req | Notes |
|---|---|---|---|
| `client_id` | string | yes | Idempotency key (UUID), unique |
| `item_id` | string | yes | -> inventory_items |
| `type` | enum[dispatch,receipt,return,adjustment] | yes |  |
| `quantity` | int | yes | Positive; direction implied by type |
| `from_location` | string | no |  |
| `to_location` | string | no |  |
| `custodian_id` | string | no | User holding the asset after this movement |
| `project_id` | string | no |  |
| `note` | text | no |  |
| `photo_ids` | string[] | no | Storage file IDs; see photo_records |
| `occurred_at_client` | datetime | no | Informational only |
| `recorded_by` | string | yes |  |

Indexes: `uq_client` (unique: client_id), `ix_item_time` (key: item_id, $createdAt), `ix_custodian` (key: custodian_id)

Permissions: Create via API only. No update, no delete (corrections are new adjustment rows).

## `photo_records`
Per-photo evidence metadata and server verification result.

| Field | Type | Req | Notes |
|---|---|---|---|
| `client_id` | string | yes | Idempotency key, unique |
| `file_id` | string | yes | Appwrite Storage ID |
| `owner_collection` | enum[movements,site_logs,reports] | yes |  |
| `owner_id` | string | no | Set after parent syncs |
| `captured_at_client` | datetime | yes | From device |
| `gps_lat` | float | no |  |
| `gps_lng` | float | no |  |
| `gps_accuracy_m` | float | no |  |
| `skew_seconds` | int | no | |server receipt - captured_at_client| |
| `verification` | enum[verified,unverified] | yes |  |
| `reasons` | string[] | no | e.g. no_gps, clock_skew, stale_capture |
| `uploaded_by` | string | yes |  |

Indexes: `uq_client` (unique: client_id), `ix_owner` (key: owner_collection, owner_id)

Permissions: Server-written only. Read via API with the parent record's scope.

## `site_logs`
Daily contractor progress entries.

| Field | Type | Req | Notes |
|---|---|---|---|
| `client_id` | string | yes | Idempotency key, unique |
| `project_id` | string | yes |  |
| `contractor_id` | string | yes |  |
| `log_date` | datetime | yes | Date of work |
| `work_done` | text | yes |  |
| `materials_used` | text | no |  |
| `blockers` | text | no |  |
| `status` | enum[on_track,delayed,blocked] | yes |  |
| `progress_pct` | int | no | Updates contractors.progress_pct |
| `photo_ids` | string[] | no | Max 3 per section |
| `engineer_id` | string | yes |  |

Indexes: `uq_client` (unique: client_id), `ix_proj_date` (key: project_id, log_date), `ix_contractor` (key: contractor_id, log_date)

Permissions: Create via API (site_engineer, manager). Edit within 24h by author via API; deletes disallowed.

## `reports`
Published master reports. A published report is an immutable snapshot.

| Field | Type | Req | Notes |
|---|---|---|---|
| `client_id` | string | yes | Idempotency key, unique |
| `title` | string | yes |  |
| `report_date` | datetime | yes |  |
| `author_id` | string | yes |  |
| `author_name` | string | yes |  |
| `schema_version` | int | yes |  |
| `snapshot` | text | yes | JSON: disclaimer + projects[].sections[] (title, bullets[], photo file IDs). Use longtext/mediumtext attribute |
| `status` | enum[published,superseded] | yes |  |

Indexes: `uq_client` (unique: client_id), `ix_date` (key: report_date)

Permissions: Create via API. Never edited: a correction is a new report that supersedes the old one.

## `approvals`
Internal approval requests.

| Field | Type | Req | Notes |
|---|---|---|---|
| `client_id` | string | yes | Idempotency key, unique |
| `requestor_id` | string | yes |  |
| `requestor_email` | string | yes | From session, not client |
| `category` | enum[petty_cash,procurement,leave,contract] | yes |  |
| `title` | string | yes |  |
| `details` | text | yes |  |
| `amount` | float | no |  |
| `currency` | string | no | Default KES |
| `attachment_ids` | string[] | no |  |
| `department` | enum[executive,operations,sales,marketing] | yes |  |
| `status` | enum[pending,approved,rejected,revision_requested] | yes |  |
| `assigned_role` | enum[manager,executive] | no | Null when finished |
| `assigned_to` | string | no | Specific user ID if resolved |
| `rule_id` | string | no | Rule applied at routing time |
| `version` | int | yes | Optimistic concurrency |
| `decided_at` | datetime | no |  |

Indexes: `uq_client` (unique: client_id), `ix_assignee` (key: assigned_to, status), `ix_requestor` (key: requestor_id, status), `ix_role_status` (key: assigned_role, status)

Permissions: Created and transitioned via API only. Client never sets status or assignee.

## `approval_events`
Append-only audit trail for approvals.

| Field | Type | Req | Notes |
|---|---|---|---|
| `approval_id` | string | yes |  |
| `seq` | int | yes | 1,2,3... per approval, unique with approval_id |
| `action` | enum[submitted,approved,rejected,revision_requested,resubmitted,reassigned,comment] | yes |  |
| `actor_id` | string | yes |  |
| `actor_role` | string | yes |  |
| `from_status` | string | no |  |
| `to_status` | string | yes |  |
| `comment` | text | no | Required for reject/revision |

Indexes: `uq_approval_seq` (unique: approval_id, seq), `ix_approval` (key: approval_id, seq)

Permissions: Create via API only. No update, no delete, for any role including admin.

## `approval_rules`
Configurable routing rules.

| Field | Type | Req | Notes |
|---|---|---|---|
| `category` | enum[petty_cash,procurement,leave,contract] | yes |  |
| `min_amount` | float | yes | Inclusive |
| `max_amount` | float | no | Exclusive; null = no upper bound |
| `currency` | string | yes | Default KES |
| `approver_role` | enum[manager,executive] | yes |  |
| `priority` | int | yes | Lower number wins on overlap |
| `active` | bool | yes |  |

Indexes: `ix_cat` (key: category, active, priority)

Permissions: Read via API. Write: admin API only. Boundary: amount >= min and < max, so an amount exactly at a threshold routes upward.

## `leads`
CRM leads.

| Field | Type | Req | Notes |
|---|---|---|---|
| `client_id` | string | yes | Idempotency key, unique |
| `client_name` | string | yes |  |
| `phone` | string | yes | E.164 normalised |
| `email` | string | no |  |
| `source` | enum[social_media,referral,website,walk_in] | yes |  |
| `project_id` | string | no | Property of interest |
| `budget` | float | no |  |
| `budget_currency` | string | no | Default KES |
| `stage` | enum[prospect,viewing,negotiation,won,lost] | yes |  |
| `assigned_to` | string | no | Sales rep user ID |
| `created_by` | string | yes |  |
| `last_contacted_at` | datetime | no | Server-set when a contact activity is added |
| `stage_changed_at` | datetime | no |  |
| `version` | int | yes |  |

Indexes: `uq_client` (unique: client_id), `ix_assignee_stage` (key: assigned_to, stage), `ix_stale` (key: stage, last_contacted_at)

Permissions: Created/updated via API only. Sales reps see assigned leads; managers see department; executive sees all.

## `lead_activities`
Append-only notes, calls and stage changes.

| Field | Type | Req | Notes |
|---|---|---|---|
| `client_id` | string | yes | Idempotency key, unique |
| `lead_id` | string | yes |  |
| `type` | enum[note,call,email,whatsapp,viewing,stage_change] | yes |  |
| `body` | text | no |  |
| `from_stage` | string | no |  |
| `to_stage` | string | no |  |
| `author_id` | string | yes |  |
| `occurred_at_client` | datetime | no | Informational |

Indexes: `uq_client` (unique: client_id), `ix_lead` (key: lead_id, $createdAt)

Permissions: Create via API only. No update, no delete.

## `notifications`
In-app inbox mirroring every push.

| Field | Type | Req | Notes |
|---|---|---|---|
| `user_id` | string | yes |  |
| `type` | string | yes | e.g. approval_requested |
| `title` | string | yes |  |
| `body` | string | no |  |
| `link` | string | no | In-app route |
| `source_id` | string | no |  |
| `read` | bool | yes |  |
| `read_at` | datetime | no |  |

Indexes: `ix_user_read` (key: user_id, read)

Permissions: Created by server. Owner may read and set read/read_at via document permission; nothing else.

## `sync_audit`
Server log of every synced action outcome.

| Field | Type | Req | Notes |
|---|---|---|---|
| `client_id` | string | yes | Outbox action ID |
| `user_id` | string | yes |  |
| `device_id` | string | no |  |
| `action_type` | string | yes |  |
| `outcome` | enum[applied,duplicate,conflict,rejected,error] | yes |  |
| `detail` | text | no |  |
| `attempts` | int | no |  |

Indexes: `ix_client` (key: client_id), `ix_user_time` (key: user_id, $createdAt)

Permissions: Server-written only. Read: admin API.
