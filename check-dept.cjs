const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://dcjtesrtqgtvmbmrrycu.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { data, error } = await supabase.from('departments').select('*').eq('name', 'Media');
  if (error) {
    console.error("Error fetching Media department:", error);
    return;
  }
  console.log("Media department row:", data);
}

run();
