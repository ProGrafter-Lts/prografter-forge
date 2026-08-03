-- 1) Project-clarity bucket: verify ownership via join to project_intelligence_records
CREATE OR REPLACE FUNCTION public.pc_path_belongs_to_user(_name text, _uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT _uid IS NOT NULL
     AND (storage.foldername(_name))[1] = _uid::text
     AND (
       (storage.foldername(_name))[2] IS NULL
       OR (storage.foldername(_name))[2] !~ '^[0-9a-fA-F-]{36}$'
       OR EXISTS (
         SELECT 1 FROM public.project_intelligence_records r
         WHERE r.id = ((storage.foldername(_name))[2])::uuid
           AND r.user_id = _uid
       )
     );
$$;

DROP POLICY IF EXISTS project_clarity_owner_select ON storage.objects;
DROP POLICY IF EXISTS project_clarity_owner_insert ON storage.objects;
DROP POLICY IF EXISTS project_clarity_owner_update ON storage.objects;
DROP POLICY IF EXISTS project_clarity_owner_delete ON storage.objects;

CREATE POLICY project_clarity_owner_select ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'project-clarity' AND public.pc_path_belongs_to_user(name, auth.uid()));

CREATE POLICY project_clarity_owner_insert ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'project-clarity' AND public.pc_path_belongs_to_user(name, auth.uid()));

CREATE POLICY project_clarity_owner_update ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'project-clarity' AND public.pc_path_belongs_to_user(name, auth.uid()))
WITH CHECK (bucket_id = 'project-clarity' AND public.pc_path_belongs_to_user(name, auth.uid()));

CREATE POLICY project_clarity_owner_delete ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'project-clarity' AND public.pc_path_belongs_to_user(name, auth.uid()));

-- 2) Admin management of trade verification documents
DROP POLICY IF EXISTS "Admins can update verification docs" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete verification docs" ON storage.objects;

CREATE POLICY "Admins can update verification docs" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'trade-verification-documents' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'trade-verification-documents' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete verification docs" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'trade-verification-documents' AND public.has_role(auth.uid(), 'admin'));

-- 3) Explicitly deny anonymous reads/updates/deletes of guest project intelligence records
REVOKE SELECT, UPDATE, DELETE ON public.project_intelligence_records FROM anon;
GRANT INSERT ON public.project_intelligence_records TO anon;

CREATE POLICY pir_anon_no_select ON public.project_intelligence_records
AS RESTRICTIVE FOR SELECT TO anon
USING (false);
