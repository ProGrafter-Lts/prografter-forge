CREATE TABLE public.simple_quote_checks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT,
  project_type TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  pdf_url TEXT,
  supporting_files JSONB NOT NULL DEFAULT '[]'::jsonb,
  intake JSONB NOT NULL DEFAULT '{}'::jsonb,
  report_json JSONB,
  error TEXT,
  lookup_token UUID NOT NULL DEFAULT gen_random_uuid()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.simple_quote_checks TO authenticated;
GRANT ALL ON public.simple_quote_checks TO service_role;

ALTER TABLE public.simple_quote_checks ENABLE ROW LEVEL SECURITY;

-- Signed-in users can see their own simple checks. Anonymous access to reports
-- goes exclusively through the service-role read edge function + lookup token.
CREATE POLICY "Users can view their own simple quote checks"
ON public.simple_quote_checks FOR SELECT
TO authenticated
USING (auth.uid() = user_id);