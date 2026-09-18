CREATE TABLE public.planning_letter_settings (
  id text PRIMARY KEY DEFAULT 'default',
  templates jsonb NOT NULL DEFAULT '{}'::jsonb,
  envelope jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

GRANT SELECT, INSERT, UPDATE ON public.planning_letter_settings TO authenticated;
GRANT ALL ON public.planning_letter_settings TO service_role;

ALTER TABLE public.planning_letter_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read letter settings"
  ON public.planning_letter_settings FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins write letter settings"
  ON public.planning_letter_settings FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update letter settings"
  ON public.planning_letter_settings FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.planning_letter_settings (id) VALUES ('default') ON CONFLICT DO NOTHING;