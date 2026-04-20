ALTER TABLE public.trades
  ADD COLUMN IF NOT EXISTS mcs_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS trustmark_verified boolean NOT NULL DEFAULT false;