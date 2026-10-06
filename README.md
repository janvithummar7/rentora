# Rentora: clothing rental marketplace

Next.js 15 (App Router) + TypeScript + Tailwind v4 + Supabase (PostgreSQL + Storage).
Flow: **list → discover → request → WhatsApp → rent**. No payments, no user accounts.

## Setup

1. `npm install`
2. Create a Supabase project. In the SQL Editor run, in order:
   - `supabase/migrations/20260101000000_init_schema.sql`
   - `supabase/migrations/20260101000100_rls_and_storage.sql` (RLS, `public_listings` view, `clothing-images` bucket)
   - `supabase/seed.sql` (optional sample data; see below)
3. `cp .env.example .env.local` and fill it in:

   | Variable | Notes |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Project Settings → API |
   | `SUPABASE_SERVICE_ROLE_KEY` | **Server only.** Never prefix with `NEXT_PUBLIC_` |
   | `NEXT_PUBLIC_WHATSAPP_NUMBER` | Platform number with country code, digits only, e.g. `919876543210` |
   | `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET` | Admin login. Secret must be 16+ random chars |
   | `NEXT_PUBLIC_SITE_URL` | Used for sitemap and metadata |
4. `npm run dev`. The admin panel is at `/admin`.

The site name lives in `lib/site.ts`.

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
