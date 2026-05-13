CREATE OR REPLACE FUNCTION public.is_test_email(_email text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT _email IS NOT NULL AND (
    lower(_email) LIKE '%@prografter-seed.test'
    OR lower(_email) LIKE '%@demo.prografter.co.uk'
    OR lower(_email) LIKE 'prografter.test@%'
    OR lower(_email) LIKE '%.test@%'
    OR lower(_email) = 'test@prografter.com'
    OR lower(_email) LIKE '%@example.com'
    OR lower(_email) LIKE '%@example.test'
    OR lower(_email) LIKE '%+test@%'
  );
$$;

-- Homeowners: email is on the row itself
CREATE OR REPLACE FUNCTION public.set_homeowner_is_test()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.is_test IS DISTINCT FROM true AND public.is_test_email(NEW.email) THEN
    NEW.is_test := true;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_homeowners_is_test ON public.homeowners;
CREATE TRIGGER trg_homeowners_is_test
BEFORE INSERT OR UPDATE OF email ON public.homeowners
FOR EACH ROW EXECUTE FUNCTION public.set_homeowner_is_test();

-- Trades: look up email from auth.users via user_id
CREATE OR REPLACE FUNCTION public.set_trade_is_test()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _email text;
BEGIN
  IF NEW.is_test IS DISTINCT FROM true AND NEW.user_id IS NOT NULL THEN
    SELECT email INTO _email FROM auth.users WHERE id = NEW.user_id;
    IF public.is_test_email(_email) THEN
      NEW.is_test := true;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_trades_is_test ON public.trades;
CREATE TRIGGER trg_trades_is_test
BEFORE INSERT OR UPDATE OF user_id ON public.trades
FOR EACH ROW EXECUTE FUNCTION public.set_trade_is_test();

-- Admin-only sign-up stats (excludes test accounts)
CREATE OR REPLACE FUNCTION public.get_signup_stats()
RETURNS TABLE (
  genuine_homeowners bigint,
  total_homeowners bigint,
  genuine_homeowners_7d bigint,
  genuine_homeowners_30d bigint,
  genuine_trades bigint,
  total_trades bigint,
  genuine_trades_7d bigint,
  genuine_trades_30d bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (SELECT count(*) FROM public.homeowners WHERE NOT is_test),
    (SELECT count(*) FROM public.homeowners),
    (SELECT count(*) FROM public.homeowners WHERE NOT is_test AND created_at > now() - interval '7 days'),
    (SELECT count(*) FROM public.homeowners WHERE NOT is_test AND created_at > now() - interval '30 days'),
    (SELECT count(*) FROM public.trades WHERE NOT is_test),
    (SELECT count(*) FROM public.trades),
    (SELECT count(*) FROM public.trades WHERE NOT is_test AND created_at > now() - interval '7 days'),
    (SELECT count(*) FROM public.trades WHERE NOT is_test AND created_at > now() - interval '30 days')
  WHERE public.has_role(auth.uid(), 'admin'::public.app_role);
$$;

REVOKE ALL ON FUNCTION public.get_signup_stats() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_signup_stats() TO authenticated;