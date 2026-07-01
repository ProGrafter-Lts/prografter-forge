
-- Helper: trade ids owned by current user
CREATE OR REPLACE FUNCTION public.current_user_owns_trade(_trade_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.trades t
    WHERE t.id = _trade_id AND t.user_id = auth.uid()
  )
$$;

-- ── planning_opportunity_interactions ────────────────────────────────
CREATE TABLE public.planning_opportunity_interactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trade_id uuid NOT NULL REFERENCES public.trades(id) ON DELETE CASCADE,
  planning_application_id text NOT NULL,
  status text NOT NULL DEFAULT 'new',
  notes text,
  follow_up_date date,
  invite_link_id uuid,
  intro_letter_generated boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (trade_id, planning_application_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.planning_opportunity_interactions TO authenticated;
GRANT ALL ON public.planning_opportunity_interactions TO service_role;
ALTER TABLE public.planning_opportunity_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trades manage own opportunity interactions"
ON public.planning_opportunity_interactions
FOR ALL
TO authenticated
USING (public.current_user_owns_trade(trade_id))
WITH CHECK (public.current_user_owns_trade(trade_id));

-- ── planning_invite_links ────────────────────────────────────────────
CREATE TABLE public.planning_invite_links (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trade_id uuid NOT NULL REFERENCES public.trades(id) ON DELETE CASCADE,
  planning_application_id text NOT NULL,
  token text NOT NULL UNIQUE,
  project_type text,
  clicked_at timestamptz,
  submitted_project_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '90 days')
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.planning_invite_links TO authenticated;
GRANT SELECT ON public.planning_invite_links TO anon;
GRANT ALL ON public.planning_invite_links TO service_role;
ALTER TABLE public.planning_invite_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trades manage own invite links"
ON public.planning_invite_links
FOR ALL
TO authenticated
USING (public.current_user_owns_trade(trade_id))
WITH CHECK (public.current_user_owns_trade(trade_id));

-- Anyone holding a link can look it up (token acts as the capability)
CREATE POLICY "Anyone can read invite links by token"
ON public.planning_invite_links
FOR SELECT
TO anon, authenticated
USING (true);

-- ── planning_access ──────────────────────────────────────────────────
CREATE TABLE public.planning_access (
  trade_id uuid NOT NULL PRIMARY KEY REFERENCES public.trades(id) ON DELETE CASCADE,
  access_level text NOT NULL DEFAULT 'founding',
  monthly_limit integer,
  features_enabled jsonb NOT NULL DEFAULT '{}'::jsonb,
  subscription_status text NOT NULL DEFAULT 'founding',
  subscription_started_at timestamptz DEFAULT now(),
  subscription_ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.planning_access TO authenticated;
GRANT ALL ON public.planning_access TO service_role;
ALTER TABLE public.planning_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trades view own access record"
ON public.planning_access
FOR SELECT
TO authenticated
USING (public.current_user_owns_trade(trade_id));

CREATE POLICY "Trades insert own access record"
ON public.planning_access
FOR INSERT
TO authenticated
WITH CHECK (public.current_user_owns_trade(trade_id));

-- updated_at triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$
LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_poi_updated_at
BEFORE UPDATE ON public.planning_opportunity_interactions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_planning_access_updated_at
BEFORE UPDATE ON public.planning_access
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
