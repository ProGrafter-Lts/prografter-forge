CREATE TABLE public.manual_quote_review_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_type TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  file_path TEXT,
  file_name TEXT,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.manual_quote_review_requests TO authenticated;
GRANT INSERT ON public.manual_quote_review_requests TO anon;
GRANT ALL ON public.manual_quote_review_requests TO service_role;

ALTER TABLE public.manual_quote_review_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a manual review request"
  ON public.manual_quote_review_requests
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view manual review requests"
  ON public.manual_quote_review_requests
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update manual review requests"
  ON public.manual_quote_review_requests
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete manual review requests"
  ON public.manual_quote_review_requests
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_manual_quote_review_requests_updated_at
  BEFORE UPDATE ON public.manual_quote_review_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();