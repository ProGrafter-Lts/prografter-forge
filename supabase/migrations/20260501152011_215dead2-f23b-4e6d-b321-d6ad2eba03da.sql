REVOKE EXECUTE ON FUNCTION public.generate_contract_reference() FROM anon, public, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_contract_reference() FROM anon, public, authenticated;
REVOKE EXECUTE ON FUNCTION public.dispatch_contract_event_email() FROM anon, public, authenticated;