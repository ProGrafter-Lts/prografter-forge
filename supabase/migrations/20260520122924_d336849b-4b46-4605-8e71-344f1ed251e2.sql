UPDATE public.planning_leads SET next_action = 'Generate and send introduction letter to David Chambers (Chambers Architecture Ltd) — target send by end of this week.' WHERE site_address = '14 Orchard Lane, Swadlincote' AND (next_action IS NULL OR next_action = '');

UPDATE public.planning_leads SET next_action = 'Send homeowner introduction letter (no agent on application) — target send by end of this week.' WHERE site_address = '39 Melton Road, East Leake' AND (next_action IS NULL OR next_action = '');

UPDATE public.planning_leads SET next_action = 'URGENT — 47 days open. Follow-up call to PJD Planning Consultants (Patricia Knowles) this week. Confirm whether agricultural Class Q conversion is in domestic-trade scope.' WHERE site_address = 'Ashwood Farm, Hartshorne' AND (next_action IS NULL OR next_action = '');

UPDATE public.planning_leads SET next_action = 'Send homeowner introduction letter (no agent on application) — target send by end of this week.' WHERE site_address = '23 Sherwood Vale, Mapperley' AND (next_action IS NULL OR next_action = '');

UPDATE public.planning_leads SET next_action = 'Follow-up email + call to architect/agent — 31 days since first contact. Push for meeting booking.' WHERE site_address = '7 Bramble Close, Repton' AND (next_action IS NULL OR next_action = '');