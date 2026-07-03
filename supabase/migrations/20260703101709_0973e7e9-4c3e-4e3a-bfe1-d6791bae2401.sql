
CREATE TABLE public.customer_call_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  homeowner_id uuid REFERENCES public.homeowners(id) ON DELETE SET NULL,
  job_brief_id uuid REFERENCES public.job_briefs(id) ON DELETE SET NULL,
  project_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  quote_check_id uuid REFERENCES public.quote_checks(id) ON DELETE SET NULL,
  admin_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,

  call_type text NOT NULL DEFAULT 'initial_discovery',
  call_status text NOT NULL DEFAULT 'not_started',
  call_date timestamptz,

  homeowner_name text,
  homeowner_email text,
  homeowner_phone text,
  project_reference text,

  consent_given boolean NOT NULL DEFAULT false,
  consent_recorded_at timestamptz,

  recording_path text,
  transcript_text text,
  ai_summary text,

  key_concerns text,
  scope_notes text,
  budget_notes text,
  planning_notes text,
  trade_notes text,
  quote_notes text,
  next_steps text,
  follow_up_date date,

  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  outputs jsonb NOT NULL DEFAULT '{}'::jsonb,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_call_notes TO authenticated;
GRANT ALL ON public.customer_call_notes TO service_role;
ALTER TABLE public.customer_call_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage call notes"
  ON public.customer_call_notes FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_call_notes_updated_at
  BEFORE UPDATE ON public.customer_call_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_call_notes_homeowner ON public.customer_call_notes(homeowner_id);
CREATE INDEX idx_call_notes_job_brief ON public.customer_call_notes(job_brief_id);
CREATE INDEX idx_call_notes_status ON public.customer_call_notes(call_status);
CREATE INDEX idx_call_notes_follow_up ON public.customer_call_notes(follow_up_date);

CREATE TABLE public.customer_call_tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  call_note_id uuid REFERENCES public.customer_call_notes(id) ON DELETE CASCADE,
  homeowner_id uuid REFERENCES public.homeowners(id) ON DELETE SET NULL,
  job_brief_id uuid REFERENCES public.job_briefs(id) ON DELETE SET NULL,
  project_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  quote_check_id uuid REFERENCES public.quote_checks(id) ON DELETE SET NULL,

  title text NOT NULL,
  task_type text,
  due_date date,
  assigned_admin_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'open',

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_call_tasks TO authenticated;
GRANT ALL ON public.customer_call_tasks TO service_role;
ALTER TABLE public.customer_call_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage call tasks"
  ON public.customer_call_tasks FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_call_tasks_updated_at
  BEFORE UPDATE ON public.customer_call_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_call_tasks_note ON public.customer_call_tasks(call_note_id);
CREATE INDEX idx_call_tasks_status ON public.customer_call_tasks(status);

CREATE TABLE public.customer_call_insights (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  call_note_id uuid REFERENCES public.customer_call_notes(id) ON DELETE SET NULL,

  project_type text,
  quote_issue_type text,
  homeowner_concern_type text,
  missing_information text,
  common_confusion text,
  useful_question text,
  agent_training_note text,
  anonymised boolean NOT NULL DEFAULT true,

  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_call_insights TO authenticated;
GRANT ALL ON public.customer_call_insights TO service_role;
ALTER TABLE public.customer_call_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage call insights"
  ON public.customer_call_insights FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
