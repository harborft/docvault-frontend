import { createClient } from '@supabase/supabase-js';

const supabaseUrl  = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnon = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnon) {
  throw new Error('Missing Supabase environment variables. Check your .env.local file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnon, {
  auth: {
    autoRefreshToken: true,
    persistSession:   true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    lock: (_name, _acquireTimeout, fn) => fn()
  }
});
