import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function run() {
  console.log('Testing admin.updateUserById...');
  const { data, error } = await supabase.auth.admin.updateUserById(
    '422c80fa-f1a7-42c7-8781-4da16874dc39',
    { password: 'TmpPass@2026' }
  );

  if (error) {
    console.log('Admin Auth Error:', error.message);
  } else {
    console.log('Successfully updated password for user:', data.user.id);
  }
}

run();
