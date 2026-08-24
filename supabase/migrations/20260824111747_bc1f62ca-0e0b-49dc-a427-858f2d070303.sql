CREATE TABLE public.trade_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id uuid NOT NULL REFERENCES public.trades(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  link text,
  job_id uuid,
  invitation_id uuid,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, UPDATE ON public.trade_notifications TO authenticated;
GRANT ALL ON public.trade_notifications TO service_role;

ALTER TABLE public.trade_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trades can view their own notifications"
ON public.trade_notifications FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Trades can mark their own notifications read"
ON public.trade_notifications FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE INDEX idx_trade_notifications_user_unread
  ON public.trade_notifications (user_id, read_at, created_at DESC);

CREATE UNIQUE INDEX idx_trade_notifications_dedupe
  ON public.trade_notifications (invitation_id, type)
  WHERE invitation_id IS NOT NULL;

CREATE TRIGGER update_trade_notifications_updated_at
BEFORE UPDATE ON public.trade_notifications
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.job_trade_invitations
  ADD COLUMN IF NOT EXISTS sms_reminder_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS notified_at timestamptz;