CREATE POLICY "Admins can delete trade application docs"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'trade-application-docs' AND public.has_role(auth.uid(), 'admin'));