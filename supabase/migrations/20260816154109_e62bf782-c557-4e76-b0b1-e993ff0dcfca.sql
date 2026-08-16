with t as (
  select c.id,
   (select jsonb_agg(x) from (select q->>'question' as x from jsonb_array_elements(c.report_json->'suggested_questions') q where q->>'status'='absent' limit 6) s) as risks,
   (select jsonb_agg(x) from (select q->>'question' as x from jsonb_array_elements(c.report_json->'suggested_questions') q limit 10) s2) as qs
  from simple_quote_checks c
  where c.report_json is not null
    and coalesce(jsonb_array_length(c.report_json->'key_risks'),0)=0
    and coalesce(jsonb_array_length(c.report_json->'suggested_questions'),0)>0
)
update simple_quote_checks c
set report_json = c.report_json || jsonb_build_object('key_risks', coalesce(t.risks,'[]'::jsonb), 'questions', coalesce(t.qs,'[]'::jsonb))
from t where t.id = c.id;