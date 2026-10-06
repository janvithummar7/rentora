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
  color: string | null;
  brand: string | null;
  condition: string;
  rent_price: number;
  security_deposit: number;
  location: string;
  city: string;
  available_from: string | null;
  available_to: string | null;
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
  status: string;
  created_at: string;
  listing: {
    id: string;
    name: string;
    owner: { name: string; whatsapp_number: string };
  } | null;
};

export async function getAdminRequests(status?: string): Promise<AdminRequest[]> {
  let q = getAdminClient()
    .from("rental_requests")
    .select("*, listing:clothing_listings(id,name,owner:users!owner_id(name,whatsapp_number))")
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
