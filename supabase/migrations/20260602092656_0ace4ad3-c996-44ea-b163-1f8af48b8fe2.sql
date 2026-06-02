CREATE OR REPLACE FUNCTION public.admin_approve_trade(_trade_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_trade RECORD;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN
    RAISE EXCEPTION 'Admin only';
  END IF;

  SELECT * INTO v_trade FROM public.trades WHERE id = _trade_id;
  IF v_trade IS NULL THEN RAISE EXCEPTION 'Trade not found'; END IF;

  IF v_trade.verification_route = 'time_served' THEN
    IF NOT (v_trade.assessment_evidence_complete
            AND v_trade.references_called
            AND v_trade.site_assessment_done
            AND v_trade.competence_interview_done) THEN
      RAISE EXCEPTION 'All four assessment checks must be completed before approval';
    END IF;
  END IF;

  UPDATE public.trades
  SET verified = true,
      verification_status = 'approved',
      verified_on_prografter_at = COALESCE(verified_on_prografter_at, now()),
      on_probation = (v_trade.verification_route = 'time_served'),
      probation_jobs_remaining = CASE WHEN v_trade.verification_route = 'time_served' THEN 3 ELSE 0 END
  WHERE id = _trade_id;

  RETURN jsonb_build_object('ok', true, 'trade_id', _trade_id);
END;
$function$;