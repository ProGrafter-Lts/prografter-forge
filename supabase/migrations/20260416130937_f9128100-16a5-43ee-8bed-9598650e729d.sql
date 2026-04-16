
-- Planning alert subscriptions
CREATE TABLE public.planning_alert_subs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id uuid NOT NULL REFERENCES public.trades(id) ON DELETE CASCADE,
  tier text NOT NULL,
  radius_miles integer NOT NULL DEFAULT 10,
  stripe_subscription_id text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.planning_alert_subs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trades can view own subs"
  ON public.planning_alert_subs FOR SELECT
  TO authenticated
  USING (trade_id IN (SELECT id FROM trades WHERE user_id = auth.uid()));

CREATE POLICY "Trades can insert own subs"
  ON public.planning_alert_subs FOR INSERT
  TO authenticated
  WITH CHECK (trade_id IN (SELECT id FROM trades WHERE user_id = auth.uid()));

CREATE POLICY "Trades can update own subs"
  ON public.planning_alert_subs FOR UPDATE
  TO authenticated
  USING (trade_id IN (SELECT id FROM trades WHERE user_id = auth.uid()));

CREATE TRIGGER update_planning_alert_subs_updated_at
  BEFORE UPDATE ON public.planning_alert_subs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Planning alerts (individual matched applications)
CREATE TABLE public.planning_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id uuid NOT NULL REFERENCES public.trades(id) ON DELETE CASCADE,
  application_ref text NOT NULL,
  address text NOT NULL,
  postcode text NOT NULL,
  application_type text NOT NULL,
  description text,
  distance_miles numeric,
  approved_date date,
  letter_generated boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.planning_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trades can view own alerts"
  ON public.planning_alerts FOR SELECT
  TO authenticated
  USING (trade_id IN (SELECT id FROM trades WHERE user_id = auth.uid()));

CREATE POLICY "Service role can insert alerts"
  ON public.planning_alerts FOR INSERT
  TO authenticated
  WITH CHECK (auth.role() = 'service_role'::text);

CREATE POLICY "Trades can update own alerts"
  ON public.planning_alerts FOR UPDATE
  TO authenticated
  USING (trade_id IN (SELECT id FROM trades WHERE user_id = auth.uid()));
