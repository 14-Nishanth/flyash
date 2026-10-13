import type { SupabaseClient } from '@supabase/supabase-js';

export const CLOUD_COLLECTIONS = [
  'parties',
  'inwards',
  'outwards',
  'payments',
  'partyAdjustments',
  'jobs',
  'employees',
  'attendance',
  'expenses',
  'workerGroups',
  'productRates',
  'settings',
] as const;

export type CloudCollection = (typeof CLOUD_COLLECTIONS)[number];

const LOCAL_ONLY_SETTING_KEYS = [
  'telegram_bot_token',
  'telegram_chat_id',
  'email_service_id',
  'email_template_id',
  'email_public_key',
  'smtp_password',
  'smtp_user',
  'api_key',
  'webhook_url',
  'supabase_url',
  'supabase_anon_key',
] as const;

export function sanitizeCloudRecord(collection: CloudCollection, record: Record<string, unknown>): Record<string, unknown> {
  const safe = { ...record };
  if (collection === 'settings') {
    for (const key of LOCAL_ONLY_SETTING_KEYS) delete safe[key];
  }
  return safe;
}

export interface CloudRecordRow {
  collection: CloudCollection;
  id: string;
  data: Record<string, unknown>;
  deleted_at: string | null;
  updated_at: string;
}

async function requireSignedInUser(supabase: SupabaseClient) {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw new Error(`Cloud authentication failed: ${error.message}`);
  if (!data.user) throw new Error('Sign in with your company account to sync data across devices.');
  const metadata = data.user.app_metadata || {};
  // The role is also server-controlled Auth app metadata. Accept admin/owner
  // as an explicit grant in case an existing user's access flag was not
  // included in an older JWT, while continuing to reject ordinary accounts.
  const role = String(metadata.role || '').toLowerCase();
  const accessGranted = metadata.flyash_access === true || metadata.flyash_access === 'true';
  if (!accessGranted && role !== 'admin' && role !== 'owner') {
    throw new Error('This account has not been granted FlyAsh cloud access. Ask the administrator to enable access in Supabase Auth app metadata.');
  }
  return data.user;
}

export async function readCloudRecords(supabase: SupabaseClient): Promise<CloudRecordRow[]> {
  await requireSignedInUser(supabase);
  const { data, error } = await supabase
    .from('app_records')
    .select('collection,id,data,deleted_at,updated_at')
    .order('updated_at', { ascending: true });
  if (error) throw new Error(`Could not read shared cloud data: ${error.message}`);
  return (data || []) as CloudRecordRow[];
}

export async function saveCloudRecord(
  supabase: SupabaseClient,
  collection: CloudCollection,
  record: Record<string, unknown>,
): Promise<void> {
  const user = await requireSignedInUser(supabase);
  const safeRecord = sanitizeCloudRecord(collection, record);
  const rawId = safeRecord.id;
  if (rawId === undefined || rawId === null || String(rawId).trim() === '') {
    throw new Error(`Cannot sync ${collection}: record ID is missing.`);
  }

  const { error } = await supabase.from('app_records').upsert({
    collection,
    id: String(rawId),
    data: { ...safeRecord, id: String(rawId) },
    updated_by: user.id,
    deleted_at: null,
  }, { onConflict: 'collection,id' });

  if (error) throw new Error(`Could not save ${collection} to the cloud: ${error.message}`);
}

export async function softDeleteCloudRecord(
  supabase: SupabaseClient,
  collection: CloudCollection,
  id: string,
): Promise<void> {
  const user = await requireSignedInUser(supabase);
  const key = String(id);

  // Preserve the original payload as a recoverable tombstone instead of replacing it with { id }.
  const { data: existing, error: lookupError } = await supabase
    .from('app_records')
    .select('id,deleted_at')
    .eq('collection', collection)
    .eq('id', key)
    .maybeSingle();
  if (lookupError) throw new Error(`Could not check ${collection} record before delete: ${lookupError.message}`);
  if (existing?.deleted_at) return;

  if (existing) {
    const { error } = await supabase
      .from('app_records')
      .update({ deleted_at: new Date().toISOString(), updated_by: user.id })
      .eq('collection', collection)
      .eq('id', key);
    if (error) throw new Error(`Could not delete ${collection} record from the cloud: ${error.message}`);
    return;
  }

  // This branch is for a locally-created record deleted before it was ever uploaded.
  const { error } = await supabase.from('app_records').insert({
    collection,
    id: key,
    data: { id: key },
    updated_by: user.id,
    deleted_at: new Date().toISOString(),
  });
  if (error) throw new Error(`Could not create ${collection} delete marker in the cloud: ${error.message}`);
}

export function hasCloudAccess(user: { app_metadata?: Record<string, unknown> } | null | undefined): boolean {
  const metadata = user?.app_metadata || {};
  const role = String(metadata.role || '').toLowerCase();
  return metadata.flyash_access === true ||
    metadata.flyash_access === 'true' ||
    role === 'admin' ||
    role === 'owner';
}

export function getCloudRole(user: { app_metadata?: Record<string, unknown> } | null | undefined): 'admin' | 'owner' | 'operator' {
  const role = user?.app_metadata?.role;
  return role === 'admin' || role === 'owner' || role === 'operator' ? role : 'operator';
}
