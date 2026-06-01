CREATE TABLE IF NOT EXISTS public.job_briefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ref text NOT NULL UNIQUE,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  address_line1 text NOT NULL,
  address_line2 text,
  city text NOT NULL,
  postcode text NOT NULL,
  property_type text,
  trade_category_id text,
  job_title text,
  job_description text,
  planning_permission text,
  building_regs text,
  scope_items text,
  known_issues text,
  access_arrangement text,
  parking_available text,
  preferred_days text,
  additional_notes text,
  budget_band text,
  timeline text,
  quotes_received text,
  decision_criteria text,
  status text NOT NULL DEFAULT 'new',
  is_test boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_briefs TO authenticated;
GRANT ALL ON public.job_briefs TO service_role;

ALTER TABLE public.job_briefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view job briefs"
  ON public.job_briefs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update job briefs"
  ON public.job_briefs FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete job briefs"
  ON public.job_briefs FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));