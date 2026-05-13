ALTER TABLE public.trades
  ADD COLUMN IF NOT EXISTS verification_reminder_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_verification_reminder_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_trades_pending_reminders
  ON public.trades (created_at)
  WHERE submitted_for_review_at IS NULL AND verification_status = 'pending' AND is_test = false;