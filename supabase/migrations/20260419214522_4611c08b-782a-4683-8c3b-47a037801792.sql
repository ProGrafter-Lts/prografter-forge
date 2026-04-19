CREATE TABLE public.chatbot_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier TEXT NOT NULL,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  message_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(identifier, usage_date)
);

CREATE INDEX idx_chatbot_usage_lookup ON public.chatbot_usage(identifier, usage_date);

ALTER TABLE public.chatbot_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages chatbot usage"
ON public.chatbot_usage
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE TRIGGER update_chatbot_usage_updated_at
BEFORE UPDATE ON public.chatbot_usage
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();