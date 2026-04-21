
-- 1. Specialisms taxonomy table
CREATE TABLE public.specialisms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  icon text,
  applicable_trades text[] NOT NULL DEFAULT '{}',
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.specialisms ENABLE ROW LEVEL SECURITY;

-- Anyone (signed-in or anon) can read active specialisms — needed for the
-- public homeowner job-post form and public trade profiles.
CREATE POLICY "Anyone can read active specialisms"
  ON public.specialisms FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Only admins can manage specialisms (admin UI lands in a follow-up).
CREATE POLICY "Admins can manage specialisms"
  ON public.specialisms FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_specialisms_updated_at
  BEFORE UPDATE ON public.specialisms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Join table: tradesperson <-> specialism
CREATE TABLE public.trade_specialisms (
  trade_id uuid NOT NULL REFERENCES public.trades(id) ON DELETE CASCADE,
  specialism_id uuid NOT NULL REFERENCES public.specialisms(id) ON DELETE CASCADE,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (trade_id, specialism_id)
);

CREATE INDEX idx_trade_specialisms_specialism ON public.trade_specialisms(specialism_id);

-- Enforce: at most one primary specialism per trade
CREATE UNIQUE INDEX idx_trade_specialisms_one_primary
  ON public.trade_specialisms(trade_id)
  WHERE is_primary = true;

ALTER TABLE public.trade_specialisms ENABLE ROW LEVEL SECURITY;

-- A trade can read/write only its own specialism rows
CREATE POLICY "Trades manage own specialisms"
  ON public.trade_specialisms FOR ALL
  TO authenticated
  USING (
    trade_id IN (SELECT id FROM public.trades WHERE user_id = auth.uid())
  )
  WITH CHECK (
    trade_id IN (SELECT id FROM public.trades WHERE user_id = auth.uid())
  );

-- Homeowners can read specialisms of trades matched to their jobs (so we can
-- surface specialisms on quotes / trade cards).
CREATE POLICY "Homeowners can read matched trade specialisms"
  ON public.trade_specialisms FOR SELECT
  TO authenticated
  USING (
    trade_id IN (
      SELECT jm.trade_id
      FROM public.job_matches jm
      JOIN public.jobs j ON j.id = jm.job_id
      JOIN public.homeowners h ON h.id = j.homeowner_id
      WHERE h.user_id = auth.uid()
    )
  );

-- 3. Optional specialism on a posted job
ALTER TABLE public.jobs
  ADD COLUMN specialism_id uuid REFERENCES public.specialisms(id) ON DELETE SET NULL;

-- 4. Track whether an existing trade has dismissed/completed the
-- "add your specialisms" prompt so we only nudge them once.
ALTER TABLE public.trades
  ADD COLUMN specialisms_prompt_seen boolean NOT NULL DEFAULT false;

-- 5. Seed initial specialisms
INSERT INTO public.specialisms (slug, name, description, icon, applicable_trades, sort_order) VALUES
  ('bathrooms',          'Bathrooms',           'Full bathroom renovations, wet rooms and en-suites',                  'bath',         ARRAY['Plumber','Tiler','Builder','Electrician','Plasterer','Carpenter'], 10),
  ('kitchens',           'Kitchens',            'Full kitchen installations and refurbishments',                       'utensils',     ARRAY['Plumber','Tiler','Builder','Electrician','Plasterer','Carpenter','Gas Engineer'], 20),
  ('wet-rooms',          'Wet Rooms',           'Walk-in wet rooms and accessibility-focused installations',           'shower-head',  ARRAY['Plumber','Tiler','Builder'], 30),
  ('loft-conversions',   'Loft Conversions',    'Loft conversion work across trades',                                  'home',         ARRAY['Builder','Carpenter','Electrician','Plumber','Plasterer','Roofer'], 40),
  ('garage-conversions', 'Garage Conversions',  'Garage-to-habitable-room conversions',                                'garage',       ARRAY['Builder','Carpenter','Electrician','Plumber','Plasterer'], 50),
  ('extensions',         'Extensions',          'Single and double storey extensions',                                 'building',     ARRAY['Builder','Carpenter','Electrician','Plumber','Plasterer','Roofer'], 60),
  ('outbuildings',       'Outbuildings',        'Garden rooms, workshops and annexes',                                 'warehouse',    ARRAY['Builder','Carpenter','Electrician','Roofer'], 70),
  ('disabled-adaptations','Disabled Adaptations','Grab rails, level access and accessibility adaptations',             'accessibility',ARRAY['Plumber','Builder','Carpenter','Electrician'], 80),
  ('period-properties',  'Period Properties',   'Pre-1930s properties requiring specialist materials and techniques',  'landmark',     ARRAY['Builder','Plasterer','Carpenter','Roofer','Decorator'], 90),
  ('listed-buildings',   'Listed Buildings',    'Listed buildings with heritage considerations',                       'castle',       ARRAY['Builder','Plasterer','Carpenter','Roofer','Decorator'], 100),
  ('new-builds',         'New Builds',          'New-build residential work',                                          'hammer',       ARRAY['Builder','Carpenter','Electrician','Plumber','Plasterer','Roofer','Tiler','Decorator'], 110),
  ('commercial-fit-out', 'Commercial Fit-Out',  'Commercial property fit-out work',                                    'briefcase',    ARRAY['Builder','Carpenter','Electrician','Plumber','Plasterer','Decorator'], 120),
  ('ev-charger',         'EV Charger Installation','Electric vehicle charger installations',                           'plug-zap',     ARRAY['Electrician','EV Charger Installer'], 130),
  ('solar-pv',           'Solar PV',            'Solar panel installation',                                            'sun',          ARRAY['Electrician','Solar PV Installer'], 140),
  ('heat-pumps',         'Heat Pumps',          'Air source and ground source heat pumps',                             'thermometer',  ARRAY['Plumber','Gas Engineer','Air Source Heat Pump Installer','Ground Source Heat Pump Installer'], 150),
  ('smart-home',         'Smart Home',          'Smart home wiring and integration',                                   'cpu',          ARRAY['Electrician'], 160);
