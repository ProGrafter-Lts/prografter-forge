-- Enum for contact status pipeline
CREATE TYPE public.shortlist_contact_status AS ENUM ('todo', 'contacted', 'quoted', 'won', 'dead');

-- Main table
CREATE TABLE public.planning_alert_shortlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trade_id UUID NOT NULL REFERENCES public.trades(id) ON DELETE CASCADE,
  planning_alert_id UUID NOT NULL REFERENCES public.planning_alerts(id) ON DELETE CASCADE,
  contact_status public.shortlist_contact_status NOT NULL DEFAULT 'todo',
  note TEXT,
  next_action_date DATE,
  last_status_change_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT planning_alert_shortlist_unique_trade_alert UNIQUE (trade_id, planning_alert_id),
  CONSTRAINT planning_alert_shortlist_note_length CHECK (note IS NULL OR char_length(note) <= 2000)
);

-- Index for pipeline-view queries (trade_id + contact_status)
CREATE INDEX idx_planning_alert_shortlist_trade_status
  ON public.planning_alert_shortlist (trade_id, contact_status);

-- Enable RLS
ALTER TABLE public.planning_alert_shortlist ENABLE ROW LEVEL SECURITY;

-- Tradesmen can SELECT their own rows
CREATE POLICY "Trades can view own shortlist"
ON public.planning_alert_shortlist
FOR SELECT
TO authenticated
USING (
  trade_id IN (SELECT id FROM public.trades WHERE user_id = auth.uid())
);

-- Tradesmen can INSERT for themselves
CREATE POLICY "Trades can insert own shortlist"
ON public.planning_alert_shortlist
FOR INSERT
TO authenticated
WITH CHECK (
  trade_id IN (SELECT id FROM public.trades WHERE user_id = auth.uid())
);

-- Tradesmen can UPDATE their own
CREATE POLICY "Trades can update own shortlist"
ON public.planning_alert_shortlist
FOR UPDATE
TO authenticated
USING (
  trade_id IN (SELECT id FROM public.trades WHERE user_id = auth.uid())
)
WITH CHECK (
  trade_id IN (SELECT id FROM public.trades WHERE user_id = auth.uid())
);

-- Tradesmen can DELETE their own
CREATE POLICY "Trades can delete own shortlist"
ON public.planning_alert_shortlist
FOR DELETE
TO authenticated
USING (
  trade_id IN (SELECT id FROM public.trades WHERE user_id = auth.uid())
);

-- Admins can SELECT all
CREATE POLICY "Admins can view all shortlist"
ON public.planning_alert_shortlist
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Trigger function: maintain updated_at + last_status_change_at
CREATE OR REPLACE FUNCTION public.shortlist_touch_timestamps()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  IF TG_OP = 'UPDATE' AND OLD.contact_status IS DISTINCT FROM NEW.contact_status THEN
    NEW.last_status_change_at = now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER planning_alert_shortlist_touch
BEFORE UPDATE ON public.planning_alert_shortlist
FOR EACH ROW
EXECUTE FUNCTION public.shortlist_touch_timestamps();
