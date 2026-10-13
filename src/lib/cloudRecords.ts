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
  if (metadata.flyash_access !== true && metadata.flyash_access !== 'true') {
    throw new Error('This account has not been granted FlyAsh cloud access. Ask the administrator to enable flyash_access in Supabase Auth app metadata.');
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
  const rawId = record.id;
  if (rawId === undefined || rawId === null || String(rawId).trim() === '') {
    throw new Error(`Cannot sync ${collection}: record ID is missing.`);
  }

  const { error } = await supabase.from('app_records').upsert({
    collection,
    id: String(rawId),
    data: { ...record, id: String(rawId) },
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
  const { error } = await supabase.from('app_records').upsert({
    collection,
    id: String(id),
    data: { id: String(id) },
    updated_by: user.id,
    deleted_at: new Date().toISOString(),
  }, { onConflict: 'collection,id' });
  if (error) throw new Error(`Could not delete ${collection} record from the cloud: ${error.message}`);
}

export function hasCloudAccess(user: { app_metadata?: Record<string, unknown> } | null | undefined): boolean {
  const metadata = user?.app_metadata || {};
  return metadata.flyash_access === true || metadata.flyash_access === 'true';
}

export function getCloudRole(user: { app_metadata?: Record<string, unknown> } | null | undefined): 'admin' | 'owner' | 'operator' {
  const role = user?.app_metadata?.role;
  return role === 'admin' || role === 'owner' || role === 'operator' ? role : 'operator';
}
