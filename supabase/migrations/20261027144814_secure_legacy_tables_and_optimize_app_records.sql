-- Applied to Supabase project laqpdlasfxearjtnnouu on 2026-10-27.
-- The live client uses public.app_records for all shared business collections.
-- Retain legacy tables and their data, but remove the old unrestricted policies.
drop policy if exists "Allow All Attendance" on public.attendance;
drop policy if exists "Allow All Employees" on public.employees;
drop policy if exists "Allow All Expenses" on public.expenses;
drop policy if exists "Allow All Jobs" on public.job_wage_entries;
drop policy if exists "Allow All Inward" on public.material_inward;
drop policy if exists "Allow All Outward" on public.material_outward;
drop policy if exists "Allow All Parties" on public.parties;
drop policy if exists "Allow All Payments" on public.payments;

-- Index the foreign key used for audit attribution.
create index if not exists app_records_updated_by_idx on public.app_records(updated_by);

-- Avoid repeated per-row auth function evaluation in the active sync policies.
drop policy if exists "FlyAsh authenticated read records" on public.app_records;
create policy "FlyAsh authenticated read records"
  on public.app_records for select to authenticated
  using (((select auth.jwt()) -> 'app_metadata' ->> 'flyash_access') = 'true'
      or ((select auth.jwt()) -> 'app_metadata' ->> 'role') in ('admin','owner'));

drop policy if exists "FlyAsh authenticated insert records" on public.app_records;
create policy "FlyAsh authenticated insert records"
  on public.app_records for insert to authenticated
  with check (
    (((select auth.jwt()) -> 'app_metadata' ->> 'flyash_access') = 'true'
      or ((select auth.jwt()) -> 'app_metadata' ->> 'role') in ('admin','owner'))
    and (updated_by is null or updated_by = (select auth.uid()))
    and (deleted_at is null or ((select auth.jwt()) -> 'app_metadata' ->> 'role') in ('admin','owner'))
  );

drop policy if exists "FlyAsh authenticated update records" on public.app_records;
create policy "FlyAsh authenticated update records"
  on public.app_records for update to authenticated
  using (
    (((select auth.jwt()) -> 'app_metadata' ->> 'flyash_access') = 'true'
      or ((select auth.jwt()) -> 'app_metadata' ->> 'role') in ('admin','owner'))
    and deleted_at is null
  )
  with check (
    (((select auth.jwt()) -> 'app_metadata' ->> 'flyash_access') = 'true'
      or ((select auth.jwt()) -> 'app_metadata' ->> 'role') in ('admin','owner'))
    and (updated_by is null or updated_by = (select auth.uid()))
    and (deleted_at is null or ((select auth.jwt()) -> 'app_metadata' ->> 'role') in ('admin','owner'))
  );

drop policy if exists "FlyAsh admin owner delete records" on public.app_records;
create policy "FlyAsh admin owner delete records"
  on public.app_records for delete to authenticated
  using (
    (((select auth.jwt()) -> 'app_metadata' ->> 'flyash_access') = 'true'
      or ((select auth.jwt()) -> 'app_metadata' ->> 'role') in ('admin','owner'))
    and ((select auth.jwt()) -> 'app_metadata' ->> 'role') in ('admin','owner')
  );