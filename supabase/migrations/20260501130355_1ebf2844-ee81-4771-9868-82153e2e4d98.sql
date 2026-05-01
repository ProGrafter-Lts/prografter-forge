-- Internal trigger/helper functions — never called from PostgREST API
REVOKE EXECUTE ON FUNCTION public.recompute_trade_stats(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.reviews_recompute_trigger() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.project_stages_completion_trigger() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.trades_verified_recompute_trigger() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.on_quote_accepted_advance_job() FROM anon, public;

-- Email queue plumbing — only called from edge functions (service role)
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM anon, public;

-- Authenticated user actions — function bodies already raise on null auth.uid(),
-- but revoking anon access is defence in depth.
REVOKE EXECUTE ON FUNCTION public.generate_contract_for_quote(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.add_bespoke_terms(uuid, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.sign_contract(uuid, text, inet) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.sign_variation(uuid, text, boolean, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.propose_variation(uuid, text, text, text, integer, integer) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.mark_practical_completion(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.accept_practical_completion(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.log_contract_event(uuid, text, jsonb) FROM anon, public;

GRANT EXECUTE ON FUNCTION public.generate_contract_for_quote(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_bespoke_terms(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sign_contract(uuid, text, inet) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sign_variation(uuid, text, boolean, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.propose_variation(uuid, text, text, text, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_practical_completion(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_practical_completion(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_contract_event(uuid, text, jsonb) TO authenticated;

-- handle_new_user() is the auth signup trigger — must remain callable from the auth schema
-- via the on_auth_user_created trigger. Triggers run as the table owner, so we can still
-- safely revoke direct anon EXECUTE without breaking signup.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, public;