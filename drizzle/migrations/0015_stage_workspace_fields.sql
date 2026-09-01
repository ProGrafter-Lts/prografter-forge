ALTER TABLE public.project_stages
  ADD COLUMN IF NOT EXISTS scope_detail text,
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual';

ALTER TABLE public.project_messages
  ADD COLUMN IF NOT EXISTS stage_id uuid REFERENCES public.project_stages(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS project_messages_stage_id_idx ON public.project_messages(stage_id);