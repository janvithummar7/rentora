import "server-only";
import { getPublicClient } from "@/lib/supabase";
import { parseRange, todayISO } from "@/lib/utils";

import type { ListingImage, PublicListing } from "@/lib/listing-types";
export type { ListingImage, PublicListing };
export { primaryImage } from "@/lib/listing-types";

export type ListingFilters = {
  category?: string;
  q?: string;
  city?: string;
  size?: string;
  price?: string;
  sort?: string;
  page?: number;
};

export const PAGE_SIZE = 12;

const COLUMNS =
  "id,name,category,description,size,color,brand,condition,rent_price,security_deposit,location,city,available_from,available_to,created_at,owner_name,available_dates,sizes,for_sale,sale_price";

/** Keep letters, digits, spaces and hyphens only, so user input can't alter the filter syntax. */
function safeTerm(value: string | undefined): string {
  return (value ?? "").replace(/[^\p{L}\p{N} -]/gu, " ").replace(/\s+/g, " ").trim().slice(0, 60);
}

type Raw = Omit<PublicListing, "images" | "booked_dates" | "requested_dates">;

/** Splits each listing's offered days into free days and days already booked by confirmed/completed orders. */
async function applyBookings<T extends { id: string; available_dates: string[] }>(
  rows: T[],
): Promise<(T & { booked_dates: string[]; requested_dates: string[] })[]> {
  if (rows.length === 0) return [];
  const { data, error } = await getPublicClient()
    .from("listing_booked_dates")
    .select("listing_id,booked_date")
    .in(
      "listing_id",
      rows.map((r) => r.id),
    );
  if (error) throw error;
  const booked = new Map<string, Set<string>>();
  for (const row of data ?? []) {
    const set = booked.get(row.listing_id as string) ?? new Set<string>();
    set.add(String(row.booked_date).slice(0, 10));
    booked.set(row.listing_id as string, set);
  }
  // Requested-but-unconfirmed days. Non-fatal: the site keeps working if this view is not migrated yet.
  const requested = new Map<string, Set<string>>();
  try {
    const { data: req, error: reqError } = await getPublicClient()
      .from("listing_requested_dates")
      .select("listing_id,requested_date")
      .in(
        "listing_id",
        rows.map((r) => r.id),
      );
    if (reqError) throw reqError;
    for (const row of req ?? []) {
      const set = requested.get(row.listing_id as string) ?? new Set<string>();
      set.add(String(row.requested_date).slice(0, 10));
      requested.set(row.listing_id as string, set);
    }
  } catch (err) {
    console.warn("listing_requested_dates unavailable (run npm run db:migrate)", err);
  }

  return rows.map((r) => {
    const taken = booked.get(r.id) ?? new Set<string>();
    const asked = requested.get(r.id) ?? new Set<string>();
    const offered = r.available_dates ?? [];
    const free = offered.filter((d) => !taken.has(d));
    return {
      ...r,
      available_dates: free,
      booked_dates: offered.filter((d) => taken.has(d)),
      requested_dates: free.filter((d) => asked.has(d)),
    };
  });
}

async function attachImages(rawRows: Raw[]): Promise<PublicListing[]> {
  if (rawRows.length === 0) return [];
  const rows = await applyBookings(rawRows);
  const { data, error } = await getPublicClient()
    .from("clothing_images")
    .select("id,listing_id,image_url,is_primary")
    .in(
      "listing_id",
      rows.map((r) => r.id),
    )
    .order("is_primary", { ascending: false })
    .order("created_at", { ascending: true });
  if (error) throw error;
  const byListing = new Map<string, ListingImage[]>();
  for (const img of data ?? []) {
    const list = byListing.get(img.listing_id) ?? [];
    list.push({ id: img.id, image_url: img.image_url, is_primary: img.is_primary });
    byListing.set(img.listing_id, list);
  }
  return rows.map((r) => ({ ...r, images: byListing.get(r.id) ?? [] }));
}

export async function getListings(filters: ListingFilters = {}): Promise<{ listings: PublicListing[]; total: number }> {
  const page = Math.max(1, filters.page ?? 1);
  const from = (page - 1) * PAGE_SIZE;

  let query = getPublicClient()
    .from("public_listings")
    .select(COLUMNS, { count: "exact" })
    // hide listings whose availability window has passed
    .or(`available_to.is.null,available_to.gte.${todayISO()}`)
    .range(from, from + PAGE_SIZE - 1);

  // Cheapest first by default; ties (and the "newest" option) fall back to the most recent listing.
  const sort = filters.sort === "price_desc" || filters.sort === "newest" ? filters.sort : "price_asc";
  if (sort === "newest") query = query.order("created_at", { ascending: false });
  else query = query.order("rent_price", { ascending: sort === "price_asc" }).order("created_at", { ascending: false });

  if (filters.category && filters.category !== "all") query = query.eq("category", filters.category);
  // sizes is an array column: match listings that offer this size (among others)
  if (filters.size) query = query.contains("sizes", [filters.size]);

  const city = safeTerm(filters.city);
  if (city) query = query.or(`city.ilike.*${city}*,location.ilike.*${city}*`);

  const q = safeTerm(filters.q);
  if (q) {
    query = query.or(`name.ilike.*${q}*,description.ilike.*${q}*,brand.ilike.*${q}*,color.ilike.*${q}*`);
  }

  const { min, max } = parseRange(filters.price);
  if (min !== undefined) query = query.gte("rent_price", min);
  if (max !== undefined) query = query.lt("rent_price", max);

  const { data, error, count } = await query;
  if (error) throw error;
  return {
    listings: await attachImages((data ?? []) as unknown as Raw[]),
    total: count ?? 0,
  };
}

export async function getFeaturedListings(limit = 8): Promise<PublicListing[]> {
  const { data, error } = await getPublicClient()
    .from("public_listings")
    .select(COLUMNS)
    .or(`available_to.is.null,available_to.gte.${todayISO()}`)
    .order("rent_price", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return attachImages((data ?? []) as unknown as Raw[]);
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getListing(id: string): Promise<PublicListing | null> {
  if (!UUID.test(id)) return null;
  const { data, error } = await getPublicClient().from("public_listings").select(COLUMNS).eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const [withImages] = await attachImages([data as unknown as Raw]);
  return withImages;
}

