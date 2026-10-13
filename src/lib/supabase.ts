import { createClient, SupabaseClient } from '@supabase/supabase-js';

const FALLBACK_URL = 'https://laqpdlasfxearjtnnouu.supabase.co';
const FALLBACK_KEY = 'sb_publishable_HWGUFlrfY9nBdv8dK9ZCVg_qYuiDsOw';

let supabaseInstance: SupabaseClient | null = null;

/**
 * Remove legacy browser overrides that can silently point this deployment
 * at a different Supabase project. The deployed app uses its build-time
 * environment configuration, falling back to this project's public config.
 */
function clearLegacySupabaseOverrides() {
  try {
    localStorage.removeItem('flyash_supabase_url');
    localStorage.removeItem('flyash_supabase_anon_key');
  } catch {
    // Storage may be unavailable in restricted browser contexts.
  }
}

export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseInstance) return supabaseInstance;

  clearLegacySupabaseOverrides();
  const url = import.meta.env.VITE_SUPABASE_URL || FALLBACK_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY || FALLBACK_KEY;

  if (url && key) {
    try {
      supabaseInstance = createClient(url, key);
      return supabaseInstance;
    } catch (e) {
      console.warn('Supabase initialization error, operating in local cache mode:', e);
    }
  }
  return null;
}

/**
 * Keep this compatibility helper for callers that configure the client at
 * runtime, but never persist project overrides in browser storage.
 */
export function updateSupabaseConfig(url: string, key: string) {
  clearLegacySupabaseOverrides();
  if (url && key) {
    try {
      supabaseInstance = createClient(url, key);
    } catch (e) {
      console.warn('Invalid Supabase configuration', e);
      supabaseInstance = null;
    }
  } else {
    supabaseInstance = null;
  }
}
