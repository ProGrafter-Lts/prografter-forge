CREATE POLICY "pir_anon_select_guest" ON public.project_intelligence_records
  FOR SELECT TO anon USING (user_id IS NULL);

CREATE POLICY "pir_anon_update_guest" ON public.project_intelligence_records
  FOR UPDATE TO anon USING (user_id IS NULL) WITH CHECK (user_id IS NULL);

GRANT SELECT, INSERT, UPDATE ON public.project_intelligence_records TO anon;