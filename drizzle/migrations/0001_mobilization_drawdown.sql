-- Trade Stripe Connect destination (needed for drawdown transfers)
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS stripe_connect_account_id text;

-- 1. PROJECT WALLET -----------------------------------------------------
CREATE TABLE public.project_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL UNIQUE REFERENCES public.jobs(id) ON DELETE CASCADE,
  contract_id uuid REFERENCES public.contracts(id) ON DELETE SET NULL,
  homeowner_id uuid NOT NULL REFERENCES public.homeowners(id) ON DELETE CASCADE,
  trade_id uuid NOT NULL REFERENCES public.trades(id) ON DELETE CASCADE,
  currency text NOT NULL DEFAULT 'gbp',
  booked_start_date date,
  mobilization_target_request_date date,
  mobilization_hard_deadline date,
  start_date_at_risk boolean NOT NULL DEFAULT false,
  start_date_at_risk_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.project_wallets TO authenticated;
GRANT ALL ON public.project_wallets TO service_role;
ALTER TABLE public.project_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parties can view their project wallet"
ON public.project_wallets FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.homeowners h WHERE h.id = homeowner_id AND h.user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.trades t WHERE t.id = trade_id AND t.user_id = auth.uid())
);

-- 2. PER-STAGE FUNDING ---------------------------------------------------
CREATE TABLE public.project_wallet_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id uuid NOT NULL REFERENCES public.project_wallets(id) ON DELETE CASCADE,
  project_stage_id uuid REFERENCES public.project_stages(id) ON DELETE SET NULL,
  stage_name text NOT NULL,
  stage_order integer NOT NULL,
  is_mobilization boolean NOT NULL DEFAULT false,
  expected_amount_pence integer NOT NULL CHECK (expected_amount_pence >= 0),
  funded_amount_pence integer NOT NULL DEFAULT 0 CHECK (funded_amount_pence >= 0),
  released_amount_pence integer NOT NULL DEFAULT 0 CHECK (released_amount_pence >= 0),
  -- expected | deposit_requested | funded | released
  funding_status text NOT NULL DEFAULT 'expected',
  deposit_requested_at timestamptz,
  deposit_reminder_sent_at timestamptz,
  funded_at timestamptz,
  released_at timestamptz,
  awaiting_funds boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (wallet_id, stage_order)
);

GRANT SELECT ON public.project_wallet_stages TO authenticated;
GRANT ALL ON public.project_wallet_stages TO service_role;
ALTER TABLE public.project_wallet_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parties can view wallet stages"
ON public.project_wallet_stages FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.project_wallets w
    WHERE w.id = wallet_id
      AND (
        EXISTS (SELECT 1 FROM public.homeowners h WHERE h.id = w.homeowner_id AND h.user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.trades t WHERE t.id = w.trade_id AND t.user_id = auth.uid())
      )
  )
);

-- 3/4/5. DRAWDOWN REQUESTS ----------------------------------------------
CREATE TABLE public.drawdown_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id uuid NOT NULL REFERENCES public.project_wallets(id) ON DELETE CASCADE,
  wallet_stage_id uuid NOT NULL REFERENCES public.project_wallet_stages(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  trade_id uuid NOT NULL REFERENCES public.trades(id) ON DELETE CASCADE,
  homeowner_id uuid NOT NULL REFERENCES public.homeowners(id) ON DELETE CASCADE,
  amount_pence integer NOT NULL CHECK (amount_pence > 0),
  description text NOT NULL,
  -- private: trade-only, never exposed to the homeowner
  proforma_path text NOT NULL,
  proforma_filename text,
  status text NOT NULL DEFAULT 'pending_approval',
  created_by uuid NOT NULL,
  decided_by uuid,
  decided_at timestamptz,
  decline_reason text,
  stripe_transfer_id text,
  transfer_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT drawdown_status_valid CHECK (status IN ('pending_approval','approved','declined','transfer_failed'))
);

GRANT SELECT ON public.drawdown_requests TO authenticated;
GRANT ALL ON public.drawdown_requests TO service_role;
ALTER TABLE public.drawdown_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parties can view drawdown requests"
ON public.drawdown_requests FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.homeowners h WHERE h.id = homeowner_id AND h.user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.trades t WHERE t.id = trade_id AND t.user_id = auth.uid())
);

-- 6. AUDIT TRAIL (append-only) -------------------------------------------
CREATE TABLE public.drawdown_audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid REFERENCES public.drawdown_requests(id) ON DELETE CASCADE,
  wallet_id uuid NOT NULL REFERENCES public.project_wallets(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  actor_user_id uuid,
  actor_role text,
  detail jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.drawdown_audit_events TO authenticated;
GRANT SELECT, INSERT ON public.drawdown_audit_events TO service_role;
ALTER TABLE public.drawdown_audit_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parties can view drawdown audit trail"
ON public.drawdown_audit_events FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.project_wallets w
    WHERE w.id = wallet_id
      AND (
        EXISTS (SELECT 1 FROM public.homeowners h WHERE h.id = w.homeowner_id AND h.user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.trades t WHERE t.id = w.trade_id AND t.user_id = auth.uid())
      )
  )
);

-- Hard immutability: audit rows can never be changed or removed.
CREATE OR REPLACE FUNCTION public.drawdown_audit_immutable()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'drawdown_audit_events is append-only';
END;
$$;

CREATE TRIGGER drawdown_audit_no_update
BEFORE UPDATE OR DELETE ON public.drawdown_audit_events
FOR EACH ROW EXECUTE FUNCTION public.drawdown_audit_immutable();

CREATE TRIGGER project_wallets_touch BEFORE UPDATE ON public.project_wallets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER project_wallet_stages_touch BEFORE UPDATE ON public.project_wallet_stages
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER drawdown_requests_touch BEFORE UPDATE ON public.drawdown_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_drawdown_requests_wallet ON public.drawdown_requests(wallet_id, created_at DESC);
CREATE INDEX idx_drawdown_audit_wallet ON public.drawdown_audit_events(wallet_id, created_at DESC);
CREATE INDEX idx_wallet_stages_wallet ON public.project_wallet_stages(wallet_id, stage_order);