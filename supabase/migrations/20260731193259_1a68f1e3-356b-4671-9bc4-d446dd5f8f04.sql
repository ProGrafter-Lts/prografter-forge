CREATE TABLE public.cost_guide_area_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  postcode text NOT NULL,
  outcode text,
  region text,
  project_type text,
  notified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.cost_guide_area_waitlist TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.cost_guide_area_waitlist TO authenticated;
GRANT ALL ON public.cost_guide_area_waitlist TO service_role;

ALTER TABLE public.cost_guide_area_waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can join the expansion waitlist"
  ON public.cost_guide_area_waitlist FOR INSERT TO anon, authenticated
  WITH CHECK (email IS NOT NULL AND length(email) <= 255);

CREATE POLICY "Admins can view waitlist"
  ON public.cost_guide_area_waitlist FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update waitlist"
  ON public.cost_guide_area_waitlist FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete waitlist"
  ON public.cost_guide_area_waitlist FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_cost_guide_area_waitlist_updated_at
  BEFORE UPDATE ON public.cost_guide_area_waitlist
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_cost_guide_area_waitlist_outcode ON public.cost_guide_area_waitlist (outcode);