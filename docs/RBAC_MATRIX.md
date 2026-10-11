# RBAC Matrix

Roles are enforced **server-side** on every endpoint. The UI hides controls for convenience only. Source of truth: `role_permissions` collection (seed: `appwrite/seed/role_map.json`). `is_admin` is a separate flag on the profile.

Scope: **own** = records the user created or is assigned; **dept** = same department; **all** = everything.

| Module | Executive | Manager | Sales & Marketing | Ops & Front Office | Site Engineer |
|---|---|---|---|---|---|
| Hub | all | dept | own | own | own |
| Approvals: submit | yes | yes | yes | yes | yes |
| Approvals: decide | yes, all | yes, dept, routed to manager | no | no | no |
| CRM | read all | read/write dept | read/write own | add + read own | none |
| Site Progress | read all | read/write dept | none | read dept | read/write own |
| Inventory | read all | read/write dept | read dept | read/write dept | read/write own (custody) |
| Notifications | own | own | own | own | own |
| Admin | yes (default admin) | only if `is_admin` | no | no | no |

## Rules
- A user only ever sees data inside their scope; the API filters, the client never receives out-of-scope rows.
- Approval decisions also require `assigned_to`/`assigned_role` to match the actor (see `SECURITY.md`).
- Role changes take effect on the next request; clients re-fetch the profile on every sync.
- A manager of one department has no write access to another department's data.
- Role changes are logged in `sync_audit` (`action_type: role_change`).
