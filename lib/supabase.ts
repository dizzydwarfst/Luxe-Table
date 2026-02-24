import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './supabase.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[LuxeTable] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. ' +
    'Supabase features will be disabled — falling back to local constants.'
  );
}

/**
 * Singleton Supabase client.
 * Returns `null` when env vars are missing so callers can fall back gracefully.
 */
export const supabase: SupabaseClient<Database> | null =
  supabaseUrl && supabaseAnonKey
    ? createClient<Database>(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          // Start with anonymous auth — upgraded later if user creates account
        },
        realtime: {
          params: {
            eventsPerSecond: 10,
          },
        },
      })
    : null;

/**
 * Helper — asserts Supabase is configured. Throws if not.
 * Use in code paths that *require* Supabase (e.g., order creation).
 */
export function requireSupabase(): SupabaseClient<Database> {
  if (!supabase) {
    throw new Error(
      'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local'
    );
  }
  return supabase;
}

/**
 * Whether Supabase is available. Use to toggle between
 * Supabase-backed features and local fallbacks.
 */
export const isSupabaseEnabled = !!supabase;
