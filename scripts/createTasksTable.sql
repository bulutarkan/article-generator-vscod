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

-- Create policies (allow service role to bypass RLS)
CREATE POLICY "Users can view their own tasks" ON article_generation_tasks
  FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "Users can insert their own tasks" ON article_generation_tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "Users can update their own tasks" ON article_generation_tasks
  FOR UPDATE USING (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "Users can delete their own tasks" ON article_generation_tasks
  FOR DELETE USING (auth.uid() = user_id OR auth.role() = 'service_role');
