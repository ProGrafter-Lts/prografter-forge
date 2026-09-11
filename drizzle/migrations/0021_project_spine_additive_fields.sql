-- Structured site diary fields (all optional; existing free-text entries unaffected)
ALTER TABLE public.stage_updates ADD COLUMN IF NOT EXISTS work_completed TEXT;
ALTER TABLE public.stage_updates ADD COLUMN IF NOT EXISTS issues_found TEXT;
ALTER TABLE public.stage_updates ADD COLUMN IF NOT EXISTS delay_reason TEXT;
ALTER TABLE public.stage_updates ADD COLUMN IF NOT EXISTS tomorrow_plan TEXT;
ALTER TABLE public.stage_updates ADD COLUMN IF NOT EXISTS programme_impact_days INTEGER;
ALTER TABLE public.stage_updates ADD COLUMN IF NOT EXISTS entry_date DATE;
ALTER TABLE public.stage_updates ADD COLUMN IF NOT EXISTS supersedes_id UUID REFERENCES public.stage_updates(id) ON DELETE SET NULL;

-- Context-aware project messages (optional links; existing messages unaffected)
ALTER TABLE public.project_messages ADD COLUMN IF NOT EXISTS variation_id UUID REFERENCES public.contract_variations(id) ON DELETE SET NULL;
ALTER TABLE public.project_messages ADD COLUMN IF NOT EXISTS site_update_id UUID REFERENCES public.stage_updates(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_project_messages_variation ON public.project_messages(variation_id);
CREATE INDEX IF NOT EXISTS idx_project_messages_site_update ON public.project_messages(site_update_id);
CREATE INDEX IF NOT EXISTS idx_stage_updates_entry_date ON public.stage_updates(entry_date);