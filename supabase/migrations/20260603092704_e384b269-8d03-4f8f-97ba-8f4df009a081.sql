ALTER TABLE public.early_signups
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS admin_notes text,
  ADD COLUMN IF NOT EXISTS status_updated_at timestamptz;

GRANT SELECT, UPDATE ON public.early_signups TO authenticated;
GRANT ALL ON public.early_signups TO service_role;

CREATE POLICY "Admins can read early signups"
ON public.early_signups
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update early signups"
ON public.early_signups
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));