ALTER TABLE public.trades DROP CONSTRAINT IF EXISTS trades_verification_status_check;

ALTER TABLE public.trades ADD CONSTRAINT trades_verification_status_check
CHECK (verification_status = ANY (ARRAY['pending'::text, 'approved'::text, 'info_requested'::text, 'rejected'::text, 'coming_soon'::text]));