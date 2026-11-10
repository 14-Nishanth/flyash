-- Every client-originated app_records write must identify the authenticated actor.
-- Existing imported rows are untouched; this only tightens future INSERT/UPDATE checks.
drop policy if exists "FlyAsh authenticated insert records" on public.app_records;
create policy "FlyAsh authenticated insert records"
on public.app_records
for insert to authenticated
with check (
  ((select auth.jwt()) -> 'app_metadata' ->> 'flyash_access') = 'true'
  and ((select auth.jwt()) -> 'app_metadata' ->> 'role') in ('admin', 'owner', 'manager', 'staff', 'operator')
  and (collection <> 'settings' or ((select auth.jwt()) -> 'app_metadata' ->> 'role') in ('admin', 'owner', 'manager'))
  and updated_by = (select auth.uid())
  and (deleted_at is null or ((select auth.jwt()) -> 'app_metadata' ->> 'role') in ('admin', 'owner'))
);

drop policy if exists "FlyAsh authenticated update records" on public.app_records;
create policy "FlyAsh authenticated update records"
on public.app_records
for update to authenticated
using (
  ((select auth.jwt()) -> 'app_metadata' ->> 'flyash_access') = 'true'
  and ((select auth.jwt()) -> 'app_metadata' ->> 'role') in ('admin', 'owner', 'manager')
  and deleted_at is null
)
with check (
  ((select auth.jwt()) -> 'app_metadata' ->> 'flyash_access') = 'true'
  and ((select auth.jwt()) -> 'app_metadata' ->> 'role') in ('admin', 'owner', 'manager')
  and updated_by = (select auth.uid())
  and (deleted_at is null or ((select auth.jwt()) -> 'app_metadata' ->> 'role') in ('admin', 'owner'))
);
