-- FlyAsh shared-record access, matching the policy installed in the production Supabase project.
-- Admin/Owner: read/create/edit/soft-delete. Manager: read/create/edit. Staff/legacy Operator: read/create.
-- Access requires explicit flyash_access metadata, except legacy Admin/Owner accounts.
drop policy if exists "FlyAsh authenticated read records" on public.app_records;
create policy "FlyAsh authenticated read records" on public.app_records
for select to authenticated using (
  (((select auth.jwt()) -> 'app_metadata' ->> 'flyash_access') = 'true'
    or ((select auth.jwt()) -> 'app_metadata' ->> 'role') in ('admin','owner'))
  and ((select auth.jwt()) -> 'app_metadata' ->> 'role') in ('admin','owner','manager','staff','operator')
);

drop policy if exists "FlyAsh authenticated insert records" on public.app_records;
create policy "FlyAsh authenticated insert records" on public.app_records
for insert to authenticated with check (
  (((select auth.jwt()) -> 'app_metadata' ->> 'flyash_access') = 'true'
    or ((select auth.jwt()) -> 'app_metadata' ->> 'role') in ('admin','owner'))
  and ((select auth.jwt()) -> 'app_metadata' ->> 'role') in ('admin','owner','manager','staff','operator')
  and (updated_by is null or updated_by = (select auth.uid()))
  and (deleted_at is null or ((select auth.jwt()) -> 'app_metadata' ->> 'role') in ('admin','owner'))
);

drop policy if exists "FlyAsh authenticated update records" on public.app_records;
create policy "FlyAsh authenticated update records" on public.app_records
for update to authenticated using (
  (((select auth.jwt()) -> 'app_metadata' ->> 'flyash_access') = 'true'
    or ((select auth.jwt()) -> 'app_metadata' ->> 'role') in ('admin','owner'))
  and ((select auth.jwt()) -> 'app_metadata' ->> 'role') in ('admin','owner','manager')
  and deleted_at is null
) with check (
  (((select auth.jwt()) -> 'app_metadata' ->> 'flyash_access') = 'true'
    or ((select auth.jwt()) -> 'app_metadata' ->> 'role') in ('admin','owner'))
  and ((select auth.jwt()) -> 'app_metadata' ->> 'role') in ('admin','owner','manager')
  and (updated_by is null or updated_by = (select auth.uid()))
  and (deleted_at is null or ((select auth.jwt()) -> 'app_metadata' ->> 'role') in ('admin','owner'))
);

drop policy if exists "FlyAsh admin owner delete records" on public.app_records;
create policy "FlyAsh admin owner delete records" on public.app_records
for delete to authenticated using (
  (((select auth.jwt()) -> 'app_metadata' ->> 'flyash_access') = 'true'
    or ((select auth.jwt()) -> 'app_metadata' ->> 'role') in ('admin','owner'))
  and ((select auth.jwt()) -> 'app_metadata' ->> 'role') in ('admin','owner')
);
