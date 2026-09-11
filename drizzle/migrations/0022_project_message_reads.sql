CREATE TABLE IF NOT EXISTS public.project_message_reads (
  user_id UUID NOT NULL,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, job_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_message_reads TO authenticated;
GRANT ALL ON public.project_message_reads TO service_role;

ALTER TABLE public.project_message_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own message read state"
ON public.project_message_reads
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_project_message_reads_user ON public.project_message_reads(user_id);