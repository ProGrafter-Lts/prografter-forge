CREATE TABLE public.plan_my_project_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  category text NOT NULL,
  category_label text,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  cost_band_low integer,
  cost_band_high integer,
  cost_band_label text,
  drivers jsonb NOT NULL DEFAULT '[]'::jsonb,
  considerations jsonb NOT NULL DEFAULT '[]'::jsonb,
  exclusions_acknowledged boolean NOT NULL DEFAULT false,
  email text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.plan_my_project_submissions TO anon;
GRANT SELECT, INSERT ON public.plan_my_project_submissions TO authenticated;
GRANT ALL ON public.plan_my_project_submissions TO service_role;

ALTER TABLE public.plan_my_project_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create a plan submission"
ON public.plan_my_project_submissions FOR INSERT TO anon, authenticated
WITH CHECK (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "Users can view their own plan submissions"
ON public.plan_my_project_submissions FOR SELECT TO authenticated
USING (user_id = auth.uid());