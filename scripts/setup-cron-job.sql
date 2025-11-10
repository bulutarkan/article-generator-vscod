-- Enable extensions (if not already enabled)
-- Note: These may need to be enabled in Supabase dashboard first under Database > Extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS http;

-- Create cron job to process article tasks every 30 seconds
SELECT cron.schedule(
  'process-article-tasks',
  '*/30 * * * * *', -- Every 30 seconds
  $$
  SELECT net.http_post(
    'https://vxeibodohqvxomrefhxy.supabase.co/functions/v1/process-article-tasks',
    '{}',
    '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4ZWlib2RvaHF2eG9tcmVmaHh5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjU0MTI5NiwiZXhwIjoyMDcyMTE3Mjk2fQ.Y2lYEQ1sFSmZ4q2h1OvicVZHcYyqrLP1Jyj3-ZpKvpo"}'
  );
  $$
);

-- To unschedule the job later if needed:
-- SELECT cron.unschedule('process-article-tasks');

-- To view scheduled jobs:
-- SELECT * FROM cron.job;
