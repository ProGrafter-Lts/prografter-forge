
-- Shared status filter helper expression is inlined as:
--   COALESCE(jm.status,'') NOT IN ('rejected','withdrawn','declined')

-- 1. green_project_data
DROP POLICY IF EXISTS "Trades can manage green data for matched jobs" ON public.green_project_data;
CREATE POLICY "Trades can manage green data for matched jobs" ON public.green_project_data
FOR ALL
USING (job_id IN (SELECT jm.job_id FROM job_matches jm WHERE jm.trade_id IN (SELECT t.id FROM trades t WHERE t.user_id = auth.uid()) AND COALESCE(jm.status,'') NOT IN ('rejected','withdrawn','declined')))
WITH CHECK (job_id IN (SELECT jm.job_id FROM job_matches jm WHERE jm.trade_id IN (SELECT t.id FROM trades t WHERE t.user_id = auth.uid()) AND COALESCE(jm.status,'') NOT IN ('rejected','withdrawn','declined')));

-- 2. job_photos
DROP POLICY IF EXISTS "Trades can view photos for matched jobs" ON public.job_photos;
CREATE POLICY "Trades can view photos for matched jobs" ON public.job_photos
FOR SELECT
USING (job_id IN (SELECT jm.job_id FROM job_matches jm WHERE jm.trade_id IN (SELECT t.id FROM trades t WHERE t.user_id = auth.uid()) AND COALESCE(jm.status,'') NOT IN ('rejected','withdrawn','declined')));

DROP POLICY IF EXISTS "Trades can insert photos for matched jobs" ON public.job_photos;
CREATE POLICY "Trades can insert photos for matched jobs" ON public.job_photos
FOR INSERT
WITH CHECK (job_id IN (SELECT jm.job_id FROM job_matches jm WHERE jm.trade_id IN (SELECT t.id FROM trades t WHERE t.user_id = auth.uid()) AND COALESCE(jm.status,'') NOT IN ('rejected','withdrawn','declined')));

-- 3. materials_log
DROP POLICY IF EXISTS "Trades can view materials for matched jobs" ON public.materials_log;
CREATE POLICY "Trades can view materials for matched jobs" ON public.materials_log
FOR SELECT
USING (trade_id IN (SELECT t.id FROM trades t WHERE t.user_id = auth.uid())
  AND job_id IN (SELECT jm.job_id FROM job_matches jm WHERE jm.trade_id IN (SELECT t.id FROM trades t WHERE t.user_id = auth.uid()) AND COALESCE(jm.status,'') NOT IN ('rejected','withdrawn','declined')));

DROP POLICY IF EXISTS "Trades can insert materials for matched jobs" ON public.materials_log;
CREATE POLICY "Trades can insert materials for matched jobs" ON public.materials_log
FOR INSERT
WITH CHECK (trade_id IN (SELECT t.id FROM trades t WHERE t.user_id = auth.uid())
  AND job_id IN (SELECT jm.job_id FROM job_matches jm WHERE jm.trade_id IN (SELECT t.id FROM trades t WHERE t.user_id = auth.uid()) AND COALESCE(jm.status,'') NOT IN ('rejected','withdrawn','declined')));

-- 4. project_certificates
DROP POLICY IF EXISTS "Trades can view certs for matched jobs" ON public.project_certificates;
CREATE POLICY "Trades can view certs for matched jobs" ON public.project_certificates
FOR SELECT
USING (job_id IN (SELECT jm.job_id FROM job_matches jm WHERE jm.trade_id IN (SELECT t.id FROM trades t WHERE t.user_id = auth.uid()) AND COALESCE(jm.status,'') NOT IN ('rejected','withdrawn','declined')));

DROP POLICY IF EXISTS "Trades can insert certs for matched jobs" ON public.project_certificates;
CREATE POLICY "Trades can insert certs for matched jobs" ON public.project_certificates
FOR INSERT
WITH CHECK (job_id IN (SELECT jm.job_id FROM job_matches jm WHERE jm.trade_id IN (SELECT t.id FROM trades t WHERE t.user_id = auth.uid()) AND COALESCE(jm.status,'') NOT IN ('rejected','withdrawn','declined')));

-- 5. project_messages
DROP POLICY IF EXISTS "Trades can view messages for matched jobs" ON public.project_messages;
CREATE POLICY "Trades can view messages for matched jobs" ON public.project_messages
FOR SELECT
USING (job_id IN (SELECT jm.job_id FROM job_matches jm WHERE jm.trade_id IN (SELECT t.id FROM trades t WHERE t.user_id = auth.uid()) AND COALESCE(jm.status,'') NOT IN ('rejected','withdrawn','declined')));

DROP POLICY IF EXISTS "Trades can send messages on matched jobs" ON public.project_messages;
CREATE POLICY "Trades can send messages on matched jobs" ON public.project_messages
FOR INSERT
WITH CHECK ((sender_type = 'trade'::text)
  AND (sender_id IN (SELECT trades.id FROM trades WHERE trades.user_id = auth.uid()))
  AND (job_id IN (SELECT jm.job_id FROM job_matches jm WHERE jm.trade_id IN (SELECT t.id FROM trades t WHERE t.user_id = auth.uid()) AND COALESCE(jm.status,'') NOT IN ('rejected','withdrawn','declined'))));

-- 6. project_stages
DROP POLICY IF EXISTS "Trades can view stages for matched jobs" ON public.project_stages;
CREATE POLICY "Trades can view stages for matched jobs" ON public.project_stages
FOR SELECT
USING (job_id IN (SELECT jm.job_id FROM job_matches jm WHERE jm.trade_id IN (SELECT t.id FROM trades t WHERE t.user_id = auth.uid()) AND COALESCE(jm.status,'') NOT IN ('rejected','withdrawn','declined')));

DROP POLICY IF EXISTS "Trades can update stages for matched jobs" ON public.project_stages;
CREATE POLICY "Trades can update stages for matched jobs" ON public.project_stages
FOR UPDATE
USING (job_id IN (SELECT jm.job_id FROM job_matches jm WHERE jm.trade_id IN (SELECT t.id FROM trades t WHERE t.user_id = auth.uid()) AND COALESCE(jm.status,'') NOT IN ('rejected','withdrawn','declined')));

-- 7. project_warranties
DROP POLICY IF EXISTS "Trades can view own warranties" ON public.project_warranties;
CREATE POLICY "Trades can view own warranties" ON public.project_warranties
FOR SELECT
USING (trade_id IN (SELECT t.id FROM trades t WHERE t.user_id = auth.uid())
  AND job_id IN (SELECT jm.job_id FROM job_matches jm WHERE jm.trade_id IN (SELECT t.id FROM trades t WHERE t.user_id = auth.uid()) AND COALESCE(jm.status,'') NOT IN ('rejected','withdrawn','declined')));

DROP POLICY IF EXISTS "Trades can insert warranties for matched jobs" ON public.project_warranties;
CREATE POLICY "Trades can insert warranties for matched jobs" ON public.project_warranties
FOR INSERT
WITH CHECK (trade_id IN (SELECT t.id FROM trades t WHERE t.user_id = auth.uid())
  AND job_id IN (SELECT jm.job_id FROM job_matches jm WHERE jm.trade_id IN (SELECT t.id FROM trades t WHERE t.user_id = auth.uid()) AND COALESCE(jm.status,'') NOT IN ('rejected','withdrawn','declined')));

-- 8. stage_updates
DROP POLICY IF EXISTS "Trades can view updates for matched jobs" ON public.stage_updates;
CREATE POLICY "Trades can view updates for matched jobs" ON public.stage_updates
FOR SELECT
USING (stage_id IN (SELECT ps.id FROM project_stages ps JOIN job_matches jm ON jm.job_id = ps.job_id
  WHERE jm.trade_id IN (SELECT t.id FROM trades t WHERE t.user_id = auth.uid()) AND COALESCE(jm.status,'') NOT IN ('rejected','withdrawn','declined')));

DROP POLICY IF EXISTS "Trades can insert updates for matched stages" ON public.stage_updates;
CREATE POLICY "Trades can insert updates for matched stages" ON public.stage_updates
FOR INSERT
WITH CHECK ((trade_id IN (SELECT trades.id FROM trades WHERE trades.user_id = auth.uid()))
  AND (stage_id IN (SELECT ps.id FROM project_stages ps JOIN job_matches jm ON jm.job_id = ps.job_id
    WHERE jm.trade_id IN (SELECT t.id FROM trades t WHERE t.user_id = auth.uid()) AND COALESCE(jm.status,'') NOT IN ('rejected','withdrawn','declined'))));

-- 9. variations
DROP POLICY IF EXISTS "Trades can view own variations" ON public.variations;
CREATE POLICY "Trades can view own variations" ON public.variations
FOR SELECT
USING (trade_id IN (SELECT t.id FROM trades t WHERE t.user_id = auth.uid())
  AND job_id IN (SELECT jm.job_id FROM job_matches jm WHERE jm.trade_id IN (SELECT t.id FROM trades t WHERE t.user_id = auth.uid()) AND COALESCE(jm.status,'') NOT IN ('rejected','withdrawn','declined')));

DROP POLICY IF EXISTS "Trades can insert variations on matched jobs" ON public.variations;
CREATE POLICY "Trades can insert variations on matched jobs" ON public.variations
FOR INSERT
WITH CHECK ((trade_id IN (SELECT trades.id FROM trades WHERE trades.user_id = auth.uid()))
  AND (job_id IN (SELECT jm.job_id FROM job_matches jm WHERE jm.trade_id IN (SELECT t.id FROM trades t WHERE t.user_id = auth.uid()) AND COALESCE(jm.status,'') NOT IN ('rejected','withdrawn','declined'))));

-- 10. sub_trade_assignments (main trade policies)
DROP POLICY IF EXISTS "Main trades can view own sub assignments" ON public.sub_trade_assignments;
CREATE POLICY "Main trades can view own sub assignments" ON public.sub_trade_assignments
FOR SELECT
USING (main_trade_id IN (SELECT t.id FROM trades t WHERE t.user_id = auth.uid())
  AND job_id IN (SELECT jm.job_id FROM job_matches jm WHERE jm.trade_id IN (SELECT t.id FROM trades t WHERE t.user_id = auth.uid()) AND COALESCE(jm.status,'') NOT IN ('rejected','withdrawn','declined')));

DROP POLICY IF EXISTS "Main trades can insert own sub assignments" ON public.sub_trade_assignments;
CREATE POLICY "Main trades can insert own sub assignments" ON public.sub_trade_assignments
FOR INSERT
WITH CHECK (main_trade_id IN (SELECT t.id FROM trades t WHERE t.user_id = auth.uid())
  AND job_id IN (SELECT jm.job_id FROM job_matches jm WHERE jm.trade_id IN (SELECT t.id FROM trades t WHERE t.user_id = auth.uid()) AND COALESCE(jm.status,'') NOT IN ('rejected','withdrawn','declined')));

DROP POLICY IF EXISTS "Main trades can update own sub assignments" ON public.sub_trade_assignments;
CREATE POLICY "Main trades can update own sub assignments" ON public.sub_trade_assignments
FOR UPDATE
USING (main_trade_id IN (SELECT t.id FROM trades t WHERE t.user_id = auth.uid())
  AND job_id IN (SELECT jm.job_id FROM job_matches jm WHERE jm.trade_id IN (SELECT t.id FROM trades t WHERE t.user_id = auth.uid()) AND COALESCE(jm.status,'') NOT IN ('rejected','withdrawn','declined')))
WITH CHECK (main_trade_id IN (SELECT t.id FROM trades t WHERE t.user_id = auth.uid())
  AND job_id IN (SELECT jm.job_id FROM job_matches jm WHERE jm.trade_id IN (SELECT t.id FROM trades t WHERE t.user_id = auth.uid()) AND COALESCE(jm.status,'') NOT IN ('rejected','withdrawn','declined')));

-- 11. user_is_job_participant (disputes / dispute_events / dispute_evidence)
CREATE OR REPLACE FUNCTION public.user_is_job_participant(_user_id uuid, _job_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.jobs j
    JOIN public.homeowners h ON h.id = j.homeowner_id
    WHERE j.id = _job_id AND h.user_id = _user_id
  ) OR EXISTS (
    SELECT 1 FROM public.job_matches jm
    JOIN public.trades t ON t.id = jm.trade_id
    WHERE jm.job_id = _job_id AND t.user_id = _user_id
      AND COALESCE(jm.status,'') NOT IN ('rejected','withdrawn','declined')
  );
$function$;

-- 12. storage: Matched trades can read job photos
DROP POLICY IF EXISTS "Matched trades can read job photos" ON storage.objects;
CREATE POLICY "Matched trades can read job photos" ON storage.objects
FOR SELECT
USING ((bucket_id = 'job-photos'::text) AND (
  (((storage.foldername(name))[1] = 'updates'::text) AND (EXISTS (
    SELECT 1 FROM ((project_stages ps JOIN job_matches jm ON jm.job_id = ps.job_id) JOIN trades t ON t.id = jm.trade_id)
    WHERE ((ps.id)::text = (storage.foldername(objects.name))[2]) AND t.user_id = auth.uid()
      AND COALESCE(jm.status,'') NOT IN ('rejected','withdrawn','declined'))))
  OR (EXISTS (
    SELECT 1 FROM (((jobs j JOIN homeowners h ON h.id = j.homeowner_id) JOIN job_matches jm ON jm.job_id = j.id) JOIN trades t ON t.id = jm.trade_id)
    WHERE ((h.user_id)::text = (storage.foldername(objects.name))[1]) AND t.user_id = auth.uid()
      AND COALESCE(jm.status,'') NOT IN ('rejected','withdrawn','declined')))
));

-- 13. storage: Matched trades can upload stage update photos
DROP POLICY IF EXISTS "Matched trades can upload stage update photos" ON storage.objects;
CREATE POLICY "Matched trades can upload stage update photos" ON storage.objects
FOR INSERT
WITH CHECK ((bucket_id = 'job-photos'::text) AND ((storage.foldername(name))[1] = 'updates'::text) AND (EXISTS (
  SELECT 1 FROM ((project_stages ps JOIN job_matches jm ON jm.job_id = ps.job_id) JOIN trades t ON t.id = jm.trade_id)
  WHERE ((ps.id)::text = (storage.foldername(objects.name))[2]) AND t.user_id = auth.uid()
    AND COALESCE(jm.status,'') NOT IN ('rejected','withdrawn','declined'))));
