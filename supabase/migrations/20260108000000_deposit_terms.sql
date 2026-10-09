-- Record the security deposit and that the renter accepted the deposit terms when they sent the request.
alter table public.rental_requests
  add column if not exists deposit_amount integer not null default 0,
  add column if not exists deposit_terms_accepted boolean not null default false;
