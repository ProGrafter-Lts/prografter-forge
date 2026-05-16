
CREATE TABLE public.supplier_interest (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name text NOT NULL,
  contact_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  category text NOT NULL,
  specialist_type text,
  postcode text NOT NULL,
  service_area text NOT NULL DEFAULT '',
  years_trading integer NOT NULL DEFAULT 0,
  has_public_liability boolean NOT NULL DEFAULT false,
  public_liability_amount text,
  website text,
  notes text,
  status text NOT NULL DEFAULT 'new',
  admin_notes text,
  contacted_at timestamptz,
  qualified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT supplier_interest_category_check CHECK (category IN ('scaffolding','plant_skip_hire','specialist_service')),
  CONSTRAINT supplier_interest_status_check CHECK (status IN ('new','contacted','qualified','phase_b_ready','declined','duplicate'))
);

ALTER TABLE public.supplier_interest ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit supplier interest"
  ON public.supplier_interest FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND char_length(email) BETWEEN 3 AND 320
    AND char_length(business_name) BETWEEN 1 AND 200
    AND char_length(contact_name) BETWEEN 1 AND 200
    AND char_length(phone) BETWEEN 5 AND 40
    AND char_length(postcode) BETWEEN 1 AND 20
    AND char_length(service_area) <= 500
    AND (specialist_type IS NULL OR char_length(specialist_type) <= 100)
    AND (public_liability_amount IS NULL OR char_length(public_liability_amount) <= 50)
    AND (website IS NULL OR char_length(website) <= 300)
    AND (notes IS NULL OR char_length(notes) <= 2000)
    AND category IN ('scaffolding','plant_skip_hire','specialist_service')
    AND status = 'new'
    AND admin_notes IS NULL
    AND contacted_at IS NULL
    AND qualified_at IS NULL
  );

CREATE POLICY "Admins can view supplier interest"
  ON public.supplier_interest FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update supplier interest"
  ON public.supplier_interest FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_supplier_interest_updated_at
  BEFORE UPDATE ON public.supplier_interest
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_supplier_interest_status ON public.supplier_interest(status);
CREATE INDEX idx_supplier_interest_category ON public.supplier_interest(category);
CREATE INDEX idx_supplier_interest_created_at ON public.supplier_interest(created_at DESC);
