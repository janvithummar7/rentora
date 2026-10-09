-- Restore the intended security model of the public views.
--
-- These three views run with their OWNER's rights (security_invoker = false) on purpose: they let the
-- anonymous website read ONLY safe columns/dates (no phone numbers, emails or request details) from tables
-- that are otherwise locked down by RLS. If security_invoker is turned ON (for example by the Supabase
-- dashboard's "Security Definer View" advisor fix), anonymous visitors are checked against the private
-- tables directly and get "permission denied for table users".
alter view public.public_listings set (security_invoker = false);
alter view public.listing_booked_dates set (security_invoker = false);
alter view public.listing_requested_dates set (security_invoker = false);

grant select on public.public_listings, public.listing_booked_dates, public.listing_requested_dates
  to anon, authenticated;
