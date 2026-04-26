
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_type text := COALESCE(NEW.raw_user_meta_data->>'user_type', 'trade');
  v_full_name text := COALESCE(NEW.raw_user_meta_data->>'full_name', '');
  v_postcode  text := COALESCE(NEW.raw_user_meta_data->>'postcode', '');
  v_phone     text := COALESCE(NEW.raw_user_meta_data->>'phone', '');
  v_company   text := COALESCE(NEW.raw_user_meta_data->>'company_name', v_full_name);
  v_trade_type text := COALESCE(NEW.raw_user_meta_data->>'trade_type', 'Other');
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, user_type, postcode, phone)
  VALUES (NEW.id, NEW.email, v_full_name, v_user_type, v_postcode, v_phone)
  ON CONFLICT DO NOTHING;

  IF v_user_type = 'homeowner' THEN
    INSERT INTO public.homeowners (user_id, name, email, phone)
    SELECT NEW.id, v_full_name, NEW.email, v_phone
    WHERE NOT EXISTS (SELECT 1 FROM public.homeowners WHERE user_id = NEW.id);
  ELSIF v_user_type = 'trade' THEN
    INSERT INTO public.trades (user_id, name, company_name, phone, postcode, trade_type, verified, verification_status)
    SELECT NEW.id, v_full_name, v_company, v_phone, v_postcode, v_trade_type, false, 'pending'
    WHERE NOT EXISTS (SELECT 1 FROM public.trades WHERE user_id = NEW.id);
  END IF;

  RETURN NEW;
END;
$function$;
