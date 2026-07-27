
CREATE TABLE public.project_intelligence_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  edit_token uuid NOT NULL DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'draft',
  current_step smallint NOT NULL DEFAULT 0,
  project_type text,
  address jsonb,
  property_type text,
  property_age text,
  current_stage text,
  description text,
  budget_band text,
  documents jsonb NOT NULL DEFAULT '[]'::jsonb,
  analysis jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_intelligence_records TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.project_intelligence_records TO anon;
GRANT ALL ON public.project_intelligence_records TO service_role;

ALTER TABLE public.project_intelligence_records ENABLE ROW LEVEL SECURITY;

-- Owner (signed-in) full access
CREATE POLICY "pir_owner_all"
ON public.project_intelligence_records
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Anonymous / guest capture: allow insert of guest rows (no user_id)
CREATE POLICY "pir_anon_insert"
ON public.project_intelligence_records
FOR INSERT
TO anon
WITH CHECK (user_id IS NULL);

-- Authenticated users may also insert a guest-shaped row (before we've stamped user_id)
CREATE POLICY "pir_auth_insert_guest"
ON public.project_intelligence_records
FOR INSERT
TO authenticated
WITH CHECK (user_id IS NULL OR user_id = auth.uid());

-- Trigger to bump updated_at
CREATE TRIGGER trg_pir_updated_at
BEFORE UPDATE ON public.project_intelligence_records
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
