
-- Job matches table
CREATE TABLE public.job_matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  trade_id UUID NOT NULL REFERENCES public.trades(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'notified',
  estimated_value TEXT,
  notified_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.job_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trades can view own matches"
  ON public.job_matches FOR SELECT
  TO authenticated
  USING (trade_id IN (SELECT id FROM public.trades WHERE user_id = auth.uid()));

CREATE POLICY "Trades can update own matches"
  ON public.job_matches FOR UPDATE
  TO authenticated
  USING (trade_id IN (SELECT id FROM public.trades WHERE user_id = auth.uid()));

-- Quotes table
CREATE TABLE public.quotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  trade_id UUID NOT NULL REFERENCES public.trades(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trades can view own quotes"
  ON public.quotes FOR SELECT
  TO authenticated
  USING (trade_id IN (SELECT id FROM public.trades WHERE user_id = auth.uid()));

CREATE POLICY "Trades can insert own quotes"
  ON public.quotes FOR INSERT
  TO authenticated
  WITH CHECK (trade_id IN (SELECT id FROM public.trades WHERE user_id = auth.uid()));

CREATE POLICY "Trades can update own quotes"
  ON public.quotes FOR UPDATE
  TO authenticated
  USING (trade_id IN (SELECT id FROM public.trades WHERE user_id = auth.uid()));

CREATE TRIGGER update_quotes_updated_at
  BEFORE UPDATE ON public.quotes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add stage column to jobs for project progress
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS stage TEXT NOT NULL DEFAULT 'enquiry';

-- Allow trades to view jobs they're matched to
CREATE POLICY "Trades can view matched jobs"
  ON public.jobs FOR SELECT
  TO authenticated
  USING (id IN (SELECT job_id FROM public.job_matches WHERE trade_id IN (SELECT id FROM public.trades WHERE user_id = auth.uid())));
