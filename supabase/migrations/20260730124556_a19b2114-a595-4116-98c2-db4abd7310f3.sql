-- 1. Remove blanket anon access to guest records
DROP POLICY IF EXISTS pir_anon_select_guest ON public.project_intelligence_records;
DROP POLICY IF EXISTS pir_anon_update_guest ON public.project_intelligence_records;

-- 2. Token-scoped guest access via SECURITY DEFINER RPCs
CREATE OR REPLACE FUNCTION public.pir_guest_get(_id uuid, _token uuid)
RETURNS SETOF public.project_intelligence_records
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT *
  FROM public.project_intelligence_records r
  WHERE r.id = _id
    AND r.edit_token = _token
    AND (r.user_id IS NULL OR r.user_id = auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.pir_guest_update(
  _id uuid,
  _token uuid,
  _project_type text DEFAULT NULL,
  _current_stage text DEFAULT NULL,
  _builder_data jsonb DEFAULT NULL,
  _current_step smallint DEFAULT NULL,
  _status text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_row public.project_intelligence_records;
BEGIN
  SELECT * INTO v_row
  FROM public.project_intelligence_records
  WHERE id = _id AND edit_token = _token
    AND (user_id IS NULL OR user_id = auth.uid());

  IF v_row.id IS NULL THEN
    RAISE EXCEPTION 'Record not found or token invalid';
  END IF;

  IF _status IS NOT NULL AND _status NOT IN ('draft','analysing','complete','builder_draft') THEN
    RAISE EXCEPTION 'Invalid status';
  END IF;

  UPDATE public.project_intelligence_records
  SET project_type  = COALESCE(_project_type, project_type),
      current_stage = COALESCE(_current_stage, current_stage),
      builder_data  = COALESCE(_builder_data, builder_data),
      current_step  = COALESCE(_current_step, current_step),
      status        = COALESCE(_status, status),
      updated_at    = now()
  WHERE id = _id;
END;
$$;

REVOKE ALL ON FUNCTION public.pir_guest_get(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.pir_guest_update(uuid, uuid, text, text, jsonb, smallint, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pir_guest_get(uuid, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.pir_guest_update(uuid, uuid, text, text, jsonb, smallint, text) TO anon, authenticated;

-- 3. Lock down the project-clarity storage bucket to owner folders
DROP POLICY IF EXISTS project_clarity_select_any ON storage.objects;
DROP POLICY IF EXISTS project_clarity_insert_any ON storage.objects;
DROP POLICY IF EXISTS project_clarity_delete_any ON storage.objects;

CREATE POLICY project_clarity_owner_select ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'project-clarity' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY project_clarity_owner_insert ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'project-clarity' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY project_clarity_owner_update ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'project-clarity' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'project-clarity' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY project_clarity_owner_delete ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'project-clarity' AND (storage.foldername(name))[1] = auth.uid()::text);