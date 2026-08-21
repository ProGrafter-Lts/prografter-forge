CREATE OR REPLACE FUNCTION public.get_quote_by_token(_quote_id uuid, _token uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  q public.quotes%ROWTYPE;
  j RECORD;
  t RECORD;
BEGIN
  SELECT * INTO q FROM public.quotes WHERE id = _quote_id AND accept_token = _token;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT id, title, description, postcode, ref INTO j FROM public.job_briefs WHERE id = q.job_id;
  SELECT company_name, trade_type INTO t FROM public.trade_profiles WHERE user_id = q.trade_id;

  RETURN jsonb_build_object(
    'quote', to_jsonb(q) - 'accept_token',
    'job', CASE WHEN j.id IS NULL THEN NULL ELSE jsonb_build_object('id', j.id, 'title', j.title, 'description', j.description, 'postcode', j.postcode, 'ref', j.ref) END,
    'trade', CASE WHEN t IS NULL THEN NULL ELSE jsonb_build_object('company_name', t.company_name, 'trade_type', t.trade_type) END
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.decide_quote_by_token(_quote_id uuid, _token uuid, _decision text)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  q public.quotes%ROWTYPE;
BEGIN
  IF _decision NOT IN ('accepted','declined') THEN
    RAISE EXCEPTION 'invalid decision';
  END IF;

  SELECT * INTO q FROM public.quotes WHERE id = _quote_id AND accept_token = _token;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;

  IF q.status IN ('accepted','declined','withdrawn') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'already_decided', 'status', q.status);
  END IF;

  UPDATE public.quotes
     SET status = _decision,
         agreed_at = CASE WHEN _decision = 'accepted' THEN now() ELSE agreed_at END,
         updated_at = now()
   WHERE id = _quote_id;

  RETURN jsonb_build_object('ok', true, 'status', _decision);
END;
$$;

REVOKE ALL ON FUNCTION public.get_quote_by_token(uuid, uuid) FROM public;
REVOKE ALL ON FUNCTION public.decide_quote_by_token(uuid, uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION public.get_quote_by_token(uuid, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.decide_quote_by_token(uuid, uuid, text) TO anon, authenticated;