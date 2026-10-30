import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://urwvbrxlbrdlfumutzok.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_80PmAwlaTLF5nksTq1n-bg_GN1gLH9I';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});