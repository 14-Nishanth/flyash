# FlyAsh shared cloud sync setup

The new shared data path is additive: it uses `public.app_records` and leaves existing tables in place. The old browser-only demo login is disabled because it cannot securely authorize cross-device writes.

## Required one-time Supabase setup

1. Export a JSON backup from every device that has unsynchronized local records. The browser's local storage is device-specific.
2. In Supabase Dashboard → Authentication → Users, create the first company account with an email address and a strong password.
3. Open that Auth user's **app metadata** (not user metadata) and set:
   ```json
   {
     "role": "admin",
     "flyash_access": true
   }
   ```
   Save the change, then sign in to FlyAsh using that email and password. Only users with this server-controlled metadata can read or write shared records.
4. **For the current Supabase project, this migration has already been applied.** Verification confirmed `app_records` contains the 8 existing parties and 4 existing employees, the original source tables still contain those same rows, and Realtime publication membership is enabled. For another environment only, take a current database backup and then apply `supabase/migrations/20261013000000_app_records.sql`; it is additive and uses `ON CONFLICT DO NOTHING`.
5. **The `manage-users` Edge Function is already deployed** with JWT verification enabled. Supabase's standard `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` runtime secrets are used server-side; never put the service-role key in frontend code.
6. Merge/deploy the app only after CI passes. Sign in on a second device with an authorized account and test creating, editing, and deleting a harmless test record. Verify the change appears on both devices before using it for real business transactions.

## How synchronization works

- `app_records` is the shared cloud source for parties, inward/outward entries, payments, vouchers, jobs, employees, attendance, expenses, worker groups, product rates, and settings.
- Changes are written as they happen; Realtime refreshes other clients, with a 30-second/focus fallback.
- Deletions use tombstones, so an offline device should not re-upload a record deleted elsewhere.
- Failed writes are queued in this browser and retried. The Settings page displays sync errors and the last successful sync time.
- Passwords and bot tokens are not stored in `app_records`.

## Important limitations

- Each device has its own local cache. Export backups from devices before first sign-in so local-only records can be merged into the shared store.
- The migration preserves old tables, but the legacy tables and their pre-existing public RLS policies still exist for backward compatibility. They must be reviewed and locked down in a separate coordinated cutover; do not assume this new store alone secures every legacy table.
- User administration requires the deployed Edge Function. Create the first administrator manually in Supabase Auth, then create additional company users from Settings.
- A successful frontend build is not the same as a successful live two-device sync test. Complete the smoke test above after the migration and first administrator are configured.
