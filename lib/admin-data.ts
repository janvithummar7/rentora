import "server-only";
import { getAdminClient } from "@/lib/supabase";
import type { ListingImage } from "@/lib/data";

export type AdminListing = {
  id: string;
  owner_id: string;
  name: string;
  category: string;
  description: string;
  size: string;
  sizes: string[];
  color: string | null;
  brand: string | null;
  condition: string | null;
  rent_price: number;
  security_deposit: number;
  location: string | null;
  city: string | null;
  available_from: string | null;
  available_to: string | null;
  available_dates: string[];
  for_sale: boolean;
  sale_price: number | null;
  owner_rent_price: number;
  owner_sale_price: number | null;
  margin_percent: number;
  status: string;
  is_seed: boolean;
  created_at: string;
  owner: {
    id: string;
    name: string;
    mobile: string;
    whatsapp_number: string;
    email: string | null;
    city: string | null;
    area: string | null;
  };
  images: ListingImage[];
};

const LISTING_SELECT =
  "*, owner:users!owner_id(id,name,mobile,whatsapp_number,email,city,area), images:clothing_images(id,image_url,is_primary)";

export async function getAdminListings(status?: string): Promise<AdminListing[]> {
  let q = getAdminClient().from("clothing_listings").select(LISTING_SELECT).order("created_at", { ascending: false });
  if (status && status !== "all") q = q.eq("status", status);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as AdminListing[];
}

export async function getAdminListing(id: string): Promise<AdminListing | null> {
  const { data, error } = await getAdminClient().from("clothing_listings").select(LISTING_SELECT).eq("id", id).maybeSingle();
  if (error) throw error;
  return (data as unknown as AdminListing) ?? null;
}

export type AdminRequest = {
  id: string;
  listing_id: string;
  customer_name: string;
  customer_mobile: string;
  customer_email: string | null;
  start_date: string;
  end_date: string;
  message: string | null;
  deposit_amount: number;
  deposit_terms_accepted: boolean;
  status: string;
  created_at: string;
  listing: {
    id: string;
    name: string;
    rent_price: number;
    owner_rent_price: number;
    margin_percent: number;
    owner: { name: string; whatsapp_number: string };
  } | null;
};

export async function getAdminRequests(status?: string): Promise<AdminRequest[]> {
  let q = getAdminClient()
    .from("rental_requests")
    .select(
      "*, listing:clothing_listings(id,name,rent_price,owner_rent_price,margin_percent,owner:users!owner_id(name,whatsapp_number))",
    )
    .order("created_at", { ascending: false });
  if (status && status !== "all") q = q.eq("status", status);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as AdminRequest[];
}

export async function getAdminCounts() {
  const db = getAdminClient();
  const count = async (table: string, col?: string, val?: string) => {
    let q = db.from(table).select("id", { count: "exact", head: true });
    if (col && val) q = q.eq(col, val);
    const { count: c, error } = await q;
    if (error) throw error;
    return c ?? 0;
  };
  const [pendingListings, totalListings, newRequests, totalRequests] = await Promise.all([
    count("clothing_listings", "status", "pending"),
    count("clothing_listings"),
    count("rental_requests", "status", "new"),
    count("rental_requests"),
  ]);
  return { pendingListings, totalListings, newRequests, totalRequests };
}

/** Confirmed / completed orders for one listing: these occupy dates on the website. */
export async function getBlockingRequests(listingId: string) {
  const { data, error } = await getAdminClient()
    .from("rental_requests")
    .select("id,customer_name,start_date,end_date,status")
    .eq("listing_id", listingId)
    .in("status", ["confirmed", "completed"])
    .order("start_date", { ascending: true });
  if (error) throw error;
  return (data ?? []) as { id: string; customer_name: string; start_date: string; end_date: string; status: string }[];
}
