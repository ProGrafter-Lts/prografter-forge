-- 1. Batch grouping for site photos
ALTER TABLE public.job_photos ADD COLUMN IF NOT EXISTS batch_id uuid;
CREATE INDEX IF NOT EXISTS job_photos_batch_id_idx ON public.job_photos(batch_id);

-- 2. Replies to a photo batch (site diary inbox)
CREATE TABLE IF NOT EXISTS public.job_photo_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  batch_id uuid NOT NULL,
  author_user_id uuid NOT NULL,
  author_role text NOT NULL DEFAULT 'homeowner',
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS job_photo_replies_job_idx ON public.job_photo_replies(job_id, batch_id);

GRANT SELECT, INSERT ON public.job_photo_replies TO authenticated;
GRANT ALL ON public.job_photo_replies TO service_role;

ALTER TABLE public.job_photo_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Homeowners can view replies on own jobs"
ON public.job_photo_replies FOR SELECT TO authenticated
USING (job_id IN (SELECT j.id FROM public.jobs j
  WHERE j.homeowner_id IN (SELECT h.id FROM public.homeowners h WHERE h.user_id = auth.uid())));

CREATE POLICY "Trades can view replies on matched jobs"
ON public.job_photo_replies FOR SELECT TO authenticated
USING (job_id IN (SELECT jm.job_id FROM public.job_matches jm
  WHERE jm.trade_id IN (SELECT t.id FROM public.trades t WHERE t.user_id = auth.uid())
    AND COALESCE(jm.status,'') NOT IN ('rejected','withdrawn','declined')));

CREATE POLICY "Homeowners can add replies on own jobs"
ON public.job_photo_replies FOR INSERT TO authenticated
WITH CHECK (author_user_id = auth.uid() AND job_id IN (SELECT j.id FROM public.jobs j
  WHERE j.homeowner_id IN (SELECT h.id FROM public.homeowners h WHERE h.user_id = auth.uid())));

CREATE POLICY "Trades can add replies on matched jobs"
ON public.job_photo_replies FOR INSERT TO authenticated
WITH CHECK (author_user_id = auth.uid() AND job_id IN (SELECT jm.job_id FROM public.job_matches jm
  WHERE jm.trade_id IN (SELECT t.id FROM public.trades t WHERE t.user_id = auth.uid())
    AND COALESCE(jm.status,'') NOT IN ('rejected','withdrawn','declined')));

CREATE POLICY "Admins can manage photo replies"
ON public.job_photo_replies FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));