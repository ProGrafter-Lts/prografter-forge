
CREATE TABLE public.letters_sent (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trade_id UUID NOT NULL,
  application_reference TEXT NOT NULL,
  address TEXT NOT NULL,
  letter_content TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.letters_sent ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trades can view own letters"
ON public.letters_sent
FOR SELECT
TO authenticated
USING (trade_id IN (
  SELECT id FROM trades WHERE user_id = auth.uid()
));

CREATE POLICY "Trades can insert own letters"
ON public.letters_sent
FOR INSERT
TO authenticated
WITH CHECK (trade_id IN (
  SELECT id FROM trades WHERE user_id = auth.uid()
));

CREATE INDEX idx_letters_sent_trade_id ON public.letters_sent(trade_id);
CREATE INDEX idx_letters_sent_application_ref ON public.letters_sent(application_reference);
