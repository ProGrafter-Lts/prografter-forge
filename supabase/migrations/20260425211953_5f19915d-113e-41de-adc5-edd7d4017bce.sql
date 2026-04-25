-- Compatibility view: lets existing components reading from "contracts" with
-- old column names continue to work against the new schema during the rollout.
-- TODO: drop once ContractPanel and friends are rewired to read the new
-- columns directly (target: same 30-day window as contracts_legacy).
CREATE OR REPLACE VIEW public.contracts_compat
WITH (security_invoker = true)
AS
SELECT
  c.id,
  c.job_id,
  c.quote_id,
  c.homeowner_id,
  c.trade_id,
  c.status,
  c.created_at,
  c.updated_at,
  c.homeowner_signed_at,
  c.trade_signed_at,
  -- Money: convert pence → pounds for legacy callers
  ROUND(c.total_value_incl_vat_pence::numeric / 100, 2) AS agreed_price,
  -- Render a readable text block from snapshots + scope until the new page ships
  (
    'Contract ' || COALESCE(ct.version, '—') || E'\n\n' ||
    'Client: ' || COALESCE(c.homeowner_snapshot->>'name','—') || E'\n' ||
    'Contractor: ' || COALESCE(c.trade_snapshot->>'company_name', c.trade_snapshot->>'name','—') || E'\n\n' ||
    'Scope of works:' || E'\n' || COALESCE(c.scope_of_works,'—') || E'\n\n' ||
    'Total value (inc VAT): £' || to_char(c.total_value_incl_vat_pence::numeric / 100, 'FM999G999G990D00')
  ) AS contract_text,
  -- Reshape milestones to the legacy structure {label, amount, status}
  COALESCE(
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'label', m->>'description',
          'amount', (m->>'amount_pence')::numeric / 100,
          'status', 'unpaid'
        ) ORDER BY (m->>'sequence')::int
      )
      FROM jsonb_array_elements(c.payment_milestones) m
    ),
    '[]'::jsonb
  ) AS payment_schedule
FROM public.contracts c
LEFT JOIN public.contract_templates ct ON ct.id = c.template_id;

COMMENT ON VIEW public.contracts_compat IS
  'Temporary compat view exposing legacy contract column names. TODO: drop once ContractPanel is rewired.';

GRANT SELECT ON public.contracts_compat TO authenticated;