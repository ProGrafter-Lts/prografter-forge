CREATE OR REPLACE FUNCTION public.pir_guest_create()
RETURNS TABLE(id uuid, edit_token uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_id uuid;
  v_token uuid;
BEGIN
  INSERT INTO public.project_intelligence_records (user_id, current_step)
  VALUES (auth.uid(), 1)
  RETURNING project_intelligence_records.id, project_intelligence_records.edit_token
  INTO v_id, v_token;

  id := v_id;
  edit_token := v_token;
  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.pir_guest_create() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pir_guest_create() TO anon, authenticated;