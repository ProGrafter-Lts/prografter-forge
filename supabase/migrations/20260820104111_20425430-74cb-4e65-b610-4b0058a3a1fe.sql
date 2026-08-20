ALTER TABLE public.tradevault_documents
  ADD COLUMN IF NOT EXISTS source_bucket text NOT NULL DEFAULT 'trade-verification-documents',
  ADD COLUMN IF NOT EXISTS legacy_source text;

ALTER TABLE public.job_matches
  ADD COLUMN IF NOT EXISTS interested_at timestamp with time zone;

CREATE OR REPLACE FUNCTION public.guard_job_match_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF public.has_role(auth.uid(), 'admin') OR auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    RAISE EXCEPTION 'Trades cannot modify the status of a job match';
  END IF;

  -- Trades may only ever set interest, never retract or back-date it
  IF OLD.interested_at IS NOT NULL AND NEW.interested_at IS DISTINCT FROM OLD.interested_at THEN
    NEW.interested_at := OLD.interested_at;
  END IF;

  RETURN NEW;
END;
$function$;