# FlyAsh repair status

## Scope of this branch

This branch is a non-production safety pass. It does not modify the production Supabase schema or data and does not deploy the website.

Changes currently included:
- Expanded the JSON backup to include all business collections currently held in app state: parties, inward/outward material, payments, party adjustments, production jobs, expenses, employees, attendance, worker groups, product rates, and settings.
- Excluded local login passwords and Telegram bot secrets from exported backups.
- Added backup metadata and record counts; clarified that the export is a snapshot of the current device's loaded app state, not a server-side database dump.
- Added a pull-request/push verification workflow using Node.js 22, `npm ci`, and `npm run build`.
- Changed cloud sync reads to throw/report query errors instead of silently treating failed reads as a successful sync.

## Production blockers found during audit

**Do not consider the production app secure yet.**

1. Several production tables have RLS policies granting `ALL` to `public` with `USING (true)`. That makes the data API publicly readable/writable for those tables when grants permit it.
2. The frontend contains local/demo credentials and authenticates some users entirely in browser code. Client-side role checks are not a security boundary.
3. The Supabase project currently has no Supabase Auth users, while the application relies on local custom accounts. Immediately replacing the public policies with authenticated-only policies would break cloud access until a real Auth account and role provisioning are configured.
4. Some application modules write to `worker_groups`, `product_rates`, and `app_users`, while those tables were not present in the inspected production schema. The database also contains legacy singular tables alongside newer plural tables.
5. Current-device localStorage data is not the same thing as cloud data. Export the backup from each device before any migration. This export intentionally does not include credentials or provider tokens.

## Required next security stage

Before production rollout:
1. Provision a real Supabase Auth administrator account and set a server-controlled role claim (never use user-editable user metadata for authorization).
2. Migrate login and user administration away from browser-stored passwords to Supabase Auth / server-side administrative operations.
3. Add and test explicit RLS policies for each application table: authenticated read/write, role-gated deletes, and admin-only user management. Do not use public `USING (true)` policies.
4. Reconcile legacy and current table names/foreign keys with additive migrations only; do not drop or truncate tables.
5. Run anonymous-vs-authenticated database policy tests, build checks, and a live create/read/update/delete smoke test with the new administrator account.
6. Only then remove the public policies and deploy the authenticated client.

No production database policies, tables, or records were changed by this branch.
