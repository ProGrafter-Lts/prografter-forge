
CREATE POLICY "Admins read call recordings"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'call-recordings' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins upload call recordings"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'call-recordings' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update call recordings"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'call-recordings' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'call-recordings' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete call recordings"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'call-recordings' AND public.has_role(auth.uid(), 'admin'));
