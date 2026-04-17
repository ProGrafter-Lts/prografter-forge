-- Add a regenerable calendar token for ICS feed access
ALTER TABLE public.trades
ADD COLUMN IF NOT EXISTS calendar_token uuid NOT NULL DEFAULT gen_random_uuid();

CREATE UNIQUE INDEX IF NOT EXISTS trades_calendar_token_idx ON public.trades(calendar_token);