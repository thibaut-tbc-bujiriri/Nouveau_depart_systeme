import { createClient } from '@supabase/supabase-js';

const fallbackSupabaseUrl = 'https://dcjtesrtqgtvmbmrrycu.supabase.co';
const fallbackSupabaseAnonKey = 'sb_publishable_fkGeFNXH_zPwWLVclhoTaA_OUukkp89';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() || fallbackSupabaseUrl;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || fallbackSupabaseAnonKey;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Configuration Supabase manquante. Definis VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans Vercel.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
