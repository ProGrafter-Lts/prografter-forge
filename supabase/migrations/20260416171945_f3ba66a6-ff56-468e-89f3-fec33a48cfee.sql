
-- Add local_authority, viewed, actioned columns to planning_alerts
ALTER TABLE public.planning_alerts
ADD COLUMN local_authority text,
ADD COLUMN viewed boolean NOT NULL DEFAULT false,
ADD COLUMN actioned boolean NOT NULL DEFAULT false,
ADD COLUMN planning_portal_url text;
