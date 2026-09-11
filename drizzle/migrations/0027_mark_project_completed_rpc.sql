CREATE OR REPLACE FUNCTION public.mark_project_completed(_job_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _has_completion boolean;
BEGIN
  IF NOT public.user_is_job_participant(auth.uid(), _job_id) THEN
    RAISE EXCEPTION 'not a participant of this project';
  END IF;

  SELECT EXISTS (SELECT 1 FROM public.project_completions WHERE job_id = _job_id)
    INTO _has_completion;

  IF NOT _has_completion THEN
    RAISE EXCEPTION 'no completion record for this project';
  END IF;

  UPDATE public.jobs
     SET stage = 'completed',
         status = 'completed'
   WHERE id = _job_id;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_project_completed(uuid) TO authenticated;