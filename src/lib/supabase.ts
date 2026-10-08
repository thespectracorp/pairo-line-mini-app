import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    if (!client) {
      const url = import.meta.env.VITE_SUPABASE_URL;
      const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
      if (!url || !key) throw new Error('Supabase environment variables are not configured.');
      client = createClient(url, key);
    }
    const value = Reflect.get(client, prop);
    return typeof value === 'function' ? value.bind(client) : value;
  },
});

export async function ensureSession(): Promise<string> {
  const current = await supabase.auth.getSession();
  if (current.error) throw current.error;
  if (current.data.session) return current.data.session.access_token;
  const created = await supabase.auth.signInAnonymously();
  if (created.error || !created.data.session) throw created.error ?? new Error('Could not start a private session');
  return created.data.session.access_token;
}
