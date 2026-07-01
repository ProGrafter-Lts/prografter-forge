
-- 1. Table
CREATE TABLE public.tradevault_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trade_id uuid NOT NULL REFERENCES public.trades(id) ON DELETE CASCADE,
  document_type text NOT NULL,
  file_url text,
  original_filename text,
  provider_name text,
  policy_or_membership_number text,
  cover_amount numeric,
  issue_date date,
  expiry_date date,
  status text NOT NULL DEFAULT 'uploaded',
  trade_notes text,
  admin_notes text,
  rejection_reason text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  is_current boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_tradevault_documents_trade ON public.tradevault_documents(trade_id);

-- 2. Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tradevault_documents TO authenticated;
GRANT ALL ON public.tradevault_documents TO service_role;

-- 3. RLS
ALTER TABLE public.tradevault_documents ENABLE ROW LEVEL SECURITY;

-- helper: does the caller own this trade?
CREATE OR REPLACE FUNCTION public.owns_trade(_user_id uuid, _trade_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.trades t WHERE t.id = _trade_id AND t.user_id = _user_id)
$$;

-- 4. Policies
CREATE POLICY "Trades view own vault docs" ON public.tradevault_documents
  FOR SELECT TO authenticated
  USING (public.owns_trade(auth.uid(), trade_id) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Trades insert own vault docs" ON public.tradevault_documents
  FOR INSERT TO authenticated
  WITH CHECK (public.owns_trade(auth.uid(), trade_id));

CREATE POLICY "Trades update own vault docs" ON public.tradevault_documents
  FOR UPDATE TO authenticated
  USING (public.owns_trade(auth.uid(), trade_id))
  WITH CHECK (public.owns_trade(auth.uid(), trade_id));

CREATE POLICY "Admins update any vault docs" ON public.tradevault_documents
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Trades delete own vault docs" ON public.tradevault_documents
  FOR DELETE TO authenticated
  USING (public.owns_trade(auth.uid(), trade_id));

-- 5. updated_at trigger
CREATE TRIGGER trg_tradevault_documents_updated_at
  BEFORE UPDATE ON public.tradevault_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Verification tracking column on trades
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS verification_last_checked_at timestamptz;
