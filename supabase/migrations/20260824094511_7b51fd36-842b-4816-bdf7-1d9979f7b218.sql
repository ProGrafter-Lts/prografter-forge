CREATE OR REPLACE FUNCTION public.enforce_quote_job_relationship()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- No job attached, or system/admin actor: nothing to enforce.
  IF NEW.job_id IS NULL OR NEW.trade_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.job_trade_invitations i
    WHERE i.job_id = NEW.job_id AND i.trade_id = NEW.trade_id
  ) OR EXISTS (
    SELECT 1 FROM public.job_matches m
    WHERE m.job_id = NEW.job_id AND m.trade_id = NEW.trade_id
  ) THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'This trade has not been invited or matched to this job, so a quote cannot be created for it.'
    USING ERRCODE = '42501';
END;
$$;

DROP TRIGGER IF EXISTS enforce_quote_job_relationship_trg ON public.quotes;
CREATE TRIGGER enforce_quote_job_relationship_trg
BEFORE INSERT ON public.quotes
FOR EACH ROW EXECUTE FUNCTION public.enforce_quote_job_relationship();