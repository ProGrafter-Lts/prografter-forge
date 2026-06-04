CREATE OR REPLACE FUNCTION public.create_quote_check(
  _email text,
  _project_type text,
  _postcode text,
  _description text,
  _pdf_url text
)
RETURNS TABLE(id uuid, lookup_token uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_id uuid;
  v_token uuid;
BEGIN
  IF _email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' OR char_length(_email) < 3 OR char_length(_email) > 320 THEN
    RAISE EXCEPTION 'Invalid email';
  END IF;
  IF char_length(COALESCE(_project_type,'')) < 1 OR char_length(_project_type) > 200 THEN
    RAISE EXCEPTION 'Invalid project type';
  END IF;
  IF char_length(COALESCE(_pdf_url,'')) < 1 OR char_length(_pdf_url) > 2048 THEN
    RAISE EXCEPTION 'Invalid file reference';
  END IF;
  IF char_length(COALESCE(_description,'')) > 5000 THEN
    RAISE EXCEPTION 'Description too long';
  END IF;

  INSERT INTO public.quote_checks (email, project_type, postcode, description, pdf_url, status)
  VALUES (_email, _project_type, COALESCE(_postcode,''), COALESCE(_description,''), _pdf_url, 'pending')
  RETURNING quote_checks.id, quote_checks.lookup_token INTO v_id, v_token;

  RETURN QUERY SELECT v_id, v_token;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.create_quote_check(text, text, text, text, text) TO anon, authenticated;