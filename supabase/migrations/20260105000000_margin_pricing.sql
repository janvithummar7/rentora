-- Platform margin: owners enter THEIR price; customers see price + margin.
--   rent_price / sale_price           = price shown to customers (owner price + margin)
--   owner_rent_price / owner_sale_price = what the owner asked for (private)
--   margin_percent                    = margin applied to this listing (set by admin at approval)
-- public_listings (the anon-readable view) exposes only rent_price / sale_price.

alter table public.clothing_listings
  add column if not exists owner_rent_price integer,
  add column if not exists owner_sale_price integer,
  add column if not exists margin_percent numeric(5,2) not null default 0;

-- Existing listings: treat the current price as the owner price with no margin.
update public.clothing_listings
set owner_rent_price = rent_price,
    owner_sale_price = sale_price
where owner_rent_price is null;

alter table public.clothing_listings alter column owner_rent_price set not null;

alter table public.clothing_listings drop constraint if exists clothing_listings_margin_check;
alter table public.clothing_listings
  add constraint clothing_listings_margin_check check (margin_percent >= 0 and margin_percent <= 300),
  add constraint clothing_listings_owner_price_check check (owner_rent_price > 0 and (owner_sale_price is null or owner_sale_price > 0));
