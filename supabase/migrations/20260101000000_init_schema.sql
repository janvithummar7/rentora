-- Clothing rental marketplace: core schema
create extension if not exists pgcrypto;

create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  slug        text not null unique,
  created_at  timestamptz not null default now()
);

create table if not exists public.users (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  mobile           text not null,
  email            text,
  whatsapp_number  text not null,
  city             text,
  area             text,
  is_seed          boolean not null default false,
  created_at       timestamptz not null default now()
);

create table if not exists public.clothing_listings (
  id                uuid primary key default gen_random_uuid(),
  owner_id          uuid not null references public.users(id) on delete cascade,
  name              text not null,
  category          text not null references public.categories(slug),
  description       text not null default '',
  size              text not null,
  color             text,
  brand             text,
  condition         text not null default 'Good',
  rent_price        integer not null check (rent_price > 0),
  security_deposit  integer not null default 0 check (security_deposit >= 0),
  location          text not null,
  city              text not null,
  available_from    date,
  available_to      date,
  status            text not null default 'pending'
                    check (status in ('pending','approved','rejected','rented','inactive')),
  is_seed           boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table if not exists public.clothing_images (
  id          uuid primary key default gen_random_uuid(),
  listing_id  uuid not null references public.clothing_listings(id) on delete cascade,
  image_url   text not null,
  is_primary  boolean not null default false,
  created_at  timestamptz not null default now()
);

create table if not exists public.rental_requests (
  id               uuid primary key default gen_random_uuid(),
  listing_id       uuid not null references public.clothing_listings(id) on delete cascade,
  customer_name    text not null,
  customer_mobile  text not null,
  customer_email   text,
  start_date       date not null,
  end_date         date not null,
  message          text,
  status           text not null default 'new'
                   check (status in ('new','contacted','confirmed','completed','cancelled')),
  created_at       timestamptz not null default now(),
  check (end_date >= start_date)
);

create index if not exists clothing_listings_status_idx   on public.clothing_listings (status, created_at desc);
create index if not exists clothing_listings_category_idx on public.clothing_listings (category);
create index if not exists clothing_listings_city_idx     on public.clothing_listings (lower(city));
create index if not exists clothing_images_listing_idx    on public.clothing_images (listing_id);
create index if not exists rental_requests_listing_idx    on public.rental_requests (listing_id);
create index if not exists rental_requests_mobile_idx     on public.rental_requests (customer_mobile, created_at desc);
create index if not exists rental_requests_status_idx     on public.rental_requests (status, created_at desc);
create index if not exists users_mobile_idx               on public.users (mobile, created_at desc);

create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists clothing_listings_set_updated_at on public.clothing_listings;
create trigger clothing_listings_set_updated_at
  before update on public.clothing_listings
  for each row execute function public.set_updated_at();

insert into public.categories (name, slug) values
  ('Choli',        'choli'),
  ('Lehenga',      'lehenga'),
  ('Saree',        'saree'),
  ('Kurti',        'kurti'),
  ('Dress',        'dress'),
  ('Gown',         'gown'),
  ('Anarkali',     'anarkali'),
  ('Salwar Suit',  'salwar-suit'),
  ('Other',        'other')
on conflict (slug) do nothing;
