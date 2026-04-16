
ALTER TABLE public.quotes
ADD COLUMN tier_enabled boolean NOT NULL DEFAULT false,
ADD COLUMN budget_price numeric NULL,
ADD COLUMN budget_description text NULL,
ADD COLUMN standard_price numeric NULL,
ADD COLUMN standard_description text NULL,
ADD COLUMN premium_price numeric NULL,
ADD COLUMN premium_description text NULL,
ADD COLUMN selected_tier text NULL;
