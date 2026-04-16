-- Remove existing duplicates, keeping the earliest signup per (email, user_type)
DELETE FROM public.early_signups a
USING public.early_signups b
WHERE a.ctid < b.ctid
  AND lower(a.email) = lower(b.email)
  AND a.user_type = b.user_type;

-- Add a unique index on lowercased email + user_type
CREATE UNIQUE INDEX IF NOT EXISTS early_signups_email_user_type_unique
  ON public.early_signups (lower(email), user_type);