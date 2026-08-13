ALTER TABLE public.atlas_surveys ADD COLUMN IF NOT EXISTS schema_version TEXT;

CREATE TABLE IF NOT EXISTS public.atlas_survey_fields (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  survey_id UUID NOT NULL REFERENCES public.atlas_surveys(id) ON DELETE CASCADE,
  field_key TEXT NOT NULL,
  value JSONB,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (survey_id, field_key)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.atlas_survey_fields TO authenticated;
GRANT ALL ON public.atlas_survey_fields TO service_role;
ALTER TABLE public.atlas_survey_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Surveyors manage their own survey fields"
  ON public.atlas_survey_fields FOR ALL TO authenticated
  USING (public.user_owns_atlas_survey(auth.uid(), survey_id) OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.user_owns_atlas_survey(auth.uid(), survey_id) OR public.has_role(auth.uid(),'admin'));

CREATE TRIGGER atlas_survey_fields_touch
  BEFORE UPDATE ON public.atlas_survey_fields
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.atlas_field_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  survey_id UUID NOT NULL REFERENCES public.atlas_surveys(id) ON DELETE CASCADE,
  field_key TEXT NOT NULL CHECK (length(btrim(field_key)) > 0),
  storage_path TEXT NOT NULL,
  caption TEXT,
  local_id TEXT,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (survey_id, local_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.atlas_field_photos TO authenticated;
GRANT ALL ON public.atlas_field_photos TO service_role;
ALTER TABLE public.atlas_field_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Surveyors manage their own field photos"
  ON public.atlas_field_photos FOR ALL TO authenticated
  USING (public.user_owns_atlas_survey(auth.uid(), survey_id) OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.user_owns_atlas_survey(auth.uid(), survey_id) OR public.has_role(auth.uid(),'admin'));

CREATE INDEX IF NOT EXISTS atlas_survey_fields_survey_idx ON public.atlas_survey_fields(survey_id);
CREATE INDEX IF NOT EXISTS atlas_field_photos_survey_idx ON public.atlas_field_photos(survey_id, field_key);