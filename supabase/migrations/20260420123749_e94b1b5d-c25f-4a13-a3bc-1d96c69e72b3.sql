-- Enable scheduling extensions (idempotent)
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Remove any previous schedule with this name so reruns are safe
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'planning-alerts-daily-6am') THEN
    PERFORM cron.unschedule('planning-alerts-daily-6am');
  END IF;
END $$;

-- Schedule the planning alerts edge function to run every day at 06:00 UTC
SELECT cron.schedule(
  'planning-alerts-daily-6am',
  '0 6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://xryinqaxjclcmhebdcex.supabase.co/functions/v1/process-planning-alerts',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyeWlucWF4amNsY21oZWJkY2V4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4NjQ1NDIsImV4cCI6MjA5MDQ0MDU0Mn0.EGeNrPvyYG7ncv02UTD6MOeahJQFyHRcck_BuuKfXpA"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);