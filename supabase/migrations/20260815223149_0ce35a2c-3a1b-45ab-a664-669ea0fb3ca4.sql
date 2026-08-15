ALTER TABLE public.consents_log DROP CONSTRAINT consents_log_consent_type_check;
ALTER TABLE public.consents_log ADD CONSTRAINT consents_log_consent_type_check
CHECK (consent_type = ANY (ARRAY['terms','marketing','cookie_strictly_necessary','cookie_functional','cookie_analytics','cookie_marketing']));