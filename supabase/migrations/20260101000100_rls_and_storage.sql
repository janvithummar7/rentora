-- Row Level Security, public view and storage bucket
--
-- Model: the website reads public data with the anon key (restricted by RLS and the
-- public_listings view) and performs every write, plus anything touching owner phone
-- numbers, on the server with the service-role key (which bypasses RLS).

alter table public.categories        enable row level security;
alter table public.users             enable row level security;
alter table public.clothing_listings enable row level security;
alter table public.clothing_images   enable row level security;
alter table public.rental_requests   enable row level security;

-- categories: public read
drop policy if exists "categories are public" on public.categories;
create policy "categories are public" on public.categories
  for select to anon, authenticated using (true);

-- clothing_listings: only approved rows are publicly readable
drop policy if exists "approved listings are public" on public.clothing_listings;
create policy "approved listings are public" on public.clothing_listings
  for select to anon, authenticated using (status = 'approved');

-- clothing_images: only images of approved listings
drop policy if exists "images of approved listings are public" on public.clothing_images;
create policy "images of approved listings are public" on public.clothing_images
  for select to anon, authenticated
  using (exists (
    select 1 from public.clothing_listings l
    where l.id = clothing_images.listing_id and l.status = 'approved'
  ));

-- users and rental_requests: NO policies => anon/authenticated can read or write nothing.

-- Public view: approved listings + owner display name, never any phone/email.
-- Runs with the view owner's rights so it can read users.name; exposes only safe columns.
create or replace view public.public_listings
  with (security_invoker = false) as
select
  l.id, l.name, l.category, l.description, l.size, l.color, l.brand, l.condition,
  l.rent_price, l.security_deposit, l.location, l.city,
  l.available_from, l.available_to, l.created_at,
  u.name as owner_name
from public.clothing_listings l
join public.users u on u.id = l.owner_id
where l.status = 'approved';

-- Explicit grants (newer Supabase projects do not auto-grant on the public schema)
revoke all on public.users, public.rental_requests, public.clothing_listings,
              public.clothing_images, public.categories, public.public_listings from anon, authenticated;
grant select on public.categories, public.clothing_listings,
                public.clothing_images, public.public_listings to anon, authenticated;
grant all on all tables in schema public to service_role;

-- Storage bucket for clothing photos (public read, writes only via service role)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('clothing-images', 'clothing-images', true, 5242880,
        array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "clothing images are public" on storage.objects;
create policy "clothing images are public" on storage.objects
  for select to anon, authenticated using (bucket_id = 'clothing-images');
-- No insert/update/delete policies: uploads happen server-side with the service role.
