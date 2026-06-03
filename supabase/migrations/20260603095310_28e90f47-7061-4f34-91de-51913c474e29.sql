ALTER TABLE public.early_signups
  ADD COLUMN IF NOT EXISTS is_test boolean NOT NULL DEFAULT false;