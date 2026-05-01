CREATE OR REPLACE FUNCTION public.set_consents_log_ip()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.ip_address IS NULL THEN
    NEW.ip_address := inet_client_addr();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_consents_log_set_ip ON public.consents_log;

CREATE TRIGGER trg_consents_log_set_ip
BEFORE INSERT ON public.consents_log
FOR EACH ROW
EXECUTE FUNCTION public.set_consents_log_ip();