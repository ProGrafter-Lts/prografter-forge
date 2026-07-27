
CREATE POLICY "project_clarity_insert_any"
ON storage.objects FOR INSERT TO anon, authenticated
WITH CHECK (bucket_id = 'project-clarity');

CREATE POLICY "project_clarity_select_any"
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'project-clarity');

CREATE POLICY "project_clarity_delete_any"
ON storage.objects FOR DELETE TO anon, authenticated
USING (bucket_id = 'project-clarity');
