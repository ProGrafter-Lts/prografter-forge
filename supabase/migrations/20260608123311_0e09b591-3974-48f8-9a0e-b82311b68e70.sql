CREATE TABLE IF NOT EXISTS public.supplier_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  business_name text NOT NULL,
  contact_name text,
  email text NOT NULL,
  phone text,
  postcode text,
  service_area text,
  supplier_types text[] DEFAULT '{}',
  also_a_trade boolean NOT NULL DEFAULT false,
  trade_type text,
  notes text,
  consent boolean NOT NULL DEFAULT false,
  source text DEFAULT 'website'
);

GRANT INSERT ON public.supplier_waitlist TO anon;
GRANT INSERT ON public.supplier_waitlist TO authenticated;
GRANT ALL ON public.supplier_waitlist TO service_role;

ALTER TABLE public.supplier_waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon can insert supplier waitlist" ON public.supplier_waitlist
  FOR INSERT TO anon, authenticated WITH CHECK (true);