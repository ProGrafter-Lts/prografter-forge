CREATE OR REPLACE FUNCTION public.trade_application_out_of_area()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  raw_pc text;
  area text;
BEGIN
  raw_pc := upper(regexp_replace(coalesce(NEW.form_data->>'postcode', ''), '\s', '', 'g'));
  IF raw_pc = '' THEN
    RETURN NEW;
  END IF;

  area := (regexp_match(raw_pc, '^([A-Z]{1,2})'))[1];
  IF area IS NULL THEN
    RETURN NEW;
  END IF;

  IF area NOT IN ('NG','DE','LE','LN','S','DN') THEN
    NEW.verification_status := 'coming_soon';
    NEW.admin_notes := coalesce(NEW.admin_notes, '')
      || 'Auto-filed: postcode ' || raw_pc
      || ' is outside the live service area (NG/DE/LE/LN/S/DN). Coming-soon notification sent automatically on submission.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_trade_applications_out_of_area ON public.trade_applications;

CREATE TRIGGER trg_trade_applications_out_of_area
BEFORE INSERT ON public.trade_applications
FOR EACH ROW EXECUTE FUNCTION public.trade_application_out_of_area();