CREATE OR REPLACE FUNCTION public.pc_path_belongs_to_user(_name text, _uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'storage'
AS $$
  SELECT _uid IS NOT NULL
     AND _name IS NOT NULL
     AND (storage.foldername(_name))[1] = _uid::text
     AND (storage.foldername(_name))[2] ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
     AND EXISTS (
       SELECT 1 FROM public.project_intelligence_records r
       WHERE r.id = ((storage.foldername(_name))[2])::uuid
         AND r.user_id = _uid
     );
$$;