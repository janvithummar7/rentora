-- Days that other renters have REQUESTED but that are not confirmed yet (status new / contacted).
-- Shown to renters as "requested by others": they can still request the same days.
-- Exposes only (listing_id, date, count): no names, contact details or messages.
create or replace view public.listing_requested_dates
  with (security_invoker = false) as
select r.listing_id, gs::date as requested_date, count(*)::int as request_count
from public.rental_requests r
join public.clothing_listings l on l.id = r.listing_id and l.status = 'approved'
cross join lateral generate_series(r.start_date::timestamp, r.end_date::timestamp, interval '1 day') gs
where r.status in ('new', 'contacted')
group by r.listing_id, gs::date;

revoke all on public.listing_requested_dates from anon, authenticated;
grant select on public.listing_requested_dates to anon, authenticated;
