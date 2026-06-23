ALTER TABLE public.job_briefs
  ADD COLUMN IF NOT EXISTS job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_job_briefs_job_id ON public.job_briefs(job_id);