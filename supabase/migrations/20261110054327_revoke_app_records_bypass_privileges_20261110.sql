-- Keep only the row-level operations required by the FlyAsh client.
-- TRUNCATE bypasses RLS, so it must never be granted to authenticated clients.
revoke all on table public.app_records from anon;
revoke truncate, references, trigger on table public.app_records from authenticated;
grant select, insert, update, delete on table public.app_records to authenticated;
