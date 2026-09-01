-- 1. Stop generating commission from the flat 3.75% formula.
ALTER TABLE public.contract_variations ALTER COLUMN commission_pence DROP EXPRESSION;

-- 2. Standard platform commission: 7.5% of cumulative job value, capped at £900.
CREATE OR REPLACE FUNCTION public.platform_commission_pence(_value_pence bigint)
RETURNS integer
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT LEAST(90000, GREATEST(0, round(COALESCE(_value_pence,0) * 0.075)))::integer;
$$;

-- 3. Cap-aware marginal commission for a single variation.
CREATE OR REPLACE FUNCTION public.variation_commission_delta(
  _contract_id uuid,
  _cost_change_pence integer,
  _exclude_variation_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_base bigint := 0;
  v_prior bigint := 0;
  v_before integer;
  v_after integer;
BEGIN
  SELECT COALESCE(total_value_excl_vat_pence,0) INTO v_base
  FROM public.contracts WHERE id = _contract_id;

  SELECT COALESCE(SUM(GREATEST(cost_change_pence,0)),0) INTO v_prior
  FROM public.contract_variations
  WHERE contract_id = _contract_id
    AND status = 'accepted'
    AND (_exclude_variation_id IS NULL OR id <> _exclude_variation_id);

  v_before := public.platform_commission_pence(v_base + v_prior);
  v_after  := public.platform_commission_pence(v_base + v_prior + GREATEST(COALESCE(_cost_change_pence,0),0));

  RETURN jsonb_build_object(
    'commission_before_pence', v_before,
    'commission_after_pence', v_after,
    'variation_commission_pence', v_after - v_before,
    'headroom_before_pence', 90000 - v_before,
    'headroom_after_pence', 90000 - v_after,
    'capped', v_after >= 90000,
    'job_value_before_pence', v_base + v_prior,
    'job_value_after_pence', v_base + v_prior + GREATEST(COALESCE(_cost_change_pence,0),0)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.platform_commission_pence(bigint) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.variation_commission_delta(uuid, integer, uuid) TO authenticated, service_role;

-- 4. Keep commission_pence in sync using the cap-aware calculation.
CREATE OR REPLACE FUNCTION public.set_variation_commission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.commission_pence := (
    public.variation_commission_delta(NEW.contract_id, NEW.cost_change_pence, NEW.id)
    ->> 'variation_commission_pence'
  )::integer;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_variation_commission ON public.contract_variations;
CREATE TRIGGER trg_set_variation_commission
BEFORE INSERT OR UPDATE OF cost_change_pence, status ON public.contract_variations
FOR EACH ROW EXECUTE FUNCTION public.set_variation_commission();

-- 5. Backfill existing rows onto the cap-aware figure.
UPDATE public.contract_variations v
SET commission_pence = (
  public.variation_commission_delta(v.contract_id, v.cost_change_pence, v.id)
  ->> 'variation_commission_pence'
)::integer;
