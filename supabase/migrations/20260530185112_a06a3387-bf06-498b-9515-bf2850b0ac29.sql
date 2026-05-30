CREATE TABLE public.trade_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_email text,
  full_name text,
  business_name text,
  trade_category_id text,
  qualification_path text,
  form_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  document_paths jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'submitted',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.trade_applications TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trade_applications TO authenticated;
GRANT ALL ON public.trade_applications TO service_role;

ALTER TABLE public.trade_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a trade application"
ON public.trade_applications FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Admins can view trade applications"
ON public.trade_applications FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update trade applications"
ON public.trade_applications FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete trade applications"
ON public.trade_applications FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_trade_applications_updated_at
BEFORE UPDATE ON public.trade_applications
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO storage.buckets (id, name, public)
VALUES ('trade-application-docs', 'trade-application-docs', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can upload trade application docs"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'trade-application-docs');

CREATE POLICY "Admins can read trade application docs"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'trade-application-docs' AND public.has_role(auth.uid(), 'admin'));