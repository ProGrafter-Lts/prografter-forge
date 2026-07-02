-- Add website-outreach pipeline support to scraped_trades
ALTER TABLE public.scraped_trades
  ADD COLUMN IF NOT EXISTS pipeline text NOT NULL DEFAULT 'trade',
  ADD COLUMN IF NOT EXISTS website_quality text,
  ADD COLUMN IF NOT EXISTS mini_audit_sent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS mini_audit_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS proposal_sent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS proposal_sent_at timestamptz;

-- pipeline check
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'scraped_trades_pipeline_chk'
  ) THEN
    ALTER TABLE public.scraped_trades
      ADD CONSTRAINT scraped_trades_pipeline_chk
      CHECK (pipeline = ANY (ARRAY['trade'::text, 'website'::text]));
  END IF;
END $$;

-- website_quality check (nullable allowed)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'scraped_trades_website_quality_chk'
  ) THEN
    ALTER TABLE public.scraped_trades
      ADD CONSTRAINT scraped_trades_website_quality_chk
      CHECK (website_quality IS NULL OR website_quality = ANY (ARRAY['none'::text, 'poor'::text, 'outdated'::text, 'weak_mobile'::text, 'no_form'::text, 'ok'::text]));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS scraped_trades_pipeline_idx ON public.scraped_trades (pipeline);