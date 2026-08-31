ALTER TABLE public.stage_inspection_reports
  ADD COLUMN IF NOT EXISTS review_status text NOT NULL DEFAULT 'not_required',
  ADD COLUMN IF NOT EXISTS original_classification text,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS review_note text;

CREATE INDEX IF NOT EXISTS idx_stage_inspection_reports_review
  ON public.stage_inspection_reports(review_status);

UPDATE public.stage_inspection_reports
SET review_status = 'pending'
WHERE classification = 'MIXED' AND status = 'active' AND review_status = 'not_required';