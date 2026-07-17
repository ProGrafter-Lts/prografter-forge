
-- Files are stored under: {survey_id}/{filename}
-- The surveyor who created the survey (or an admin) can read/write their own folder.

CREATE POLICY "Atlas evidence read own"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'atlas-evidence'
    AND (
      public.user_owns_atlas_survey(auth.uid(), (split_part(name, '/', 1))::uuid)
      OR public.has_role(auth.uid(),'admin')
    )
  );

CREATE POLICY "Atlas evidence insert own"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'atlas-evidence'
    AND public.user_owns_atlas_survey(auth.uid(), (split_part(name, '/', 1))::uuid)
  );

CREATE POLICY "Atlas evidence update own"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'atlas-evidence'
    AND public.user_owns_atlas_survey(auth.uid(), (split_part(name, '/', 1))::uuid)
  );

CREATE POLICY "Atlas evidence delete own"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'atlas-evidence'
    AND (
      public.user_owns_atlas_survey(auth.uid(), (split_part(name, '/', 1))::uuid)
      OR public.has_role(auth.uid(),'admin')
    )
  );
