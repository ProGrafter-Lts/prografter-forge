UPDATE public.trades
SET verification_status = 'approved',
    verified = true
WHERE id = '3d5ae25e-b1dd-449c-bafc-32ebeffaecbf';

DELETE FROM public.planning_alerts
WHERE application_type IN ('Conditions', 'Amendment', 'Trees', 'Advertising', 'Heritage', 'Telecoms', 'Other');