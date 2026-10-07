-- An outfit can be offered in several sizes. `sizes` is the source of truth for filtering;
-- `size` stays as a readable joined string ("M, L") for display.
alter table public.clothing_listings
  add column if not exists sizes text[] not null default '{}';

update public.clothing_listings
set sizes = array[size]
where cardinality(sizes) = 0 and size is not null;

create index if not exists clothing_listings_sizes_idx on public.clothing_listings using gin (sizes);

-- Expose on the public view (new column appended at the end)
create or replace view public.public_listings
  with (security_invoker = false) as
select
  l.id, l.name, l.category, l.description, l.size, l.color, l.brand, l.condition,
  l.rent_price, l.security_deposit, l.location, l.city,
  l.available_from, l.available_to, l.created_at,
  u.name as owner_name,
  l.available_dates,
  l.sizes
from public.clothing_listings l
join public.users u on u.id = l.owner_id
where l.status = 'approved';

grant select on public.public_listings to anon, authenticated;
