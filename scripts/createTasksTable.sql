-- Create article generation tasks table
CREATE TABLE IF NOT EXISTS article_generation_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  topic TEXT NOT NULL,
  country TEXT NOT NULL,
  tone TEXT NOT NULL,
  brief TEXT,
  article_data JSONB,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_article_generation_tasks_user_id ON article_generation_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_article_generation_tasks_task_id ON article_generation_tasks(task_id);
CREATE INDEX IF NOT EXISTS idx_article_generation_tasks_status ON article_generation_tasks(status);

-- Enable RLS
ALTER TABLE article_generation_tasks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own tasks" ON article_generation_tasks;
DROP POLICY IF EXISTS "Users can insert their own tasks" ON article_generation_tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON article_generation_tasks;
DROP POLICY IF EXISTS "Users can delete their own tasks" ON article_generation_tasks;
DROP POLICY IF EXISTS "Service role can do everything" ON article_generation_tasks;

-- Create policies (allow service role to bypass RLS)
CREATE POLICY "Service role can do everything" ON article_generation_tasks
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can view their own tasks" ON article_generation_tasks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tasks" ON article_generation_tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks" ON article_generation_tasks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks" ON article_generation_tasks
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to mark tasks as processing (trigger-based background processing)
CREATE OR REPLACE FUNCTION process_article_generation_task()
RETURNS TRIGGER AS $$
BEGIN
    -- Only process if status is 'pending'
    IF NEW.status = 'pending' THEN
        -- Update status to processing (ready for background worker)
        UPDATE article_generation_tasks
        SET status = 'processing', updated_at = NOW()
        WHERE id = NEW.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically process tasks
CREATE TRIGGER trigger_process_article_generation_task
    AFTER INSERT ON article_generation_tasks
    FOR EACH ROW
    EXECUTE FUNCTION process_article_generation_task();
