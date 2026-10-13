-- Additive, non-destructive cloud record store for cross-device synchronization.
-- Existing tables and rows are intentionally left untouched.
create table if not exists public.app_records (
  collection text not null check (collection in (
    'parties','inwards','outwards','payments','partyAdjustments','jobs',
    'employees','attendance','expenses','workerGroups','productRates','settings'
  )),
  id text not null,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  deleted_at timestamptz,
  primary key (collection, id)
);

create index if not exists app_records_collection_updated_at_idx
  on public.app_records (collection, updated_at desc);
create index if not exists app_records_active_idx
  on public.app_records (collection, id) where deleted_at is null;

alter table public.app_records enable row level security;
revoke all on public.app_records from anon, public;
grant select, insert, update on public.app_records to authenticated;

drop policy if exists "FlyAsh authenticated read records" on public.app_records;
create policy "FlyAsh authenticated read records"
  on public.app_records for select to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'flyash_access') = 'true');

drop policy if exists "FlyAsh authenticated insert records" on public.app_records;
create policy "FlyAsh authenticated insert records"
  on public.app_records for insert to authenticated
  with check (
    (auth.jwt() -> 'app_metadata' ->> 'flyash_access') = 'true'
    and (updated_by is null or updated_by = auth.uid())
    and (deleted_at is null or (auth.jwt() -> 'app_metadata' ->> 'role') in ('admin','owner'))
  );

drop policy if exists "FlyAsh authenticated update records" on public.app_records;
create policy "FlyAsh authenticated update records"
  on public.app_records for update to authenticated
  using (
    (auth.jwt() -> 'app_metadata' ->> 'flyash_access') = 'true'
    and deleted_at is null
  )
  with check (
    (auth.jwt() -> 'app_metadata' ->> 'flyash_access') = 'true'
    and (updated_by is null or updated_by = auth.uid())
    and (deleted_at is null or (auth.jwt() -> 'app_metadata' ->> 'role') in ('admin','owner'))
  );

drop policy if exists "FlyAsh admin owner delete records" on public.app_records;
create policy "FlyAsh admin owner delete records"
  on public.app_records for delete to authenticated
  using (
    (auth.jwt() -> 'app_metadata' ->> 'flyash_access') = 'true'
    and (auth.jwt() -> 'app_metadata' ->> 'role') in ('admin','owner')
  );

create or replace function public.set_app_records_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists app_records_updated_at on public.app_records;
create trigger app_records_updated_at
  before update on public.app_records
  for each row execute function public.set_app_records_updated_at();

-- One-time, conflict-safe copies from the existing plural application tables.
-- ON CONFLICT DO NOTHING ensures previously synced records are never overwritten.
insert into public.app_records(collection,id,data,updated_at)
select 'parties', t.id::text, to_jsonb(t), coalesce(t.created_at, now())
from public.parties t
on conflict (collection,id) do nothing;

insert into public.app_records(collection,id,data,updated_at)
select 'expenses', t.id::text, to_jsonb(t), coalesce(t.created_at, now())
from public.expenses t
on conflict (collection,id) do nothing;

insert into public.app_records(collection,id,data,updated_at)
select 'payments', t.id::text, to_jsonb(t), coalesce(t.created_at, now())
from public.payments t
on conflict (collection,id) do nothing;

insert into public.app_records(collection,id,data,updated_at)
select 'inwards', t.id::text,
       to_jsonb(t) || jsonb_build_object(
         'id', t.id::text,
         'party_name', coalesce(substring(t.notes from '\[Party:\s*([^\]]+)\]'), 'Supplier')
       ),
       coalesce(t.created_at, now())
from public.material_inward t
on conflict (collection,id) do nothing;

insert into public.app_records(collection,id,data,updated_at)
select 'outwards', t.id::text,
       to_jsonb(t) || jsonb_build_object(
         'id', t.id::text,
         'party_name', coalesce(substring(t.notes from '\[Customer:\s*([^\]]+)\]'), 'Customer')
       ),
       coalesce(t.created_at, now())
from public.material_outward t
on conflict (collection,id) do nothing;

insert into public.app_records(collection,id,data,updated_at)
select 'jobs', t.id::text, to_jsonb(t), coalesce(t.created_at, now())
from public.job_wage_entries t
on conflict (collection,id) do nothing;

insert into public.app_records(collection,id,data,updated_at)
select 'employees', t.id::text, to_jsonb(t), coalesce(t.created_at, now())
from public.employees t
on conflict (collection,id) do nothing;

insert into public.app_records(collection,id,data,updated_at)
select 'attendance', t.id::text,
       to_jsonb(t) || jsonb_build_object(
         'id', t.id::text,
         'employee_id', t.employee_id::text,
         'employee_name', coalesce(e.name, '')
       ),
       coalesce(t.date::timestamptz, now())
from public.attendance t
left join public.employee e on e.id = t.employee_id
on conflict (collection,id) do nothing;

-- Keep existing voucher/payment history and expose adjustment rows to the new client.
insert into public.app_records(collection,id,data,updated_at)
select 'partyAdjustments', t.id::text,
       jsonb_build_object(
         'id', t.id::text,
         'date', t.date,
         'party_id', coalesce(t.party_id::text, ''),
         'party_name', coalesce(t.party_name, ''),
         'voucher_type', case when t.payment_type = 'received' then 'credit' else 'debit' end,
         'category', coalesce(substring(t.notes from '\[Voucher:\s*(.+?)\]'), 'Balance Adjustment'),
         'amount', t.amount,
         'payment_mode', 'adjustment',
         'reference_no', coalesce(t.reference_no, ''),
         'notes', trim(regexp_replace(coalesce(t.notes, ''), '\[Voucher:\s*.+?\]', '', 'g')),
         'created_at', t.created_at
       ),
       coalesce(t.created_at, now())
from public.payments t
where t.mode = 'adjustment' or coalesce(t.notes, '') like '%[Voucher:%'
on conflict (collection,id) do nothing;

-- Enable Realtime for the shared record store, only if it is not already published.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'app_records'
     ) then
    alter publication supabase_realtime add table public.app_records;
  end if;
end $$;
