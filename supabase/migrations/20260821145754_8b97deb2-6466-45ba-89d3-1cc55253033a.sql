CREATE OR REPLACE FUNCTION public.trade_can_access_homeowner(_user_id uuid, _homeowner_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.jobs j
    JOIN public.job_matches jm ON jm.job_id = j.id
    JOIN public.trades t ON t.id = jm.trade_id
    WHERE t.user_id = _user_id
      AND j.homeowner_id = _homeowner_id
      AND COALESCE(jm.status, '') NOT IN ('rejected','withdrawn','declined')
  )
  OR EXISTS (
    SELECT 1
    FROM public.jobs j
    JOIN public.job_trade_invitations i ON i.job_id = j.id
    JOIN public.trades t ON t.id = i.trade_id
    WHERE t.user_id = _user_id
      AND j.homeowner_id = _homeowner_id
      AND COALESCE(i.status, '') NOT IN ('rejected','withdrawn','declined','expired')
  )
  OR EXISTS (
    SELECT 1
    FROM public.jobs j
    JOIN public.quotes q ON q.job_id = j.id
    JOIN public.trades t ON t.id = q.trade_id
    WHERE t.user_id = _user_id
      AND j.homeowner_id = _homeowner_id
  )
$$;