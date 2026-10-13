-- Preserve rows from the legacy singular schema in the new shared store.
-- Existing legacy tables are not changed or deleted; duplicate IDs are ignored safely.
insert into public.app_records(collection,id,data,updated_at)
select 'parties', t.id::text, to_jsonb(t) || jsonb_build_object('id', t.id::text), coalesce(t.created_at, now())
from public.party t
on conflict (collection,id) do nothing;

insert into public.app_records(collection,id,data,updated_at)
select 'employees', t.id::text, to_jsonb(t) || jsonb_build_object('id', t.id::text), coalesce(t.created_at, now())
from public.employee t
on conflict (collection,id) do nothing;

-- Import only non-secret settings. Provider credentials remain in each browser's local settings.
insert into public.app_records(collection,id,data,updated_at)
select
  'settings',
  'global',
  jsonb_build_object(
    'id', 'global',
    'owner_name', coalesce(t.owner_name, 'Plant Owner'),
    'owner_phone', coalesce(t.phone_number, ''),
    'owner_email', coalesce(t.owner_email, ''),
    'owner_whatsapp', coalesce(t.phone_number, ''),
    'alert_channel_email', coalesce(t.email_alerts_enabled, false),
    'alert_channel_telegram', coalesce(nullif(t.telegram_bot_token, ''), '') <> '',
    'alert_channel_whatsapp', case when t.channel = 'whatsapp' then coalesce(t.is_enabled, true) else true end,
    'alert_wrong_password_enabled', coalesce(t.alert_on_failed_attempts, true),
    'daily_digest_enabled', coalesce(t.daily_digest_enabled, true),
    'daily_digest_time', coalesce(t.daily_digest_time, '19:00'),
    'max_alerts_per_day', coalesce(t.max_alerts_per_day, 10)
  ),
  coalesce(t.updated_at, now())
from public.alert_settings t
order by t.id asc
limit 1
on conflict (collection,id) do nothing;
