
-- Materials log
CREATE TABLE public.materials_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  trade_id uuid NOT NULL,
  category text NOT NULL DEFAULT '',
  manufacturer text NOT NULL DEFAULT '',
  product_name text NOT NULL DEFAULT '',
  specification text DEFAULT '',
  quantity text DEFAULT '',
  colour_finish text DEFAULT '',
  supplier text DEFAULT '',
  batch_reference text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.materials_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trades can insert materials for matched jobs"
ON public.materials_log FOR INSERT TO authenticated
WITH CHECK (
  trade_id IN (SELECT t.id FROM trades t WHERE t.user_id = auth.uid())
  AND job_id IN (SELECT jm.job_id FROM job_matches jm WHERE jm.trade_id IN (SELECT t.id FROM trades t WHERE t.user_id = auth.uid()))
);

CREATE POLICY "Trades can view materials for matched jobs"
ON public.materials_log FOR SELECT TO authenticated
USING (
  trade_id IN (SELECT t.id FROM trades t WHERE t.user_id = auth.uid())
);

CREATE POLICY "Homeowners can view materials for own jobs"
ON public.materials_log FOR SELECT TO authenticated
USING (
  job_id IN (SELECT j.id FROM jobs j WHERE j.homeowner_id IN (SELECT h.id FROM homeowners h WHERE h.user_id = auth.uid()))
);

-- Project certificates
CREATE TABLE public.project_certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  cert_type text NOT NULL DEFAULT '',
  document_name text NOT NULL DEFAULT '',
  issuing_body text DEFAULT '',
  reference_number text DEFAULT '',
  issue_date date,
  file_url text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.project_certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trades can insert certs for matched jobs"
ON public.project_certificates FOR INSERT TO authenticated
WITH CHECK (
  job_id IN (SELECT jm.job_id FROM job_matches jm WHERE jm.trade_id IN (SELECT t.id FROM trades t WHERE t.user_id = auth.uid()))
);

CREATE POLICY "Trades can view certs for matched jobs"
ON public.project_certificates FOR SELECT TO authenticated
USING (
  job_id IN (SELECT jm.job_id FROM job_matches jm WHERE jm.trade_id IN (SELECT t.id FROM trades t WHERE t.user_id = auth.uid()))
);

CREATE POLICY "Homeowners can view certs for own jobs"
ON public.project_certificates FOR SELECT TO authenticated
USING (
  job_id IN (SELECT j.id FROM jobs j WHERE j.homeowner_id IN (SELECT h.id FROM homeowners h WHERE h.user_id = auth.uid()))
);

-- Project warranties
CREATE TABLE public.project_warranties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  trade_id uuid NOT NULL,
  item text NOT NULL DEFAULT '',
  manufacturer text NOT NULL DEFAULT '',
  warranty_period_months integer NOT NULL DEFAULT 12,
  expiry_date date,
  coverage text DEFAULT '',
  claim_contact text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.project_warranties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trades can insert warranties for matched jobs"
ON public.project_warranties FOR INSERT TO authenticated
WITH CHECK (
  trade_id IN (SELECT t.id FROM trades t WHERE t.user_id = auth.uid())
  AND job_id IN (SELECT jm.job_id FROM job_matches jm WHERE jm.trade_id IN (SELECT t.id FROM trades t WHERE t.user_id = auth.uid()))
);

CREATE POLICY "Trades can view own warranties"
ON public.project_warranties FOR SELECT TO authenticated
USING (trade_id IN (SELECT t.id FROM trades t WHERE t.user_id = auth.uid()));

CREATE POLICY "Homeowners can view warranties for own jobs"
ON public.project_warranties FOR SELECT TO authenticated
USING (
  job_id IN (SELECT j.id FROM jobs j WHERE j.homeowner_id IN (SELECT h.id FROM homeowners h WHERE h.user_id = auth.uid()))
);

-- Manual Pro purchases
CREATE TABLE public.manual_pro_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  stripe_payment_id text,
  purchased_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.manual_pro_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own purchases"
ON public.manual_pro_purchases FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own purchases"
ON public.manual_pro_purchases FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- Green project data
CREATE TABLE public.green_project_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  grant_scheme text DEFAULT '',
  grant_reference text DEFAULT '',
  grant_value numeric DEFAULT 0,
  installer_claim_ref text DEFAULT '',
  mcs_cert_number text DEFAULT '',
  system_type text DEFAULT '',
  mcs_install_date date,
  system_specification text DEFAULT '',
  mcs_cert_url text DEFAULT '',
  epc_before text DEFAULT '',
  epc_before_ref text DEFAULT '',
  epc_after text DEFAULT '',
  epc_after_ref text DEFAULT '',
  epc_before_url text DEFAULT '',
  epc_after_url text DEFAULT '',
  solar_panels_model text DEFAULT '',
  solar_panel_count integer DEFAULT 0,
  solar_total_kwp numeric DEFAULT 0,
  solar_inverter text DEFAULT '',
  solar_battery text DEFAULT '',
  solar_expected_yield numeric DEFAULT 0,
  hp_model text DEFAULT '',
  hp_output_kw numeric DEFAULT 0,
  hp_scop numeric DEFAULT 0,
  hp_refrigerant text DEFAULT '',
  hp_cylinder_size text DEFAULT '',
  hp_flow_temp text DEFAULT '',
  insulation_product text DEFAULT '',
  insulation_thickness_mm integer DEFAULT 0,
  insulation_u_value numeric DEFAULT 0,
  insulation_bba_cert text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.green_project_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trades can manage green data for matched jobs"
ON public.green_project_data FOR ALL TO authenticated
USING (
  job_id IN (SELECT jm.job_id FROM job_matches jm WHERE jm.trade_id IN (SELECT t.id FROM trades t WHERE t.user_id = auth.uid()))
)
WITH CHECK (
  job_id IN (SELECT jm.job_id FROM job_matches jm WHERE jm.trade_id IN (SELECT t.id FROM trades t WHERE t.user_id = auth.uid()))
);

CREATE POLICY "Homeowners can view green data for own jobs"
ON public.green_project_data FOR SELECT TO authenticated
USING (
  job_id IN (SELECT j.id FROM jobs j WHERE j.homeowner_id IN (SELECT h.id FROM homeowners h WHERE h.user_id = auth.uid()))
);

-- Storage bucket for manual documents
INSERT INTO storage.buckets (id, name, public) VALUES ('manual-documents', 'manual-documents', true);

CREATE POLICY "Authenticated users can upload manual docs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'manual-documents');

CREATE POLICY "Anyone can view manual docs"
ON storage.objects FOR SELECT
USING (bucket_id = 'manual-documents');
