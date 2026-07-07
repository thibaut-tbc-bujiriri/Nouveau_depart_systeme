const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://dcjtesrtqgtvmbmrrycu.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  // Let's try to query pg_policies using RPC if pg_catalog queries are not possible
  const { data, error } = await supabase.from('pg_policies').select('*');
  console.log("pg_policies query result:", data, error);
}

run();
