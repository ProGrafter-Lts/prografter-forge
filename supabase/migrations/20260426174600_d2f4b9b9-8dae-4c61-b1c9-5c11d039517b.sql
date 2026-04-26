-- 1. trade_verification_documents table
CREATE TABLE public.trade_verification_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trade_id uuid NOT NULL REFERENCES public.trades(id) ON DELETE CASCADE,
  doc_type text NOT NULL CHECK (doc_type IN ('insurance','id','qualification','other')),
  file_path text NOT NULL,
  original_filename text,
  expiry_date date,
  uploaded_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_trade_verification_docs_trade ON public.trade_verification_documents(trade_id);

ALTER TABLE public.trade_verification_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trades can insert own verification docs"
ON public.trade_verification_documents FOR INSERT TO authenticated
WITH CHECK (trade_id IN (SELECT id FROM public.trades WHERE user_id = auth.uid()));

CREATE POLICY "Trades can view own verification docs"
ON public.trade_verification_documents FOR SELECT TO authenticated
USING (trade_id IN (SELECT id FROM public.trades WHERE user_id = auth.uid()));

CREATE POLICY "Trades can delete own verification docs"
ON public.trade_verification_documents FOR DELETE TO authenticated
USING (trade_id IN (SELECT id FROM public.trades WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view all verification docs"
ON public.trade_verification_documents FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 2. trades column additions
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS insurance_expiry date;
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS submitted_for_review_at timestamptz;

-- 3. Allow admins to UPDATE trades for verification decisions (bypasses the
-- enforce_trade_update_scope trigger, which already exempts admins).
CREATE POLICY "Admins can update any trade"
ON public.trades FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all trades"
ON public.trades FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 4. Storage policies for trade-verification-documents bucket
-- Trades upload to their own {user_id}/ folder
CREATE POLICY "Trades can upload own verification files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'trade-verification-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Trades can read own verification files"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'trade-verification-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Trades can delete own verification files"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'trade-verification-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can read all verification files"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'trade-verification-documents'
  AND public.has_role(auth.uid(), 'admin')
);
