-- Add Quote Checker AI verdict columns to quotes
ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS ai_verdict text,
  ADD COLUMN IF NOT EXISTS ai_verdict_summary text,
  ADD COLUMN IF NOT EXISTS ai_verdict_at timestamptz;

-- Constrain verdict values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'quotes_ai_verdict_check'
  ) THEN
    ALTER TABLE public.quotes
      ADD CONSTRAINT quotes_ai_verdict_check
      CHECK (ai_verdict IS NULL OR ai_verdict IN ('fair','needs_detail','high_risk'));
  END IF;
END$$;

-- Seed verdicts for Sarah Thompson's three demo quotes
UPDATE public.quotes SET ai_verdict='high_risk',
  ai_verdict_summary='Compliance issues detected: Part P self-certification claim is incorrect for non-registered installers, no warranty offered, deposit weighting unusually high.',
  ai_verdict_at = now()
WHERE id = 'a29cc453-883c-4343-bef0-96ee6fa64966';

UPDATE public.quotes SET ai_verdict='needs_detail',
  ai_verdict_summary='Missing detail: warranty unspecified, no Part P notification confirmation, line items lack material/labour split.',
  ai_verdict_at = now()
WHERE id = '2037281b-9d24-4151-b143-84b027686fe5';

UPDATE public.quotes SET ai_verdict='fair',
  ai_verdict_summary='Itemised, compliant, within market range. EIC + landlord EICR included. Part P notification covered.',
  ai_verdict_at = now()
WHERE id = '062fe9c9-823e-49d5-b176-e53c5ac07010';