import {createClient} from '@supabase/supabase-js';

let _supabaseAdmin: ReturnType<typeof createClient> | null = null;

export function getSupabaseAdmin() {
  if (_supabaseAdmin) return _supabaseAdmin;

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) throw new Error('SUPABASE_URL is required');
  if (!supabaseServiceRoleKey)
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');

  _supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
  return _supabaseAdmin;
}
