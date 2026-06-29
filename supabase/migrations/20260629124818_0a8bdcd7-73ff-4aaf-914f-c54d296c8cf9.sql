-- 1. trade_can_access_job: exclude rejected/withdrawn/declined matches
CREATE OR REPLACE FUNCTION public.trade_can_access_job(_user_id uuid, _job_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.job_matches jm
    JOIN public.trades t ON t.id = jm.trade_id
    WHERE t.user_id = _user_id
      AND jm.job_id = _job_id
      AND COALESCE(jm.status, '') NOT IN ('rejected','withdrawn','declined')
  )
$function$;

-- 2. realtime.messages policy: add status filter to trade branch
DROP POLICY IF EXISTS "Authenticated users can receive project_messages broadcasts" ON realtime.messages;
CREATE POLICY "Authenticated users can receive project_messages broadcasts"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  (extension = 'postgres_changes'::text)
  AND (topic ~~ 'project-messages-%'::text)
  AND (
    EXISTS (
      SELECT 1
      FROM (jobs j JOIN homeowners h ON ((h.id = j.homeowner_id)))
      WHERE ((h.user_id = auth.uid())
        AND ((j.id)::text = "substring"(messages.topic, 'project-messages-(.*)$'::text)))
    )
    OR EXISTS (
      SELECT 1
      FROM (job_matches jm JOIN trades t ON ((t.id = jm.trade_id)))
      WHERE ((t.user_id = auth.uid())
        AND ((jm.job_id)::text = "substring"(messages.topic, 'project-messages-(.*)$'::text))
        AND COALESCE(jm.status, '') NOT IN ('rejected','withdrawn','declined'))
    )
  )
);

-- 3. Remove third-party applicant phone from planning_alerts
ALTER TABLE public.planning_alerts DROP COLUMN IF EXISTS applicant_phone;
