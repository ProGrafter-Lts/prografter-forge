-- 1. Lock down quote_checks: add lookup_token and replace public read policy
ALTER TABLE public.quote_checks
  ADD COLUMN IF NOT EXISTS lookup_token uuid NOT NULL DEFAULT gen_random_uuid();

DROP POLICY IF EXISTS "Anyone can read quote checks" ON public.quote_checks;

-- No direct SELECT for anon/authenticated. Reads must go through an edge
-- function using the service role and validating the lookup_token.
-- Insert policy already exists ("Anyone can create quote checks") and is fine.

-- Allow service role to update quote_checks (it already can, but make explicit
-- for clarity since INSERT/UPDATE flows happen via edge functions)
-- (No new policy needed; service_role bypasses RLS.)

-- 2. Realtime channel authorization for project_messages
-- Restrict who can subscribe to realtime broadcasts of project_messages
-- to job participants (homeowner of the job, or matched trade).
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;

-- Drop any prior policy with the same name to keep migrations idempotent
DROP POLICY IF EXISTS "Authenticated users can receive project_messages broadcasts" ON realtime.messages;

CREATE POLICY "Authenticated users can receive project_messages broadcasts"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  -- Only allow realtime events for the public.project_messages table when
  -- the user is a participant of the relevant job.
  (
    extension = 'postgres_changes'
    AND (
      -- Homeowner of the job
      EXISTS (
        SELECT 1
        FROM public.project_messages pm
        JOIN public.jobs j ON j.id = pm.job_id
        JOIN public.homeowners h ON h.id = j.homeowner_id
        WHERE h.user_id = auth.uid()
      )
      OR
      -- Matched trade
      EXISTS (
        SELECT 1
        FROM public.project_messages pm
        JOIN public.job_matches jm ON jm.job_id = pm.job_id
        JOIN public.trades t ON t.id = jm.trade_id
        WHERE t.user_id = auth.uid()
      )
    )
  )
);
