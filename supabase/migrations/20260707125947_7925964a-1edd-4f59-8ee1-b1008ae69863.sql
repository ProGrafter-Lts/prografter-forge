-- Add columns for multi-document staged pipeline
ALTER TABLE public.quote_checks
  ADD COLUMN IF NOT EXISTS supporting_files jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS document_extractions jsonb,
  ADD COLUMN IF NOT EXISTS merged_evidence jsonb,
  ADD COLUMN IF NOT EXISTS supporting_docs_diagnostic jsonb;

-- Replace create_quote_check_v2 with an added _supporting_files param (default keeps old callers working)
DROP FUNCTION IF EXISTS public.create_quote_check_v2(text, text, text, text, text, text, jsonb);

CREATE OR REPLACE FUNCTION public.create_quote_check_v2(
  _email text,
  _project_type text,
  _postcode text,
  _description text,
  _pdf_url text,
  _checker_type text,
  _intake jsonb,
  _supporting_files jsonb DEFAULT '[]'::jsonb
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
  v_files jsonb;
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

  v_files := COALESCE(_supporting_files, '[]'::jsonb);
  IF jsonb_typeof(v_files) <> 'array' THEN
    v_files := '[]'::jsonb;
  END IF;
  -- Cap at 10 supporting files
  IF jsonb_array_length(v_files) > 10 THEN
    RAISE EXCEPTION 'Too many supporting files (max 10)';
  END IF;

  INSERT INTO public.quote_checks (email, project_type, postcode, description, pdf_url, status, checker_type, intake, supporting_files)
  VALUES (_email, _project_type, COALESCE(_postcode,''), COALESCE(_description,''), _pdf_url, 'pending', v_checker, COALESCE(_intake, '{}'::jsonb), v_files)
  RETURNING quote_checks.id, quote_checks.lookup_token INTO v_id, v_token;

  RETURN QUERY SELECT v_id, v_token;
END;
$function$;