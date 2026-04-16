
-- Contracts table
CREATE TABLE public.contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  trade_id UUID NOT NULL,
  homeowner_id UUID NOT NULL,
  contract_text TEXT NOT NULL,
  agreed_price NUMERIC NOT NULL,
  payment_schedule JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft',
  homeowner_signed_at TIMESTAMP WITH TIME ZONE,
  trade_signed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Homeowners can view contracts for own jobs"
ON public.contracts FOR SELECT TO authenticated
USING (homeowner_id IN (
  SELECT h.id FROM homeowners h WHERE h.user_id = auth.uid()
));

CREATE POLICY "Trades can view contracts for matched jobs"
ON public.contracts FOR SELECT TO authenticated
USING (trade_id IN (
  SELECT t.id FROM trades t WHERE t.user_id = auth.uid()
));

CREATE POLICY "Trades can create contracts for matched jobs"
ON public.contracts FOR INSERT TO authenticated
WITH CHECK (trade_id IN (
  SELECT t.id FROM trades t WHERE t.user_id = auth.uid()
));

CREATE POLICY "Homeowners can update contracts to sign"
ON public.contracts FOR UPDATE TO authenticated
USING (homeowner_id IN (
  SELECT h.id FROM homeowners h WHERE h.user_id = auth.uid()
));

CREATE POLICY "Trades can update contracts to countersign"
ON public.contracts FOR UPDATE TO authenticated
USING (trade_id IN (
  SELECT t.id FROM trades t WHERE t.user_id = auth.uid()
));

-- Sub-trade assignments table
CREATE TABLE public.sub_trade_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stage_id UUID NOT NULL REFERENCES public.project_stages(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  main_trade_id UUID NOT NULL,
  sub_trade_id UUID,
  external_sub_name TEXT,
  external_sub_phone TEXT,
  external_sub_email TEXT,
  access_token TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  status TEXT NOT NULL DEFAULT 'assigned',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(access_token)
);

ALTER TABLE public.sub_trade_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Main trades can manage own sub assignments"
ON public.sub_trade_assignments FOR ALL TO authenticated
USING (main_trade_id IN (
  SELECT t.id FROM trades t WHERE t.user_id = auth.uid()
))
WITH CHECK (main_trade_id IN (
  SELECT t.id FROM trades t WHERE t.user_id = auth.uid()
));

CREATE POLICY "Assigned sub-trades can view own assignments"
ON public.sub_trade_assignments FOR SELECT TO authenticated
USING (sub_trade_id IN (
  SELECT t.id FROM trades t WHERE t.user_id = auth.uid()
));

-- Add reason and signed_at to variations
ALTER TABLE public.variations ADD COLUMN IF NOT EXISTS reason TEXT;
ALTER TABLE public.variations ADD COLUMN IF NOT EXISTS signed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.variations ADD COLUMN IF NOT EXISTS signed_by TEXT;

-- Trigger for contracts updated_at
CREATE TRIGGER update_contracts_updated_at
BEFORE UPDATE ON public.contracts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for sub_trade_assignments updated_at
CREATE TRIGGER update_sub_trade_assignments_updated_at
BEFORE UPDATE ON public.sub_trade_assignments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Allow homeowners to view quotes on their jobs (needed for contract flow)
CREATE POLICY "Homeowners can view quotes for own jobs"
ON public.quotes FOR SELECT TO authenticated
USING (job_id IN (
  SELECT j.id FROM jobs j WHERE j.homeowner_id IN (
    SELECT h.id FROM homeowners h WHERE h.user_id = auth.uid()
  )
));

-- Allow trades to view the homeowner associated with their matched jobs
CREATE POLICY "Trades can view homeowners for matched jobs"
ON public.homeowners FOR SELECT TO authenticated
USING (id IN (
  SELECT j.homeowner_id FROM jobs j WHERE j.id IN (
    SELECT jm.job_id FROM job_matches jm WHERE jm.trade_id IN (
      SELECT t.id FROM trades t WHERE t.user_id = auth.uid()
    )
  )
));
