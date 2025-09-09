-- This script updates the database schema to support the Content Calendar feature.

-- Step 1: Create an ENUM type for event statuses
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'calendar_event_status') THEN
        CREATE TYPE calendar_event_status AS ENUM ('planned', 'in_progress', 'completed', 'cancelled');
    END IF;
END$$;

-- Step 2: Create the calendar_events table
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  status calendar_event_status NOT NULL DEFAULT 'planned',
  article_id UUID REFERENCES articles(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 3: Enable RLS for the new table
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policies for the new table
CREATE POLICY "Users can manage their own calendar events"
  ON calendar_events FOR ALL
  USING (auth.uid() = user_id);

-- Step 5: Add comments for clarity
COMMENT ON TABLE calendar_events IS 'Stores events for the user content calendar.';
COMMENT ON COLUMN calendar_events.status IS 'The current status of the content idea/event.';
