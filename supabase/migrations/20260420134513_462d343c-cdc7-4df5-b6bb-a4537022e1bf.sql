ALTER TABLE public.homeowners   ADD COLUMN IF NOT EXISTS is_test boolean NOT NULL DEFAULT false;
ALTER TABLE public.trades       ADD COLUMN IF NOT EXISTS is_test boolean NOT NULL DEFAULT false;
ALTER TABLE public.jobs         ADD COLUMN IF NOT EXISTS is_test boolean NOT NULL DEFAULT false;
ALTER TABLE public.quotes       ADD COLUMN IF NOT EXISTS is_test boolean NOT NULL DEFAULT false;
ALTER TABLE public.job_matches  ADD COLUMN IF NOT EXISTS is_test boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles     ADD COLUMN IF NOT EXISTS is_test boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_homeowners_is_test ON public.homeowners(is_test) WHERE is_test = true;
CREATE INDEX IF NOT EXISTS idx_trades_is_test     ON public.trades(is_test)     WHERE is_test = true;
CREATE INDEX IF NOT EXISTS idx_jobs_is_test       ON public.jobs(is_test)       WHERE is_test = true;
CREATE INDEX IF NOT EXISTS idx_quotes_is_test     ON public.quotes(is_test)     WHERE is_test = true;