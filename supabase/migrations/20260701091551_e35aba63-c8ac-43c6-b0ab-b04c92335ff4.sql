
ALTER TABLE public.quote_checks
  ADD COLUMN IF NOT EXISTS checker_type text NOT NULL DEFAULT 'homeowner',
  ADD COLUMN IF NOT EXISTS intake jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS quality_score integer,
  ADD COLUMN IF NOT EXISTS completeness_pct integer,
  ADD COLUMN IF NOT EXISTS risk_level text,
  ADD COLUMN IF NOT EXISTS project_confidence text,
  ADD COLUMN IF NOT EXISTS recommended_next_step text,
  ADD COLUMN IF NOT EXISTS comparison_readiness text,
  ADD COLUMN IF NOT EXISTS certification_readiness text,
  ADD COLUMN IF NOT EXISTS quote_total_text text,
  ADD COLUMN IF NOT EXISTS labour_material text,
  ADD COLUMN IF NOT EXISTS top_issues jsonb,
  ADD COLUMN IF NOT EXISTS requested_matched_trades boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_project boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.create_quote_check_v2(
  _email text,
  _project_type text,
  _postcode text,
  _description text,
  _pdf_url text,
  _checker_type text,
  _intake jsonb
)
RETURNS TABLE(id uuid, lookup_token uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_id uuid;
  v_token uuid;
  v_checker text;
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

  v_checker := lower(COALESCE(NULLIF(_checker_type,''), 'homeowner'));
  IF v_checker NOT IN ('homeowner','trade_self','trade_sub','other') THEN
    v_checker := 'homeowner';
  END IF;

  INSERT INTO public.quote_checks (email, project_type, postcode, description, pdf_url, status, checker_type, intake)
  VALUES (_email, _project_type, COALESCE(_postcode,''), COALESCE(_description,''), _pdf_url, 'pending', v_checker, COALESCE(_intake, '{}'::jsonb))
  RETURNING quote_checks.id, quote_checks.lookup_token INTO v_id, v_token;

  RETURN QUERY SELECT v_id, v_token;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.create_quote_check_v2(text, text, text, text, text, text, jsonb) TO anon, authenticated;
