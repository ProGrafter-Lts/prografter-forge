
-- Add CRM/outreach pipeline columns to scraped_trades
ALTER TABLE public.scraped_trades
  ADD COLUMN IF NOT EXISTS outreach_stage text NOT NULL DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS interested boolean,
  ADD COLUMN IF NOT EXISTS follow_up_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_contacted_at timestamptz;

-- Constrain stage values
ALTER TABLE public.scraped_trades
  DROP CONSTRAINT IF EXISTS scraped_trades_outreach_stage_chk;
ALTER TABLE public.scraped_trades
  ADD CONSTRAINT scraped_trades_outreach_stage_chk
  CHECK (outreach_stage IN ('new','contacted','follow_up','interested','not_interested','converted'));

-- Backfill: anything previously marked contacted moves to 'contacted'
UPDATE public.scraped_trades
SET outreach_stage = 'contacted',
    last_contacted_at = COALESCE(last_contacted_at, contacted_at)
WHERE contacted = true AND outreach_stage = 'new';

CREATE INDEX IF NOT EXISTS scraped_trades_outreach_stage_idx
  ON public.scraped_trades(outreach_stage);
CREATE INDEX IF NOT EXISTS scraped_trades_follow_up_at_idx
  ON public.scraped_trades(follow_up_at)
  WHERE follow_up_at IS NOT NULL;
