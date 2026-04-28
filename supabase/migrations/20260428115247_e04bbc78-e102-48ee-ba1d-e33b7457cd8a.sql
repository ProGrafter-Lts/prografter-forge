ALTER TABLE public.trades
  ALTER COLUMN user_id SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS trades_user_id_key
  ON public.trades (user_id);