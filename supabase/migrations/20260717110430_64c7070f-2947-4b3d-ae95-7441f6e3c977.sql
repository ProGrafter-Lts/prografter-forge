
-- ================================================================
-- ATLAS — construction site-survey module (vertical slice)
-- ================================================================

-- 1. atlas_surveys ------------------------------------------------
CREATE TABLE public.atlas_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,

  -- Project (hybrid: use job when linked, otherwise these fields)
  project_title TEXT NOT NULL,
  project_type TEXT NOT NULL,
  property_address TEXT,
  postcode TEXT,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  customer_intent TEXT,

  -- Survey setup
  survey_type TEXT NOT NULL DEFAULT 'full_site',
  relevant_trades TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  start_route TEXT NOT NULL DEFAULT 'outside' CHECK (start_route IN ('outside','inside')),
  customer_present BOOLEAN DEFAULT FALSE,
  property_occupied BOOLEAN DEFAULT FALSE,
  weather_conditions TEXT,
  access_limitations TEXT,
  survey_limitations TEXT,

  -- Lifecycle
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','in_progress','paused','ready_for_review','completed','superseded')),
  completion_percentage INT NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ,
  paused_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Sign-off
  surveyor_name TEXT,
  surveyor_company TEXT,
  final_notes TEXT,
  acknowledged_outstanding BOOLEAN DEFAULT FALSE,

  -- Revisions
  revision_number INT NOT NULL DEFAULT 1,
  supersedes_survey_id UUID REFERENCES public.atlas_surveys(id) ON DELETE SET NULL,
  revision_reason TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_atlas_surveys_created_by ON public.atlas_surveys(created_by);
CREATE INDEX idx_atlas_surveys_status ON public.atlas_surveys(status);
CREATE INDEX idx_atlas_surveys_job ON public.atlas_surveys(job_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.atlas_surveys TO authenticated;
GRANT ALL ON public.atlas_surveys TO service_role;

ALTER TABLE public.atlas_surveys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Surveyor sees own atlas surveys"
  ON public.atlas_surveys FOR SELECT TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "Surveyor inserts own atlas surveys"
  ON public.atlas_surveys FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Surveyor updates own draft atlas surveys"
  ON public.atlas_surveys FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (created_by = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "Surveyor deletes own draft atlas surveys"
  ON public.atlas_surveys FOR DELETE TO authenticated
  USING ((created_by = auth.uid() AND status IN ('draft','in_progress','paused')) OR public.has_role(auth.uid(),'admin'));

-- Lock completed surveys from ordinary edits (admins bypass)
CREATE OR REPLACE FUNCTION public.atlas_surveys_lock_completed()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF OLD.status IN ('completed','superseded') AND NOT public.has_role(auth.uid(),'admin') THEN
    -- Allow only marking as superseded via revision creation flow
    IF NEW.status <> 'superseded' OR OLD.status = 'superseded' THEN
      RAISE EXCEPTION 'Completed Atlas surveys are locked. Create a new revision.';
    END IF;
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_atlas_surveys_lock
  BEFORE UPDATE ON public.atlas_surveys
  FOR EACH ROW EXECUTE FUNCTION public.atlas_surveys_lock_completed();

CREATE TRIGGER trg_atlas_surveys_updated
  BEFORE UPDATE ON public.atlas_surveys
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Helper: is user the owner of a survey?
CREATE OR REPLACE FUNCTION public.user_owns_atlas_survey(_user UUID, _survey UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.atlas_surveys s
    WHERE s.id = _survey AND s.created_by = _user
  );
$$;

-- 2. atlas_sections -----------------------------------------------
CREATE TABLE public.atlas_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES public.atlas_surveys(id) ON DELETE CASCADE,
  section_key TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  sequence INT NOT NULL DEFAULT 0,
  relevance_status TEXT NOT NULL DEFAULT 'relevant'
    CHECK (relevance_status IN ('relevant','not_applicable')),
  completion_status TEXT NOT NULL DEFAULT 'not_started'
    CHECK (completion_status IN ('not_started','in_progress','completed')),
  completion_percentage INT NOT NULL DEFAULT 0,
  critical_outstanding_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (survey_id, section_key)
);
CREATE INDEX idx_atlas_sections_survey ON public.atlas_sections(survey_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.atlas_sections TO authenticated;
GRANT ALL ON public.atlas_sections TO service_role;
ALTER TABLE public.atlas_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner accesses atlas sections"
  ON public.atlas_sections FOR ALL TO authenticated
  USING (public.user_owns_atlas_survey(auth.uid(), survey_id) OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.user_owns_atlas_survey(auth.uid(), survey_id) OR public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_atlas_sections_updated
  BEFORE UPDATE ON public.atlas_sections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. atlas_observations -------------------------------------------
CREATE TABLE public.atlas_observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES public.atlas_surveys(id) ON DELETE CASCADE,
  section_id UUID NOT NULL REFERENCES public.atlas_sections(id) ON DELETE CASCADE,

  title TEXT NOT NULL,
  observation_text TEXT,
  location TEXT,
  room_name TEXT,
  elevation TEXT,

  classification TEXT NOT NULL DEFAULT 'known_fact'
    CHECK (classification IN (
      'known_fact','customer_statement','document_statement',
      'assumption','unknown','risk','recommendation','further_investigation'
    )),
  confidence_level TEXT NOT NULL DEFAULT 'high'
    CHECK (confidence_level IN ('confirmed','high','moderate','low','unverified')),
  severity TEXT CHECK (severity IN ('info','low','moderate','high','critical')),
  is_critical BOOLEAN NOT NULL DEFAULT FALSE,
  is_required BOOLEAN NOT NULL DEFAULT FALSE,

  response_status TEXT NOT NULL DEFAULT 'answered'
    CHECK (response_status IN (
      'answered','unknown','unable_to_access','not_applicable',
      'specialist_required','customer_to_confirm','return_visit_required'
    )),
  skip_reason TEXT,
  acknowledged_at_completion BOOLEAN DEFAULT FALSE,

  recommendation TEXT,
  further_action TEXT,
  responsible_professional TEXT,
  customer_visible_note TEXT,
  internal_note TEXT,

  -- Inline measurement (kept simple for MVP)
  measurement_value NUMERIC,
  measurement_unit TEXT,
  measurement_method TEXT,

  observed_by UUID REFERENCES auth.users(id),
  observed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_atlas_obs_survey ON public.atlas_observations(survey_id);
CREATE INDEX idx_atlas_obs_section ON public.atlas_observations(section_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.atlas_observations TO authenticated;
GRANT ALL ON public.atlas_observations TO service_role;
ALTER TABLE public.atlas_observations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner accesses atlas observations"
  ON public.atlas_observations FOR ALL TO authenticated
  USING (public.user_owns_atlas_survey(auth.uid(), survey_id) OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.user_owns_atlas_survey(auth.uid(), survey_id) OR public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_atlas_obs_updated
  BEFORE UPDATE ON public.atlas_observations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. atlas_evidence -----------------------------------------------
CREATE TABLE public.atlas_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES public.atlas_surveys(id) ON DELETE CASCADE,
  observation_id UUID REFERENCES public.atlas_observations(id) ON DELETE CASCADE,

  evidence_type TEXT NOT NULL CHECK (evidence_type IN ('photo','voice','document','text','measurement')),
  storage_path TEXT,     -- path inside atlas-evidence bucket
  file_url TEXT,         -- optional cached signed URL
  mime_type TEXT,
  caption TEXT,
  transcript TEXT,
  corrected_transcript TEXT,
  duration_seconds NUMERIC,
  room_name TEXT,
  elevation TEXT,

  is_ai_suggestion BOOLEAN NOT NULL DEFAULT FALSE,
  archived_at TIMESTAMPTZ,

  captured_by UUID REFERENCES auth.users(id),
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_atlas_evidence_survey ON public.atlas_evidence(survey_id);
CREATE INDEX idx_atlas_evidence_obs ON public.atlas_evidence(observation_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.atlas_evidence TO authenticated;
GRANT ALL ON public.atlas_evidence TO service_role;
ALTER TABLE public.atlas_evidence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner accesses atlas evidence"
  ON public.atlas_evidence FOR ALL TO authenticated
  USING (public.user_owns_atlas_survey(auth.uid(), survey_id) OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.user_owns_atlas_survey(auth.uid(), survey_id) OR public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_atlas_evidence_updated
  BEFORE UPDATE ON public.atlas_evidence
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. atlas_audit_events -------------------------------------------
CREATE TABLE public.atlas_audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES public.atlas_surveys(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  action TEXT NOT NULL,
  previous_value JSONB,
  new_value JSONB,
  reason TEXT,
  performed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_atlas_audit_survey ON public.atlas_audit_events(survey_id, created_at DESC);

GRANT SELECT, INSERT ON public.atlas_audit_events TO authenticated;
GRANT ALL ON public.atlas_audit_events TO service_role;
ALTER TABLE public.atlas_audit_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner reads atlas audit"
  ON public.atlas_audit_events FOR SELECT TO authenticated
  USING (public.user_owns_atlas_survey(auth.uid(), survey_id) OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "Owner inserts atlas audit"
  ON public.atlas_audit_events FOR INSERT TO authenticated
  WITH CHECK (
    (public.user_owns_atlas_survey(auth.uid(), survey_id) OR public.has_role(auth.uid(),'admin'))
    AND performed_by = auth.uid()
  );
