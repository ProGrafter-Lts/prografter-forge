UPDATE public.simple_quote_checks c
SET report_json = jsonb_set(
  c.report_json::jsonb,
  '{verdict}',
  jsonb_build_object(
    'level',
    CASE
      WHEN COALESCE((c.report_json->>'clarity_score')::numeric, 0) >= 90 THEN 'excellent'
      WHEN COALESCE((c.report_json->>'clarity_score')::numeric, 0) >= 75 THEN 'good'
      WHEN COALESCE((c.report_json->>'clarity_score')::numeric, 0) >= 55 THEN 'workable'
      ELSE 'caution'
    END,
    'line',
    CASE
      WHEN COALESCE((c.report_json->>'clarity_score')::numeric, 0) >= 90 THEN 'This is an excellent quote. The scope, materials, responsibilities and commercial terms are all clearly set out, and there is nothing significant left open. You can proceed with confidence — just keep the written quote on file as the agreed basis of the work.'
      WHEN COALESCE((c.report_json->>'clarity_score')::numeric, 0) >= 75 THEN 'This is a good quote. The main scope, materials and pricing are clear and it stands up well overall. A small number of points are still worth putting in writing before you accept, but none of them are red flags.'
      WHEN COALESCE((c.report_json->>'clarity_score')::numeric, 0) >= 55 THEN 'This quote is workable but incomplete. The basics are there, yet several meaningful details are missing or unclear. Get those gaps confirmed in writing before you accept, so the price you agree is the price you pay.'
      ELSE 'Treat this quote with caution. It gives a price, but too much of the work is left undefined for you to accept it safely as it stands. Ask for a revised, itemised quote covering the gaps below before committing any money.'
    END
  ),
  true
)
WHERE c.report_json IS NOT NULL
  AND c.report_json::jsonb ? 'clarity_score';