// ─────────────────────────────────────────────────────────────
// Supabase client — shared by the booking form and the dashboard.
// Configured via NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY.
// ─────────────────────────────────────────────────────────────
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseConfigured = !!(url && anonKey);

export const supabase = supabaseConfigured
  ? createClient(url, anonKey, { auth: { persistSession: false } })
  : null;

export const BOOKINGS_TABLE = 'bookings';
