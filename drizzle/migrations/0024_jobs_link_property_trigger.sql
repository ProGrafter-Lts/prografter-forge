CREATE OR REPLACE FUNCTION public.jobs_link_property()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_property_id UUID;
BEGIN
  IF NEW.property_id IS NOT NULL OR NEW.homeowner_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT p.id INTO v_property_id
  FROM public.properties p
  WHERE p.homeowner_id = NEW.homeowner_id
    AND p.address IS NOT DISTINCT FROM NEW.address
    AND p.postcode IS NOT DISTINCT FROM NEW.postcode
  LIMIT 1;

  IF v_property_id IS NULL THEN
    INSERT INTO public.properties (homeowner_id, address, postcode)
    VALUES (NEW.homeowner_id, NEW.address, NEW.postcode)
    RETURNING id INTO v_property_id;
  END IF;

  NEW.property_id := v_property_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_jobs_link_property ON public.jobs;
CREATE TRIGGER trg_jobs_link_property
BEFORE INSERT ON public.jobs
FOR EACH ROW EXECUTE FUNCTION public.jobs_link_property();