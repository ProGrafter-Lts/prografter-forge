-- Fix RLS Policy Always True warnings on public-write tables
-- by replacing `WITH CHECK (true)` with input-validating checks.

-- early_signups
DROP POLICY IF EXISTS "Anyone can insert early signups" ON public.early_signups;

CREATE POLICY "Anyone can insert early signups"
ON public.early_signups
FOR INSERT
TO anon, authenticated
WITH CHECK (
  email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND char_length(email) BETWEEN 3 AND 320
  AND char_length(name) BETWEEN 1 AND 200
  AND char_length(postcode) BETWEEN 1 AND 20
  AND user_type IN ('homeowner', 'trade')
);

-- quote_checks
DROP POLICY IF EXISTS "Anyone can create quote checks" ON public.quote_checks;

CREATE POLICY "Anyone can create quote checks"
ON public.quote_checks
FOR INSERT
TO anon, authenticated
WITH CHECK (
  email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND char_length(email) BETWEEN 3 AND 320
  AND char_length(project_type) BETWEEN 1 AND 200
  AND char_length(pdf_url) BETWEEN 1 AND 2048
  AND char_length(description) <= 5000
  AND status IN ('pending', 'paid')
);