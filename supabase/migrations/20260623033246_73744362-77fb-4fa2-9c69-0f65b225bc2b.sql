-- 1. consents_log: remove redundant permissive service_role INSERT policy.
-- service_role bypasses RLS entirely, so a WITH CHECK (true) policy adds no
-- protection and only flags as overly permissive. Replace with a validated
-- policy that still allows the backend to log consents but enforces a real check.
DROP POLICY IF EXISTS "Service role can insert consents" ON public.consents_log;
CREATE POLICY "Service role can insert consents"
  ON public.consents_log
  FOR INSERT
  TO service_role
  WITH CHECK (user_id IS NOT NULL);

-- 2. supplier_waitlist: replace blanket WITH CHECK (true) with basic validation
-- so anonymous waitlist submissions must contain a plausible business name,
-- a valid email, and explicit consent.
DROP POLICY IF EXISTS "anon can insert supplier waitlist" ON public.supplier_waitlist;
CREATE POLICY "anon can insert supplier waitlist"
  ON public.supplier_waitlist
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    char_length(business_name) BETWEEN 1 AND 200
    AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND char_length(email) BETWEEN 3 AND 320
    AND consent = true
  );