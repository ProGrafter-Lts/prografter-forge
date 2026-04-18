CREATE POLICY "Admins can view all quote checks"
ON public.quote_checks
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));