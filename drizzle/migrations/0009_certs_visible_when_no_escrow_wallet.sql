-- Certificates on projects that do not use the stage-wallet escrow flow must
-- stay visible to the homeowner. Only escrow-managed projects gate visibility
-- behind a milestone release.
CREATE OR REPLACE FUNCTION public.project_certificates_default_visibility()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.visible_to_homeowner IS TRUE THEN
    RETURN NEW;
  END IF;

  -- No escrow wallet on this job, and no explicit stage link => visible now.
  IF NEW.wallet_stage_id IS NULL
     AND NOT EXISTS (SELECT 1 FROM public.project_wallets w WHERE w.job_id = NEW.job_id) THEN
    NEW.visible_to_homeowner := true;
    NEW.released_at := COALESCE(NEW.released_at, now());
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS project_certificates_default_visibility_trg ON public.project_certificates;
CREATE TRIGGER project_certificates_default_visibility_trg
BEFORE INSERT ON public.project_certificates
FOR EACH ROW EXECUTE FUNCTION public.project_certificates_default_visibility();