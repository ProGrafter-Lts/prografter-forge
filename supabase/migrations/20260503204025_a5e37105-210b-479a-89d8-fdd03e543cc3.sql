CREATE TABLE public.testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote text NOT NULL CHECK (char_length(quote) > 0 AND char_length(quote) <= 280),
  author_first_name text NOT NULL CHECK (char_length(author_first_name) BETWEEN 1 AND 80),
  author_trade_or_role text NOT NULL CHECK (char_length(author_trade_or_role) BETWEEN 1 AND 120),
  author_photo_url text,
  rating int CHECK (rating BETWEEN 1 AND 5),
  approved boolean NOT NULL DEFAULT false,
  source text,
  contract_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_testimonials_approved_created
  ON public.testimonials (approved, created_at DESC);

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

-- Public (anon + authenticated) can read only approved rows
CREATE POLICY "Approved testimonials are public"
  ON public.testimonials FOR SELECT
  TO anon, authenticated
  USING (approved = true);

-- Admins can read everything
CREATE POLICY "Admins can read all testimonials"
  ON public.testimonials FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Admins can insert
CREATE POLICY "Admins can insert testimonials"
  ON public.testimonials FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Admins can update
CREATE POLICY "Admins can update testimonials"
  ON public.testimonials FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete
CREATE POLICY "Admins can delete testimonials"
  ON public.testimonials FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Trigger to keep updated_at fresh
CREATE TRIGGER update_testimonials_updated_at
BEFORE UPDATE ON public.testimonials
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();