-- 1. planning_invite_links: remove public blanket SELECT, replace with token-scoped SECURITY DEFINER function
DROP POLICY IF EXISTS "Anyone can read invite links by token" ON public.planning_invite_links;

CREATE OR REPLACE FUNCTION public.get_planning_invite(_token text)
RETURNS TABLE(
  trade_name text,
  company_name text,
  trade_type text,
  verified boolean,
  verification_status text,
  project_type text,
  planning_application_id text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    t.name,
    t.company_name,
    t.trade_type,
    t.verified,
    t.verification_status,
    l.project_type,
    l.planning_application_id
  FROM public.planning_invite_links l
  LEFT JOIN public.trades t ON t.id = l.trade_id
  WHERE l.token = _token
    AND (l.expires_at IS NULL OR l.expires_at > now())
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_planning_invite(text) TO anon, authenticated;

-- Token-scoped "mark clicked" via SECURITY DEFINER so no table write access is needed
CREATE OR REPLACE FUNCTION public.mark_planning_invite_clicked(_token text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  UPDATE public.planning_invite_links
  SET clicked_at = COALESCE(clicked_at, now())
  WHERE token = _token;
$$;

GRANT EXECUTE ON FUNCTION public.mark_planning_invite_clicked(text) TO anon, authenticated;

-- 2. job_matches: prevent trades from reverting status out of terminal states
CREATE OR REPLACE FUNCTION public.guard_job_match_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  -- Admins and service role may change anything
  IF public.has_role(auth.uid(), 'admin') OR auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Ordinary callers (trades) cannot change status at all
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    RAISE EXCEPTION 'Trades cannot modify the status of a job match';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_job_match_update ON public.job_matches;
CREATE TRIGGER trg_guard_job_match_update
  BEFORE UPDATE ON public.job_matches
  FOR EACH ROW EXECUTE FUNCTION public.guard_job_match_update();