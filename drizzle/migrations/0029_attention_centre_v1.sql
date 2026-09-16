-- Contact / support enquiries: currently email-only, no canonical record.
CREATE TABLE public.contact_enquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  source text NOT NULL DEFAULT 'contact_form',
  status text NOT NULL DEFAULT 'new',
  admin_notes text,
  responded_at timestamptz,
  responded_by uuid,
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.contact_enquiries TO anon;
GRANT SELECT, INSERT, UPDATE ON public.contact_enquiries TO authenticated;
GRANT ALL ON public.contact_enquiries TO service_role;

ALTER TABLE public.contact_enquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit an enquiry"
  ON public.contact_enquiries FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can read enquiries"
  ON public.contact_enquiries FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update enquiries"
  ON public.contact_enquiries FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER contact_enquiries_touch
  BEFORE UPDATE ON public.contact_enquiries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX contact_enquiries_status_created_idx
  ON public.contact_enquiries (status, created_at DESC);

-- Manual resolution log for attention items derived from canonical records.
-- References the source record; never duplicates its content or state.
CREATE TABLE public.attention_resolutions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type text NOT NULL,
  source_id text NOT NULL,
  resolved_by uuid NOT NULL,
  resolved_by_email text,
  note text,
  resolved_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_type, source_id)
);

GRANT SELECT, INSERT, DELETE ON public.attention_resolutions TO authenticated;
GRANT ALL ON public.attention_resolutions TO service_role;

ALTER TABLE public.attention_resolutions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read attention resolutions"
  ON public.attention_resolutions FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can resolve attention items"
  ON public.attention_resolutions FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND resolved_by = auth.uid());

CREATE POLICY "Admins can reopen attention items"
  ON public.attention_resolutions FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));