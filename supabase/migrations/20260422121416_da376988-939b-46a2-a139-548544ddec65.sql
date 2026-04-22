-- Add per-trade preference for hiding dismissed (dead) leads from the planning feed
ALTER TABLE public.planning_alert_subs
  ADD COLUMN IF NOT EXISTS hide_dismissed_leads boolean NOT NULL DEFAULT true;

-- Add applicant phone capture on planning alerts (for "Call now" tel: link).
-- PlanIt's public feed rarely includes this, so it'll be NULL for most rows —
-- the UI must handle that case by disabling the call button.
ALTER TABLE public.planning_alerts
  ADD COLUMN IF NOT EXISTS applicant_phone text;