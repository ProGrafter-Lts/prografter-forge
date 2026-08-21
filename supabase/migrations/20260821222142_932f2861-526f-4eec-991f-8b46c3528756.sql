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

  SELECT id, title, description, postcode, ref INTO j FROM public.jobs WHERE id = q.job_id;
  SELECT full_name INTO t FROM public.profiles WHERE user_id = q.trade_id;

  RETURN jsonb_build_object(
    'quote', to_jsonb(q) - 'accept_token',
    'job', CASE WHEN j.id IS NULL THEN NULL ELSE jsonb_build_object('id', j.id, 'title', j.title, 'description', j.description, 'postcode', j.postcode, 'ref', j.ref) END,
    'trade', CASE WHEN t IS NULL THEN NULL ELSE jsonb_build_object('company_name', t.full_name) END
  );
END;
$$;