
-- Planning agents
CREATE TABLE public.planning_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_name text NOT NULL,
  company_name text,
  email text,
  phone text,
  address text,
  relationship_status text NOT NULL DEFAULT 'identified',
  intro_sent boolean NOT NULL DEFAULT false,
  meeting_held boolean NOT NULL DEFAULT false,
  councils_active text[] NOT NULL DEFAULT '{}',
  avg_job_value_estimate numeric,
  notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.planning_agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage planning agents"
  ON public.planning_agents FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Planning leads
CREATE TABLE public.planning_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_ref text NOT NULL,
  council_name text NOT NULL,
  site_address text NOT NULL,
  postcode text,
  application_type text,
  status text NOT NULL DEFAULT 'submitted',
  description text DEFAULT '',
  submitted_date date,
  applicant_name text,
  applicant_address text,
  agent_id uuid REFERENCES public.planning_agents(id) ON DELETE SET NULL,
  trades_likely text[] NOT NULL DEFAULT '{}',
  estimated_value_min numeric,
  estimated_value_max numeric,
  priority_score integer NOT NULL DEFAULT 50,
  pipeline_status text NOT NULL DEFAULT 'new',
  documents_available boolean NOT NULL DEFAULT false,
  form1app_extracted boolean NOT NULL DEFAULT false,
  notes text DEFAULT '',
  next_action text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.planning_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage planning leads"
  ON public.planning_leads FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX planning_leads_agent_id_idx ON public.planning_leads(agent_id);
CREATE INDEX planning_leads_pipeline_status_idx ON public.planning_leads(pipeline_status);

-- Updated-at triggers (reuse existing update_updated_at_column function)
CREATE TRIGGER planning_agents_updated_at
  BEFORE UPDATE ON public.planning_agents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER planning_leads_updated_at
  BEFORE UPDATE ON public.planning_leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
