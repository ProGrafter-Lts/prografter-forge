ALTER TABLE public.consents_log ALTER COLUMN user_id DROP NOT NULL;
GRANT INSERT ON public.consents_log TO anon;
CREATE POLICY "Anyone can log cookie consent"
ON public.consents_log FOR INSERT TO anon, authenticated
WITH CHECK (consent_type LIKE 'cookie_%' AND (user_id IS NULL OR user_id = auth.uid()));