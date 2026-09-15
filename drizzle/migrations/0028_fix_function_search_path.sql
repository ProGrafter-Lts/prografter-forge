CREATE OR REPLACE FUNCTION public.platform_commission_pence(_value_pence bigint)
RETURNS integer
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $function$
  SELECT LEAST(90000, GREATEST(0, round(COALESCE(_value_pence,0) * 0.075)))::integer;
$function$;