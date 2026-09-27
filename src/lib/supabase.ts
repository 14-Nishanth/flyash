import { createClient, SupabaseClient } from '@supabase/supabase-js';

const FALLBACK_URL = 'https://laqpdlasfxearjtnnouu.supabase.co';
const FALLBACK_KEY = 'sb_publishable_HWGUFlrfY9nBdv8dK9ZCVg_qYuiDsOw';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseInstance) return supabaseInstance;

  const url = import.meta.env.VITE_SUPABASE_URL || localStorage.getItem('flyash_supabase_url') || FALLBACK_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY || localStorage.getItem('flyash_supabase_anon_key') || FALLBACK_KEY;

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

export function updateSupabaseConfig(url: string, key: string) {
  localStorage.setItem('flyash_supabase_url', url);
  localStorage.setItem('flyash_supabase_anon_key', key);
  if (url && key) {
    try {
      supabaseInstance = createClient(url, key);
    } catch (e) {
      console.warn('Invalid Supabase configuration', e);
    }
  } else {
    supabaseInstance = null;
  }
}
