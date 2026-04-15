ALTER TABLE public.trades
  ADD COLUMN IF NOT EXISTS mcs_number text,
  ADD COLUMN IF NOT EXISTS trustmark_number text,
  ADD COLUMN IF NOT EXISTS pas_2030_accredited boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pas_2035_coordinator boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ozev_approved boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS fgas_registered boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ciga_registered boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS inca_certified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS green_cert_expiry date,
  ADD COLUMN IF NOT EXISTS is_green_trade boolean NOT NULL DEFAULT false;