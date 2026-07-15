ALTER TABLE public.pending_module_checks ADD COLUMN IF NOT EXISTS lookup_token TEXT;
UPDATE public.pending_module_checks p
SET lookup_token = s.lookup_token
FROM public.simple_quote_checks s
WHERE p.analysed_check_id = s.id AND p.lookup_token IS NULL AND s.lookup_token IS NOT NULL;