import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function ensureSession(): Promise<string> {
  const current = await supabase.auth.getSession();
  if (current.error) throw current.error;
  if (current.data.session) return current.data.session.access_token;
  const created = await supabase.auth.signInAnonymously();
  if (created.error || !created.data.session) throw created.error ?? new Error('Could not start a private session');
  return created.data.session.access_token;
}
