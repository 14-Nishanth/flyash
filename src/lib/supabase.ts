import { createClient, SupabaseClient } from '@supabase/supabase-js';

const defaultUrl = import.meta.env.VITE_SUPABASE_URL || localStorage.getItem('flyash_supabase_url') || '';
const defaultKey = import.meta.env.VITE_SUPABASE_ANON_KEY || localStorage.getItem('flyash_supabase_anon_key') || '';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseInstance) return supabaseInstance;

  const url = import.meta.env.VITE_SUPABASE_URL || localStorage.getItem('flyash_supabase_url');
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY || localStorage.getItem('flyash_supabase_anon_key');

  if (url && key) {
    try {
      supabaseInstance = createClient(url, key);
      return supabaseInstance;
    } catch (e) {
      console.warn('Supabase initialization failed, falling back to local store', e);
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
