CREATE POLICY "Users can view their own pending module checks"
ON public.pending_module_checks
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);