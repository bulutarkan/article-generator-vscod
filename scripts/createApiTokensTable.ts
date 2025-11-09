import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey || !serviceRoleKey) {
  throw new Error('Missing Supabase environment variables');
}

// Use service role key for admin operations
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function createApiTokensTable() {
  console.log('Creating user_api_tokens table...');

  try {
    // Test if table already exists
    const { data: existingTable, error: checkError } = await supabase
      .from('user_api_tokens')
      .select('id')
      .limit(1);

    if (!checkError) {
      console.log('✅ user_api_tokens table already exists');
      return;
    }

    // Since we can't create tables directly from client, we'll create a simple test record
    // The table should be created manually in Supabase dashboard or via SQL
    console.log('⚠️  Table creation requires manual setup in Supabase dashboard');
    console.log('Please run this SQL in your Supabase SQL editor:');

    const sql = `
CREATE TABLE IF NOT EXISTS user_api_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_api_tokens_user_id ON user_api_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_user_api_tokens_token ON user_api_tokens(token);

-- Enable RLS
ALTER TABLE user_api_tokens ENABLE ROW LEVEL SECURITY;

      -- Create policies (allow service role to bypass RLS)
      CREATE POLICY "Users can view their own API tokens" ON user_api_tokens
        FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'service_role');

      CREATE POLICY "Users can insert their own API tokens" ON user_api_tokens
        FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');

      CREATE POLICY "Users can update their own API tokens" ON user_api_tokens
        FOR UPDATE USING (auth.uid() = user_id OR auth.role() = 'service_role');

      CREATE POLICY "Users can delete their own API tokens" ON user_api_tokens
        FOR DELETE USING (auth.uid() = user_id OR auth.role() = 'service_role');
`;

    console.log(sql);

  } catch (error) {
    console.error('Failed to check/create table:', error);
  }
}

createApiTokensTable().catch(console.error);
