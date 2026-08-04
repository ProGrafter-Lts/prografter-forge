-- Admin archive support for job_briefs. Delete already has an RLS policy
-- ("Admins can delete job briefs"); this adds a reversible soft-delete so
-- admins can hide a job from the working list without losing it, and keeps
-- true DELETE for permanent removal of bad/test entries. No new RLS policy
-- needed — archiving is just an UPDATE, already covered by "Admins can
-- update job briefs".
ALTER TABLE public.job_briefs
  ADD COLUMN IF NOT EXISTS archived_at timestamptz,
  ADD COLUMN IF NOT EXISTS archived_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
