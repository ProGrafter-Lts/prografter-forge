
-- Project stages table
CREATE TABLE public.project_stages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  stage_name TEXT NOT NULL,
  stage_order INTEGER NOT NULL DEFAULT 0,
  planned_start DATE,
  planned_end DATE,
  actual_start DATE,
  actual_end DATE,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_amount NUMERIC DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'unpaid',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.project_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Homeowners can view stages for own jobs"
ON public.project_stages FOR SELECT TO authenticated
USING (job_id IN (
  SELECT id FROM public.jobs WHERE homeowner_id IN (
    SELECT id FROM public.homeowners WHERE user_id = auth.uid()
  )
));

CREATE POLICY "Trades can view stages for matched jobs"
ON public.project_stages FOR SELECT TO authenticated
USING (job_id IN (
  SELECT job_id FROM public.job_matches WHERE trade_id IN (
    SELECT id FROM public.trades WHERE user_id = auth.uid()
  )
));

CREATE TRIGGER update_project_stages_updated_at
BEFORE UPDATE ON public.project_stages
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Stage updates table
CREATE TABLE public.stage_updates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stage_id UUID NOT NULL REFERENCES public.project_stages(id) ON DELETE CASCADE,
  trade_id UUID NOT NULL REFERENCES public.trades(id) ON DELETE CASCADE,
  update_text TEXT NOT NULL,
  photo_urls TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.stage_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trades can insert updates for matched stages"
ON public.stage_updates FOR INSERT TO authenticated
WITH CHECK (
  trade_id IN (SELECT id FROM public.trades WHERE user_id = auth.uid())
  AND stage_id IN (
    SELECT ps.id FROM public.project_stages ps
    JOIN public.job_matches jm ON jm.job_id = ps.job_id
    WHERE jm.trade_id IN (SELECT id FROM public.trades WHERE user_id = auth.uid())
  )
);

CREATE POLICY "Homeowners can view updates for own jobs"
ON public.stage_updates FOR SELECT TO authenticated
USING (stage_id IN (
  SELECT ps.id FROM public.project_stages ps
  WHERE ps.job_id IN (
    SELECT id FROM public.jobs WHERE homeowner_id IN (
      SELECT id FROM public.homeowners WHERE user_id = auth.uid()
    )
  )
));

CREATE POLICY "Trades can view updates for matched jobs"
ON public.stage_updates FOR SELECT TO authenticated
USING (stage_id IN (
  SELECT ps.id FROM public.project_stages ps
  JOIN public.job_matches jm ON jm.job_id = ps.job_id
  WHERE jm.trade_id IN (SELECT id FROM public.trades WHERE user_id = auth.uid())
));

-- Project messages table
CREATE TABLE public.project_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_type TEXT NOT NULL DEFAULT 'trade',
  message_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.project_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Homeowners can view messages for own jobs"
ON public.project_messages FOR SELECT TO authenticated
USING (job_id IN (
  SELECT id FROM public.jobs WHERE homeowner_id IN (
    SELECT id FROM public.homeowners WHERE user_id = auth.uid()
  )
));

CREATE POLICY "Trades can view messages for matched jobs"
ON public.project_messages FOR SELECT TO authenticated
USING (job_id IN (
  SELECT job_id FROM public.job_matches WHERE trade_id IN (
    SELECT id FROM public.trades WHERE user_id = auth.uid()
  )
));

CREATE POLICY "Homeowners can send messages on own jobs"
ON public.project_messages FOR INSERT TO authenticated
WITH CHECK (
  sender_type = 'homeowner'
  AND sender_id IN (SELECT id FROM public.homeowners WHERE user_id = auth.uid())
  AND job_id IN (
    SELECT id FROM public.jobs WHERE homeowner_id IN (
      SELECT id FROM public.homeowners WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Trades can send messages on matched jobs"
ON public.project_messages FOR INSERT TO authenticated
WITH CHECK (
  sender_type = 'trade'
  AND sender_id IN (SELECT id FROM public.trades WHERE user_id = auth.uid())
  AND job_id IN (
    SELECT job_id FROM public.job_matches WHERE trade_id IN (
      SELECT id FROM public.trades WHERE user_id = auth.uid())
  )
);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_messages;

-- Variations table
CREATE TABLE public.variations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  trade_id UUID NOT NULL REFERENCES public.trades(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  materials_cost NUMERIC NOT NULL DEFAULT 0,
  labour_cost NUMERIC NOT NULL DEFAULT 0,
  programme_impact_days INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.variations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trades can insert variations on matched jobs"
ON public.variations FOR INSERT TO authenticated
WITH CHECK (
  trade_id IN (SELECT id FROM public.trades WHERE user_id = auth.uid())
  AND job_id IN (
    SELECT job_id FROM public.job_matches WHERE trade_id IN (
      SELECT id FROM public.trades WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Trades can view own variations"
ON public.variations FOR SELECT TO authenticated
USING (trade_id IN (SELECT id FROM public.trades WHERE user_id = auth.uid()));

CREATE POLICY "Homeowners can view variations for own jobs"
ON public.variations FOR SELECT TO authenticated
USING (job_id IN (
  SELECT id FROM public.jobs WHERE homeowner_id IN (
    SELECT id FROM public.homeowners WHERE user_id = auth.uid()
  )
));

CREATE POLICY "Homeowners can update variation status on own jobs"
ON public.variations FOR UPDATE TO authenticated
USING (job_id IN (
  SELECT id FROM public.jobs WHERE homeowner_id IN (
    SELECT id FROM public.homeowners WHERE user_id = auth.uid()
  )
));

CREATE TRIGGER update_variations_updated_at
BEFORE UPDATE ON public.variations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
