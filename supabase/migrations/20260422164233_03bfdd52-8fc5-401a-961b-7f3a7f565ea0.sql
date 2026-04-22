DO $$
DECLARE
  v_trade_id uuid := 'caac1df9-4164-467f-a877-fe2aa06745c0';
  v_homeowner_ids uuid[];
  v_job_ids uuid[];
  v_job_id uuid;
  v_quote_id uuid;
  v_user_id uuid;
  v_homeowner_id uuid;
  v_created timestamptz;
  v_completed timestamptz;
  v_amount numeric;
  v_postcode text;
  v_address text;
  v_job_type text;
  v_title text;
  v_description text;
  v_rating int;
  v_headline text;
  v_body text;
  v_postcodes text[] := ARRAY['NG17 1AA','NG17 2BB','NG18 3CC','NG19 4DD','NG20 5EE','DE55 1FF','DE55 2GG','DE55 3HH','DE75 4II','DE75 5JJ','S80 1KK','S80 2LL','S81 3MM','S81 4NN','NG21 5OO','NG22 6PP','DE56 7QQ','S80 8RR','NG17 9SS','DE55 0TT'];
  v_streets text[] := ARRAY['Oak Lane','High Street','Mill Road','Church Street','Park Avenue','Station Road','The Green','Victoria Road','Albert Street','New Road','Manor Drive','Beech Close','Elm Grove','Willow Way','Cedar Court','Birch Rise','Maple Crescent','Ash View','Hawthorn Hill','Sycamore Place'];
  v_first_names text[] := ARRAY['Mike','Sarah','David','Emma','Tom','Claire','Paul','Lisa','Mark','Rachel','Steve','Helen','James','Karen','Dan','Sophie','Andy','Joanne','Chris','Becky','Liam','Hannah'];
  v_last_initials text[] := ARRAY['R.','T.','P.','W.','H.','S.','M.','C.','B.','D.','K.','L.','N.','F.','J.','A.','G.','E.','O.','V.','Y.','U.'];
  v_review_targets int[];
  v_job_specs jsonb := '[
    {"type":"EICR","count":18,"min":180,"max":350},
    {"type":"Consumer Unit Replacement","count":8,"min":600,"max":1400},
    {"type":"Rewire","count":6,"min":2800,"max":7500},
    {"type":"EV Charger Install","count":5,"min":900,"max":1800},
    {"type":"Fault Finding","count":4,"min":95,"max":280},
    {"type":"Kitchen/Bathroom Circuit","count":3,"min":450,"max":900},
    {"type":"Commercial","count":2,"min":3500,"max":8000},
    {"type":"Solar PV","count":1,"min":4500,"max":4500}
  ]';
  v_spec jsonb;
  v_count int;
  v_i int;
  v_total_jobs int := 0;
BEGIN
  -- Idempotency: if previous attempt left auth users behind, skip
  IF EXISTS (SELECT 1 FROM public.contracts WHERE trade_id = v_trade_id) THEN
    RAISE NOTICE 'Trade % already has contracts; aborting seed', v_trade_id;
    RETURN;
  END IF;

  v_homeowner_ids := ARRAY[]::uuid[];

  -- 1. 22 fake homeowner accounts
  FOR v_i IN 1..22 LOOP
    v_user_id := gen_random_uuid();
    v_homeowner_id := gen_random_uuid();

    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, aud, role, raw_app_meta_data, raw_user_meta_data)
    VALUES (
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      'seed-jw-' || v_i || '-' || substr(gen_random_uuid()::text,1,8) || '@prografter-seed.test',
      crypt('seed-password-not-for-login', gen_salt('bf')),
      now(),
      now() - (interval '1 day' * (540 - v_i * 20)),
      now(),
      'authenticated',
      'authenticated',
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', v_first_names[v_i] || ' ' || v_last_initials[v_i], 'seed', true)
    );

    INSERT INTO public.homeowners (id, user_id, name, email, phone, is_test, created_at)
    VALUES (
      v_homeowner_id,
      v_user_id,
      v_first_names[v_i] || ' ' || v_last_initials[v_i],
      'seed-jw-' || v_i || '@prografter-seed.test',
      '07700900' || lpad(v_i::text, 3, '0'),
      true,
      now() - (interval '1 day' * (540 - v_i * 20))
    );

    v_homeowner_ids := array_append(v_homeowner_ids, v_homeowner_id);
  END LOOP;

  v_job_ids := ARRAY[]::uuid[];

  -- 2. 47 completed jobs + matching quote + contract
  FOR v_spec IN SELECT * FROM jsonb_array_elements(v_job_specs) LOOP
    v_job_type := v_spec->>'type';
    v_count := (v_spec->>'count')::int;

    FOR v_i IN 1..v_count LOOP
      v_total_jobs := v_total_jobs + 1;
      v_job_id := gen_random_uuid();
      v_quote_id := gen_random_uuid();
      v_homeowner_id := v_homeowner_ids[1 + (v_total_jobs % 22)];

      v_created := now()
        - (interval '1 day' * 30)
        - (interval '1 day' * floor(random() * 510));
      v_completed := v_created + (interval '1 day' * (1 + floor(random() * 10)::int));

      v_amount := round(((v_spec->>'min')::numeric
                  + random() * ((v_spec->>'max')::numeric - (v_spec->>'min')::numeric))::numeric, 0);

      v_postcode := v_postcodes[1 + floor(random() * array_length(v_postcodes,1))::int];
      v_address := (10 + floor(random() * 180)::int) || ' ' || v_streets[1 + floor(random() * array_length(v_streets,1))::int];

      v_title := CASE v_job_type
        WHEN 'EICR' THEN 'Landlord EICR / Periodic Inspection'
        WHEN 'Consumer Unit Replacement' THEN 'Consumer unit replacement (RCBO board)'
        WHEN 'Rewire' THEN 'Full house rewire'
        WHEN 'EV Charger Install' THEN '7kW EV charger install (OZEV)'
        WHEN 'Fault Finding' THEN 'Fault-finding callout'
        WHEN 'Kitchen/Bathroom Circuit' THEN 'Kitchen / bathroom circuit installation'
        WHEN 'Commercial' THEN 'Commercial premises electrical works'
        WHEN 'Solar PV' THEN 'Solar PV install (4kW with battery)'
      END;

      v_description := CASE v_job_type
        WHEN 'EICR' THEN 'Periodic inspection and EICR certification.'
        WHEN 'Consumer Unit Replacement' THEN 'Replace existing consumer unit with new 18th edition compliant board with RCBOs.'
        WHEN 'Rewire' THEN 'Full rewire including new consumer unit, certification and reinstatement.'
        WHEN 'EV Charger Install' THEN '7kW tethered EV charger installation with OZEV grant paperwork.'
        WHEN 'Fault Finding' THEN 'Intermittent tripping investigation and remediation.'
        WHEN 'Kitchen/Bathroom Circuit' THEN 'New circuits for kitchen / bathroom including IP-rated accessories.'
        WHEN 'Commercial' THEN 'Commercial fit-out electrical works including lighting and small power.'
        WHEN 'Solar PV' THEN '4kW Solar PV array with hybrid inverter and 5kWh battery storage.'
      END;

      INSERT INTO public.jobs (id, homeowner_id, job_type, title, description, address, postcode, status, stage, budget, is_test, created_at)
      VALUES (v_job_id, v_homeowner_id, v_job_type, v_title, v_description, v_address, v_postcode, 'completed', 'completed', '£' || v_amount, true, v_created);

      INSERT INTO public.quotes (id, job_id, trade_id, amount, status, is_test, created_at, updated_at)
      VALUES (v_quote_id, v_job_id, v_trade_id, v_amount, 'accepted', true, v_created, v_completed);

      INSERT INTO public.job_matches (job_id, trade_id, status, estimated_value, notified_at, created_at, is_test)
      VALUES (v_job_id, v_trade_id, 'accepted', v_amount::text, v_created, v_created, true);

      INSERT INTO public.contracts (job_id, trade_id, homeowner_id, quote_id, contract_text, agreed_price, status, trade_signed_at, homeowner_signed_at, created_at, updated_at)
      VALUES (v_job_id, v_trade_id, v_homeowner_id, v_quote_id, 'Seeded contract for completed job.', v_amount, 'signed', v_completed, v_completed, v_created, v_completed);

      v_job_ids := array_append(v_job_ids, v_job_id);
    END LOOP;
  END LOOP;

  -- 3. 43 reviews on 43 jobs (39x5, 3x4, 1x3)
  WITH picks AS (
    SELECT generate_series AS idx FROM generate_series(1, 47) ORDER BY random() LIMIT 43
  )
  SELECT array_agg(idx) INTO v_review_targets FROM picks;

  FOR v_i IN 1..43 LOOP
    v_job_id := v_job_ids[v_review_targets[v_i]];
    SELECT homeowner_id INTO v_homeowner_id FROM public.jobs WHERE id = v_job_id;

    IF v_i <= 39 THEN v_rating := 5;
    ELSIF v_i <= 42 THEN v_rating := 4;
    ELSE v_rating := 3;
    END IF;

    IF v_rating = 5 THEN
      v_body := (ARRAY[
        'Turned up when he said he would. Clean, tidy work. Explained everything. Would use again.',
        'Did our EICR for the landlord. Professional, got the cert over same week.',
        'Rewire was completed on schedule and within quote. No complaints.',
        'Came out on a Saturday for a fault we couldn''t trace. Had it sorted in an hour.',
        'Top job on the consumer unit. Tidy, certified, and walked us through what changed.',
        'Installed our EV charger and sorted the OZEV paperwork. Painless.',
        'Honest pricing, no surprises. Apprentice was polite too.',
        'Sorted a tripping circuit that two other sparkies couldn''t find. Highly recommend.',
        'Used James for a kitchen rewire. Quality finish and certs sent over within days.',
        'Very professional throughout. Will definitely call him again.'
      ])[1 + floor(random() * 10)::int];
      v_headline := (ARRAY['Top job','Highly recommend','Excellent work','Spot on','Great service','Quality work'])[1 + floor(random()*6)::int];
    ELSIF v_rating = 4 THEN
      v_body := (ARRAY[
        'Good work overall, took slightly longer than expected but the finish was solid.',
        'Decent job and fair price. Communication on timing could have been a touch better.',
        'Happy with the work itself. Arrived a day late but kept us posted.'
      ])[1 + (v_i - 40)];
      v_headline := 'Solid work, minor scheduling notes';
    ELSE
      v_body := 'Job done and certified. Communication could have been better — had to chase a couple of times for updates.';
      v_headline := 'Job done, communication could improve';
    END IF;

    IF random() < 0.7 THEN
      INSERT INTO public.reviews (job_id, trade_id, homeowner_id, rating, headline, body,
        workmanship_rating, communication_rating, reliability_rating, value_rating, would_recommend,
        is_test, created_at, updated_at)
      VALUES (v_job_id, v_trade_id, v_homeowner_id, v_rating, v_headline, v_body,
        v_rating::smallint, v_rating::smallint, v_rating::smallint, v_rating::smallint, v_rating >= 4,
        true,
        (SELECT created_at FROM public.jobs WHERE id = v_job_id) + (interval '1 day' * (1 + floor(random() * 14)::int)),
        now());
    ELSE
      INSERT INTO public.reviews (job_id, trade_id, homeowner_id, rating, headline, body, is_test, created_at, updated_at)
      VALUES (v_job_id, v_trade_id, v_homeowner_id, v_rating, v_headline, v_body, true,
        (SELECT created_at FROM public.jobs WHERE id = v_job_id) + (interval '1 day' * (1 + floor(random() * 14)::int)),
        now());
    END IF;
  END LOOP;

  PERFORM public.recompute_trade_stats(v_trade_id);
END $$;
