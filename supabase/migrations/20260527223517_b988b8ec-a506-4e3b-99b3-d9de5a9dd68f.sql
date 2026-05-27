-- Companies House capture: business structure + CH number status tracking
ALTER TABLE public.trades
  ADD COLUMN IF NOT EXISTS business_structure text,
  ADD COLUMN IF NOT EXISTS companies_house_status text NOT NULL DEFAULT 'not_checked',
  ADD COLUMN IF NOT EXISTS companies_house_registered_name text,
  ADD COLUMN IF NOT EXISTS companies_house_checked_at timestamptz;

-- Validate values via trigger (avoids CHECK constraint rigidity)
CREATE OR REPLACE FUNCTION public.validate_trade_companies_house()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.business_structure IS NOT NULL
     AND NEW.business_structure NOT IN ('sole_trader','limited_company','partnership') THEN
    RAISE EXCEPTION 'Invalid business_structure: %', NEW.business_structure;
  END IF;

  IF NEW.companies_house_status NOT IN ('not_checked','verified','mismatch','n/a_sole_trader') THEN
    RAISE EXCEPTION 'Invalid companies_house_status: %', NEW.companies_house_status;
  END IF;

  -- Normalise CH number to uppercase, trim spaces
  IF NEW.companies_house_number IS NOT NULL THEN
    NEW.companies_house_number := upper(regexp_replace(NEW.companies_house_number, '\s', '', 'g'));
    IF NEW.companies_house_number !~ '^([A-Z]{2}[0-9]{6}|[0-9]{8})$' AND NEW.companies_house_number <> '' THEN
      RAISE EXCEPTION 'Invalid companies_house_number format (must be 8 digits or 2 letters + 6 digits)';
    END IF;
    IF NEW.companies_house_number = '' THEN
      NEW.companies_house_number := NULL;
    END IF;
  END IF;

  -- Auto-mark sole traders as n/a if no number provided
  IF NEW.business_structure = 'sole_trader'
     AND (NEW.companies_house_number IS NULL)
     AND NEW.companies_house_status = 'not_checked' THEN
    NEW.companies_house_status := 'n/a_sole_trader';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_trade_companies_house ON public.trades;
CREATE TRIGGER trg_validate_trade_companies_house
  BEFORE INSERT OR UPDATE OF business_structure, companies_house_number, companies_house_status
  ON public.trades
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_trade_companies_house();