ALTER TABLE public.trades
  ADD COLUMN IF NOT EXISTS trade_type_confirmation_required boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.trades.trade_type_confirmation_required IS
  'True for legacy bulk-migrated accounts that never chose a trade type. Forces a one-time confirmation prompt on next login.';