-- Explicit deny-by-default for legacy table — only admins may read historical rows.
-- No INSERT / UPDATE / DELETE policies = blocked for everyone except service_role.
CREATE POLICY "Admins can read legacy contracts"
  ON public.contracts_legacy FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));