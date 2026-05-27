-- Enum for the per-reference check status
DO $$ BEGIN
  CREATE TYPE public.trade_reference_status AS ENUM ('not_contacted', 'contacted', 'verified', 'no_response');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Enum for the relationship dropdown
DO $$ BEGIN
  CREATE TYPE public.trade_reference_relationship AS ENUM ('past_customer', 'trade_contact', 'supplier', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE public.trade_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id UUID REFERENCES public.trades(id) ON DELETE CASCADE,
  applicant_email TEXT,
  contact_name TEXT NOT NULL,
  relationship public.trade_reference_relationship NOT NULL DEFAULT 'other',
  phone TEXT,
  email TEXT,
  status public.trade_reference_status NOT NULL DEFAULT 'not_contacted',
  admin_notes TEXT,
  status_updated_at TIMESTAMPTZ,
  status_updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT trade_references_link_present CHECK (trade_id IS NOT NULL OR applicant_email IS NOT NULL),
  CONSTRAINT trade_references_contact_present CHECK (phone IS NOT NULL OR email IS NOT NULL)
);

CREATE INDEX idx_trade_references_trade_id ON public.trade_references(trade_id);
CREATE INDEX idx_trade_references_applicant_email ON public.trade_references(lower(applicant_email));

-- Grants
GRANT SELECT, INSERT ON public.trade_references TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trade_references TO authenticated;
GRANT ALL ON public.trade_references TO service_role;

ALTER TABLE public.trade_references ENABLE ROW LEVEL SECURITY;

-- Anyone (including unauthenticated applicants) can submit a reference row during signup
CREATE POLICY "Anyone can submit a reference"
ON public.trade_references FOR INSERT
TO anon, authenticated
WITH CHECK (
  -- prevent unauthenticated callers from pre-setting any check-status fields
  status = 'not_contacted'
  AND admin_notes IS NULL
  AND status_updated_at IS NULL
  AND status_updated_by IS NULL
);

-- A trade can read their own references — matched via trades.user_id OR via their signup email on profiles
CREATE POLICY "Trade can view own references"
ON public.trade_references FOR SELECT
TO authenticated
USING (
  trade_id IN (SELECT id FROM public.trades WHERE user_id = auth.uid())
  OR (
    applicant_email IS NOT NULL
    AND lower(applicant_email) = (
      SELECT lower(email) FROM public.profiles WHERE user_id = auth.uid()
    )
  )
);

-- Admins can view all references
CREATE POLICY "Admins can view all references"
ON public.trade_references FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update reference status / notes
CREATE POLICY "Admins can update references"
ON public.trade_references FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admins can delete references (e.g. duplicates)
CREATE POLICY "Admins can delete references"
ON public.trade_references FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Auto-update updated_at + status_updated_at
CREATE OR REPLACE FUNCTION public.trade_references_touch()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    NEW.status_updated_at = now();
    NEW.status_updated_by = auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_trade_references_touch
BEFORE UPDATE ON public.trade_references
FOR EACH ROW
EXECUTE FUNCTION public.trade_references_touch();