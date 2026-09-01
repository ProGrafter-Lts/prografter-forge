CREATE POLICY "Admins can view wallet stages"
ON public.project_wallet_stages
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.clear_release_block_on_release()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.funding_status = 'released' THEN
    NEW.release_block_reason := NULL;
    NEW.awaiting_funds := false;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_clear_release_block_on_release ON public.project_wallet_stages;
CREATE TRIGGER trg_clear_release_block_on_release
BEFORE INSERT OR UPDATE ON public.project_wallet_stages
FOR EACH ROW EXECUTE FUNCTION public.clear_release_block_on_release();

UPDATE public.project_wallet_stages
SET release_block_reason = NULL, awaiting_funds = false
WHERE funding_status = 'released'
  AND (release_block_reason IS NOT NULL OR awaiting_funds IS TRUE);