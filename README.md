# Rentora: clothing rental marketplace

Next.js 15 (App Router) + TypeScript + Tailwind v4 + Supabase (PostgreSQL + Storage).
Flow: **list → discover → request → WhatsApp → rent**. No payments, no user accounts.

## Setup

1. `npm install`
2. Create a Supabase project, then create the tables, RLS policies, `public_listings` view and the
   `clothing-images` bucket. Either:
   - **CLI:** put your Postgres connection string in `.env` as `DATABASE_URL` (Supabase dashboard -> Connect ->
     *Session pooler* URI, with your database password filled in), then run `npm run db:migrate`
     (and optionally `npm run db:seed` for sample data). Migrations are tracked and safe to re-run.
   - **Or manually:** paste `supabase/migrations/20260101000000_init_schema.sql`, then
     `20260101000100_rls_and_storage.sql`, then optionally `supabase/seed.sql` into the SQL Editor.
3. `cp .env.example .env.local` and fill it in:

   | Variable | Notes |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Project Settings → API |
   | `SUPABASE_SERVICE_ROLE_KEY` | **Server only.** Never prefix with `NEXT_PUBLIC_` |
   | `NEXT_PUBLIC_WHATSAPP_NUMBER` | Your number with country code, digits only, e.g. `919876543210`. All renter requests go here |
   | `DEFAULT_MARGIN_PERCENT` | Margin added to owner prices (default 25). Adjustable per listing when approving |
   | `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET` | Admin login. Secret must be 16+ random chars |
   | `NEXT_PUBLIC_SITE_URL` | Used for sitemap and metadata |
4. `npm run dev`. The admin panel is at `/admin`.

The site name lives in `lib/site.ts`.

## Margin pricing and request routing

- **Owners enter their own price.** The price customers see is the owner's price plus a platform margin
  (`DEFAULT_MARGIN_PERCENT`, default 25%). Owner prices are stored privately (`owner_rent_price`,
  `owner_sale_price`); the public view only exposes the customer prices (`rent_price`, `sale_price`).
- **You set the margin at approval.** Each pending listing in /admin shows what the owner asks, a margin field
  (prefilled with the default) and a live preview of the customer price, then the Approve button. The margin can
  be changed later in the listing editor. Owners who edit their price keep the listing's margin automatically.
- **Requests go to your WhatsApp** (`NEXT_PUBLIC_WHATSAPP_NUMBER`), never to the owner. The "WhatsApp" and
  "Ask to buy" buttons do the same, with the item name and a reference code in the message.
- **Admin dashboard** lists every request with the customer's contact details and the breakdown: customer pays,
  owner gets, your margin. Buttons: contact the customer, or ask the owner if the dates are free (that message
  contains no customer details).
- **Owners see request activity only** (item, dates, status). Customer names, numbers and messages are never
  shown to them, so they can't bypass the margin.

## Owner accounts, selling and sizes

- **Posting needs no account.** The form asks only for name, WhatsApp number, type, size(s), rent price,
  available dates and photos. Size is multi-select; dates are picked as a range or individual days.
- **"Also sell this"** chip: when on, a selling price is required. Listings then show "Also for sale" and an
  "Ask to buy" button (WhatsApp, via `/api/whatsapp/<id>?intent=buy`).
- **Optional accounts (email + password, Supabase Auth).** After posting, the success page invites the owner to
  create an account. Anonymous posts get a one-time claim token (stored hashed, valid 14 days) so only the poster
  can attach that listing to a new account. Signed-in owners get listings attached automatically.
- **Owner area** at `/account`: edit price, sale price, sizes, dates and description; pause/resume; mark rented;
  delete; see and answer rental requests. Every query and action is scoped to the signed-in user and
  re-checks ownership server-side. Rejected listings are re-queued for review when edited.
- Supabase Auth setting: with "Confirm email" on (the default), new owners must click the email link before
  signing in. For quick testing you can turn it off under Authentication → Providers → Email.

## How it works

- **Public reads** use the anon key. RLS only exposes `approved` listings, and the `public_listings` view
  exposes the owner's display name but never phone numbers or email.
- **All writes** (listings, images, requests, admin actions) run server-side with the service-role key
  (`lib/supabase.ts` is guarded by `server-only`).
- **Owner WhatsApp numbers** never reach page HTML. "WhatsApp Owner" goes through `/api/whatsapp/[id]`, which
  redirects to `wa.me`. After a rental request, the API returns the pre-filled `wa.me` link to the owner.
- **Listing lifecycle:** `pending → approved` (public) / `rejected` / `rented` / `inactive`. Approve in `/admin`.
- **Abuse protection:** honeypot field, per-IP in-memory limits, and database-backed limits per mobile number
  (5 requests/hour, 5 listings/day). Input is sanitized; images are type/size/magic-byte checked, and resized in
  the browser before upload.
- Owner sessions are refreshed by `middleware.ts` (only on /account, /post-your-clothes and /api/listings).
- `/clothes/<slug>` (e.g. `/clothes/choli`) lists a category; `/clothes/<uuid>` is a listing page.

## Seed data

`supabase/seed.sql` adds 17 listings with fake owner numbers and local placeholder images. Every row has
`is_seed = true`. Remove before launch:

```sql
delete from public.clothing_listings where is_seed;
delete from public.users where is_seed;
```

To test WhatsApp with seed data, change a seed owner's `whatsapp_number` to your own 10-digit number.

## Notes

- Terms and Privacy pages are template text; get them reviewed.
- Rate limiting by IP is per server instance (in-memory). The per-mobile database limits hold everywhere.
- Vercel limits request bodies to ~4.5 MB; the browser-side resize keeps 5 photos well under that.
- Each listing submission creates a new `users` row (no accounts), so one person can't redirect another owner's
  listings by reusing their number.
