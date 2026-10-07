-- Dates blocked by confirmed / completed rental requests.
-- Publicly readable, but exposes ONLY (listing_id, date): never who booked, contact details or status.
create or replace view public.listing_booked_dates
  with (security_invoker = false) as
select r.listing_id, gs::date as booked_date
from public.rental_requests r
join public.clothing_listings l on l.id = r.listing_id and l.status = 'approved'
cross join lateral generate_series(r.start_date::timestamp, r.end_date::timestamp, interval '1 day') gs
where r.status in ('confirmed', 'completed');

revoke all on public.listing_booked_dates from anon, authenticated;
grant select on public.listing_booked_dates to anon, authenticated;

create index if not exists rental_requests_listing_status_idx
  on public.rental_requests (listing_id, status);
