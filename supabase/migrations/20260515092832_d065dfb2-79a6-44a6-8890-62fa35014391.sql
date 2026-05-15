ALTER TABLE public.trades
  ADD COLUMN IF NOT EXISTS cps_scheme text,
  ADD COLUMN IF NOT EXISTS cps_registration_number text,
  ADD COLUMN IF NOT EXISTS gas_safe_number text;