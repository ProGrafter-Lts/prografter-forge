CREATE TABLE public.quickbuild_generations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trade_user_id UUID NOT NULL,
  quote_id UUID NULL,
  transcript TEXT NOT NULL DEFAULT '',
  photo_paths TEXT[] NOT NULL DEFAULT '{}',
  structured_input JSONB NOT NULL DEFAULT '{}'::jsonb,
  ai_output JSONB NOT NULL DEFAULT '{}'::jsonb,
  final_output JSONB NULL,
  was_sent BOOLEAN NOT NULL DEFAULT false,
  won_lost TEXT NULL,
  actual_labour_days INTEGER NULL,
  actual_materials_pence INTEGER NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_quickbuild_generations_trade_user ON public.quickbuild_generations(trade_user_id, created_at DESC);

ALTER TABLE public.quickbuild_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trades view their own quickbuild rows"
ON public.quickbuild_generations FOR SELECT
USING (auth.uid() = trade_user_id);

CREATE POLICY "Trades insert their own quickbuild rows"
ON public.quickbuild_generations FOR INSERT
WITH CHECK (auth.uid() = trade_user_id);

CREATE POLICY "Trades update their own quickbuild rows"
ON public.quickbuild_generations FOR UPDATE
USING (auth.uid() = trade_user_id);

CREATE POLICY "Admins view all quickbuild rows"
ON public.quickbuild_generations FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_quickbuild_generations_updated_at
BEFORE UPDATE ON public.quickbuild_generations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO storage.buckets (id, name, public) VALUES ('quickbuild-photos', 'quickbuild-photos', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Trades upload their own quickbuild photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'quickbuild-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Trades read their own quickbuild photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'quickbuild-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Trades delete their own quickbuild photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'quickbuild-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);