-- This script updates the database schema to support publishing integrations.

-- Step 1: Create an ENUM type for integration providers
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'integration_provider') THEN
        CREATE TYPE integration_provider AS ENUM ('wordpress', 'medium');
    END IF;
END$$;

-- Step 2: Create the user_integrations table
CREATE TABLE IF NOT EXISTS user_integrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  provider integration_provider NOT NULL,
  credentials JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

-- Step 3: Enable RLS for the new table
ALTER TABLE user_integrations ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policies for the new table
-- Users can view their own integrations
CREATE POLICY "Users can view their own integrations"
  ON user_integrations FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own integrations
CREATE POLICY "Users can insert their own integrations"
  ON user_integrations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own integrations
CREATE POLICY "Users can update their own integrations"
  ON user_integrations FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own integrations
CREATE POLICY "Users can delete their own integrations"
  ON user_integrations FOR DELETE
  USING (auth.uid() = user_id);

-- Step 5: Add a comment to the table for clarity
COMMENT ON TABLE user_integrations IS 'Stores user credentials for third-party publishing integrations like WordPress and Medium.';