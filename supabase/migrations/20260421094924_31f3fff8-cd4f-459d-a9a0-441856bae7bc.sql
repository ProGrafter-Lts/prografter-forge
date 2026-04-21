-- Tighten realtime broadcast access to scope by the per-job channel topic
-- (clients subscribe to "project-messages-{job_id}").

DROP POLICY IF EXISTS "Authenticated users can receive project_messages broadcasts" ON realtime.messages;

CREATE POLICY "Authenticated users can receive project_messages broadcasts"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  extension = 'postgres_changes'
  AND topic LIKE 'project-messages-%'
  AND (
    -- Homeowner of THIS specific job (job id = topic suffix)
    EXISTS (
      SELECT 1
      FROM public.jobs j
      JOIN public.homeowners h ON h.id = j.homeowner_id
      WHERE h.user_id = auth.uid()
        AND j.id::text = substring(realtime.messages.topic from 'project-messages-(.*)$')
    )
    OR
    -- Matched trade for THIS specific job
    EXISTS (
      SELECT 1
      FROM public.job_matches jm
      JOIN public.trades t ON t.id = jm.trade_id
      WHERE t.user_id = auth.uid()
        AND jm.job_id::text = substring(realtime.messages.topic from 'project-messages-(.*)$')
    )
  )
);