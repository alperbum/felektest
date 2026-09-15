import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://efltjgimkjjtagfebmha.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_qbZn4_rrYtoyhXEyJdIb3Q_ctEOMAgE';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
