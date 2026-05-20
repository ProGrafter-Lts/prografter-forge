CREATE TABLE public.scraped_trades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trade_name TEXT NOT NULL,
  trade_type TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  has_website BOOLEAN NOT NULL DEFAULT false,
  address TEXT,
  postcode TEXT,
  city TEXT,
  rating NUMERIC,
  reviews_count INTEGER,
  source TEXT NOT NULL DEFAULT 'google_places',
  source_id TEXT,
  search_query TEXT,
  notes TEXT DEFAULT '',
  contacted BOOLEAN NOT NULL DEFAULT false,
  contacted_at TIMESTAMPTZ,
  last_scraped_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (source, source_id)
);

CREATE INDEX scraped_trades_trade_type_idx ON public.scraped_trades(trade_type);
CREATE INDEX scraped_trades_city_idx ON public.scraped_trades(city);

ALTER TABLE public.scraped_trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage scraped trades"
ON public.scraped_trades
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER scraped_trades_updated_at
BEFORE UPDATE ON public.scraped_trades
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();