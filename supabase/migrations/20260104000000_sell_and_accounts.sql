-- Selling option + optional owner accounts ("sub-admin").

alter table public.clothing_listings
  add column if not exists for_sale boolean not null default false,
  add column if not exists sale_price integer,
  add column if not exists paused_by_owner boolean not null default false;

alter table public.clothing_listings drop constraint if exists clothing_listings_sale_price_check;
alter table public.clothing_listings
  add constraint clothing_listings_sale_price_check
  check (sale_price is null or sale_price > 0),
  add constraint clothing_listings_sale_requires_price
  check (for_sale = false or sale_price is not null);

-- Owner rows can be linked to a Supabase Auth account. Anonymous posters receive a one-time
-- claim token (stored only as a hash) that lets them attach their listing to a new account.
alter table public.users
  add column if not exists auth_user_id uuid references auth.users(id) on delete set null,
  add column if not exists claim_token_hash text,
  add column if not exists claim_expires_at timestamptz;

create index if not exists users_auth_user_idx on public.users (auth_user_id) where auth_user_id is not null;
create unique index if not exists users_claim_token_idx on public.users (claim_token_hash) where claim_token_hash is not null;

-- Public view: adds sale info (still no phone numbers / account ids)
create or replace view public.public_listings
  with (security_invoker = false) as
select
  l.id, l.name, l.category, l.description, l.size, l.color, l.brand, l.condition,
  l.rent_price, l.security_deposit, l.location, l.city,
  l.available_from, l.available_to, l.created_at,
  u.name as owner_name,
  l.available_dates,
  l.sizes,
  l.for_sale,
  l.sale_price
from public.clothing_listings l
join public.users u on u.id = l.owner_id
where l.status = 'approved';

grant select on public.public_listings to anon, authenticated;
