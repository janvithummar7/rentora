-- Simpler listings: owners pick individual available dates, and location/condition become optional.
alter table public.clothing_listings
  add column if not exists available_dates date[] not null default '{}';

alter table public.clothing_listings
  alter column location  drop not null,
  alter column city      drop not null,
  alter column condition drop not null,
  alter column condition drop default;

-- Backfill from the old from/to window (seed data, earlier listings)
update public.clothing_listings
set available_dates = array(
  select d::date from generate_series(available_from, available_to, interval '1 day') d
)
where cardinality(available_dates) = 0
  and available_from is not null and available_to is not null
  and available_to - available_from <= 366;

-- Expose the dates on the public view (new column appended at the end)
create or replace view public.public_listings
  with (security_invoker = false) as
select
  l.id, l.name, l.category, l.description, l.size, l.color, l.brand, l.condition,
  l.rent_price, l.security_deposit, l.location, l.city,
  l.available_from, l.available_to, l.created_at,
  u.name as owner_name,
  l.available_dates
from public.clothing_listings l
join public.users u on u.id = l.owner_id
where l.status = 'approved';

grant select on public.public_listings to anon, authenticated;
