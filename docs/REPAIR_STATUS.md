# FlyAsh repair status

## Implemented on `repair/cloud-sync-v2`

- Replaced browser-only demo login with Supabase Auth email/password sign-in. Access requires server-controlled `app_metadata.flyash_access=true` and a role.
- Added the shared `public.app_records` store for all business collections, app settings, and soft-delete markers.
- Added row-level security for authenticated access, operator editing, and admin/owner-only soft deletion.
- Added Realtime publication membership and conflict-safe initial copies from existing plural tables.
- Routed app business CRUD operations through the shared record store so edits/deletes can sync across devices independent of inconsistent legacy table ID types.
- Added a local retry queue for failed cloud writes and visible sync errors/last-sync time.
- Kept deleted record payloads in cloud tombstones for recovery; deletes no longer erase the stored payload.
- Added a Supabase Edge Function for admin/owner user management. It validates the caller, uses the service-role key only server-side, and protects the last administrator.
- Removed hardcoded demo passwords from the login UI and README.
- Added the cloud sync setup guide and CI build verification.

## Live changes verified

- The additive migrations have been applied to Supabase project `laqpdlasfxearjtnnouu`.
- Realtime publication membership is enabled for `public.app_records`.
- The new table has authenticated-only policies gated by server-controlled app metadata; SQL privilege checks confirmed the `anon` role has no SELECT or INSERT grants on `app_records`.
- The shared store contains 10 party records, 5 employee records, and one safe settings record. It imported the 8 plural parties, 4 plural employees, 2 legacy parties, and 1 legacy employee using conflict-safe inserts.
- Original source table counts remain unchanged: 8 plural parties, 4 plural employees, 2 legacy parties, 1 legacy employee, and 1 legacy settings row. No table was dropped or truncated.
- The `manage-users` Edge Function is deployed with JWT verification enabled.
- CI build passed on the branch before the most recent Settings-table-browser update; a fresh run is pending.

## Required before the new client can be deployed safely

1. In Supabase Dashboard → Authentication → Users, create the first company account.
2. Set that account's **app metadata** to:
   ```json
   { "role": "admin", "flyash_access": true }
   ```
   Do not place these authorization claims in user-editable user metadata.
3. After CI passes, merge/deploy the new client, sign in, and run a live two-device create/edit/delete smoke test. The current Supabase project has no Auth users, so a real two-device authenticated sync test cannot yet be completed.
4. The existing legacy tables still have older public RLS policies. They are preserved for compatibility and require a coordinated follow-up cutover after the new client is active; this branch does not claim those legacy tables are now secure.
5. Export local backups from each device before first sign-in. The migration imports the existing server tables; device-specific localStorage records are merged on the first authenticated sync.

See [CLOUD_SYNC_SETUP.md](CLOUD_SYNC_SETUP.md) for the exact rollout steps.
