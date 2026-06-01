ALTER TABLE public.job_briefs
  ADD COLUMN IF NOT EXISTS needs_scoping boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS needs_planning_guidance boolean NOT NULL DEFAULT false;