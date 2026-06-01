-- Trade job-matching settings
ALTER TABLE public.trades
  ADD COLUMN IF NOT EXISTS accepting_jobs boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS service_radius_miles integer NOT NULL DEFAULT 25;

-- Constrain radius to 5..50 via validation trigger (CHECK avoided per guidance)
CREATE OR REPLACE FUNCTION public.clamp_trade_service_radius()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.service_radius_miles IS NULL THEN
    NEW.service_radius_miles := 25;
  ELSIF NEW.service_radius_miles < 5 THEN
    NEW.service_radius_miles := 5;
  ELSIF NEW.service_radius_miles > 50 THEN
    NEW.service_radius_miles := 50;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_clamp_trade_service_radius ON public.trades;
CREATE TRIGGER trg_clamp_trade_service_radius
BEFORE INSERT OR UPDATE ON public.trades
FOR EACH ROW EXECUTE FUNCTION public.clamp_trade_service_radius();

-- Job brief publish tracking
ALTER TABLE public.job_briefs
  ADD COLUMN IF NOT EXISTS published_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS matched_trade_count integer;