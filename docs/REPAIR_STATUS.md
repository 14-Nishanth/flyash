# FlyAsh repair status

## Current development branch

- Branch: `repair/full-stack-correction`
- Production `main` was not changed by this repair branch.
- The existing production application was not replaced or redeployed by this branch.
- No database tables were dropped, truncated, or reset.

## Corrections in this branch

- Added Admin, Manager, and Staff role handling while preserving compatibility with legacy Owner and Operator accounts.
- Added role-aware edit controls and context-level permission checks for business records.
- Added duplicate checks for payments and account adjustments, and expanded duplicate confirmation to edit flows.
- Corrected selected report date windows so weekly periods are clipped to their selected month.
- Corrected production quantity aggregation so gang/loading/unloading work does not count as brick production.
- Corrected opening finished-goods stock so it is not counted as current-period production.
- Corrected party balance treatment for material-purchase expense/inward mirrors to reduce double counting.
- Kept material inward stock entries linked to material-purchase expenses when those expenses are edited or deleted.
- Added raw material outward deduction in matching stock units and secondary display conversions for dust units, kilograms, and cement bags.
- Kept the material stock unit selected by the user rather than forcing all display values into tonnes.
- Preserved the existing cloud record architecture and sanitized sensitive integration settings from cloud sync.

## Supabase production checks performed

- Project: `laqpdlasfxearjtnnouu` (Mumbai region).
- Existing Auth accounts were found: one Admin and one legacy Operator, both with `flyash_access=true`.
- Installed four authenticated-only RLS policies on `public.app_records`: SELECT, INSERT, UPDATE, and DELETE.
- Policy intent: Admin/Owner can read, create, edit, and delete; Manager can read, create, and edit; Staff/legacy Operator can read and create.
- Verified that the four policies exist after installation.
- Verified that the shared record counts were unchanged by policy installation:
  - employees: 4 active, 1 deleted
  - expenses: 4 active
  - inwards: 9 active
  - jobs: 5 active, 1 deleted
  - outwards: 10 active
  - parties: 8 active, 6 deleted
  - party adjustments: 1 active, 1 deleted
  - payments: 6 active
  - product rates: 3 active
  - settings: 1 active
  - worker groups: 3 active
- No live business rows were edited or deleted during this verification.

## Build verification

- A GitHub Actions production build completed successfully on this branch at commit `e99e319d2e7b44076da492cb17a169368ded64ba`.
- Further documentation and stock/duplicate-flow changes were committed after that successful build. A new build for the latest branch head is required before treating the branch as build-verified.
- The CI workflow currently runs `npm ci` and `npm run build`. It does not yet perform browser-based end-to-end tests.

## Not yet verified — do not call this release-ready

1. Latest-commit build after all follow-up edits.
2. Real password sign-in for both existing accounts (credentials were not available to the audit).
3. Authenticated create/read/update/soft-delete through the browser against Supabase.
4. Two-device synchronization and conflict behavior.
5. Staff/Manager/Admin permission tests with real JWTs.
6. Full functional regression of every page and form, including production recipes, wages, attendance, reports, and backup/restore.
7. Production deployment and post-deployment smoke tests.

## Release safety

Do not merge this branch or change the live website until the outstanding tests pass. Keep the current production branch and business data intact. Before release, export a backup and test with dedicated non-production records and accounts.
