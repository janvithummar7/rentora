import "server-only";
import { getPublicClient } from "@/lib/supabase";
import { parseRange, todayISO } from "@/lib/utils";

export type ListingImage = { id: string; image_url: string; is_primary: boolean };

export type PublicListing = {
  id: string;
  name: string;
  category: string;
  description: string;
  size: string;
  color: string | null;
  brand: string | null;
  condition: string;
  rent_price: number;
  security_deposit: number;
  location: string;
  city: string;
  available_from: string | null;
  available_to: string | null;
  created_at: string;
  owner_name: string;
  images: ListingImage[];
};

export type ListingFilters = {
  category?: string;
  q?: string;
  city?: string;
  size?: string;
  price?: string;
  page?: number;
};

export const PAGE_SIZE = 12;

const COLUMNS =
  "id,name,category,description,size,color,brand,condition,rent_price,security_deposit,location,city,available_from,available_to,created_at,owner_name";

/** Keep letters, digits, spaces and hyphens only, so user input can't alter the filter syntax. */
function safeTerm(value: string | undefined): string {
  return (value ?? "").replace(/[^\p{L}\p{N} -]/gu, " ").replace(/\s+/g, " ").trim().slice(0, 60);
}

async function attachImages(rows: Omit<PublicListing, "images">[]): Promise<PublicListing[]> {
  if (rows.length === 0) return [];
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
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  if (filters.category && filters.category !== "all") query = query.eq("category", filters.category);
  if (filters.size) query = query.eq("size", filters.size);

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
    listings: await attachImages((data ?? []) as unknown as Omit<PublicListing, "images">[]),
    total: count ?? 0,
  };
}

export async function getFeaturedListings(limit = 8): Promise<PublicListing[]> {
  const { data, error } = await getPublicClient()
    .from("public_listings")
    .select(COLUMNS)
    .or(`available_to.is.null,available_to.gte.${todayISO()}`)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return attachImages((data ?? []) as unknown as Omit<PublicListing, "images">[]);
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getListing(id: string): Promise<PublicListing | null> {
  if (!UUID.test(id)) return null;
  const { data, error } = await getPublicClient().from("public_listings").select(COLUMNS).eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const [withImages] = await attachImages([data as unknown as Omit<PublicListing, "images">]);
  return withImages;
}

export function primaryImage(listing: Pick<PublicListing, "images">): string | null {
  return (listing.images.find((i) => i.is_primary) ?? listing.images[0])?.image_url ?? null;
}
