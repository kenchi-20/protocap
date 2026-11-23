import { createClient } from '@supabase/supabase-js';
try {
  process.loadEnvFile?.('.env.local');
} catch {}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function test() {
  const { data, error } = await supabase.from('students').select('id').limit(1);
  console.log('Result:', JSON.stringify({ data, error }, null, 2));
}
test();
