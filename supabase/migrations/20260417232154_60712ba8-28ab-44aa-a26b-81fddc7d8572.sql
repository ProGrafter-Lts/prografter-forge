
-- 1. Make insurance-certs bucket private
UPDATE storage.buckets SET public = false WHERE id = 'insurance-certs';

-- 2. Create app_role enum + user_roles table for admin verification access
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer role check (avoids recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Users can view their own roles; admins can view all
DROP POLICY IF EXISTS "Users view own roles" ON public.user_roles;
CREATE POLICY "Users view own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage roles" ON public.user_roles;
CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3. Storage RLS for insurance-certs (path: <user_id>/<file>)
DROP POLICY IF EXISTS "Authenticated users can upload insurance certs" ON storage.objects;
DROP POLICY IF EXISTS "Users can read own insurance certs" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own insurance certs" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own insurance certs" ON storage.objects;
DROP POLICY IF EXISTS "Admins can read all insurance certs" ON storage.objects;

CREATE POLICY "Users can upload own insurance certs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'insurance-certs'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can read own insurance certs"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'insurance-certs'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update own insurance certs"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'insurance-certs'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own insurance certs"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'insurance-certs'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Admins can read all insurance certs"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'insurance-certs'
  AND public.has_role(auth.uid(), 'admin')
);
