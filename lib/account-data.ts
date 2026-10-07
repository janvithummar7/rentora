import "server-only";
import { getAdminClient } from "@/lib/supabase";
import type { AdminListing } from "@/lib/admin-data";

/**
 * Owner-scoped reads. These use the service-role client (RLS has no per-user policies),
 * so EVERY function here must filter by the signed-in user's id.
 */
const OWNER_COLS = "id,name,mobile,whatsapp_number,email,city,area,auth_user_id";
const LISTING_SELECT = `*, owner:users!owner_id(${OWNER_COLS}), images:clothing_images(id,image_url,is_primary)`;

export type MyListing = AdminListing & { for_sale: boolean; sale_price: number | null; paused_by_owner: boolean };

async function myOwnerIds(userId: string): Promise<string[]> {
  const { data, error } = await getAdminClient().from("users").select("id").eq("auth_user_id", userId);
  if (error) throw error;
  return (data ?? []).map((r) => r.id as string);
}

export async function getMyListings(userId: string): Promise<MyListing[]> {
  const ownerIds = await myOwnerIds(userId);
  if (ownerIds.length === 0) return [];
  const { data, error } = await getAdminClient()
    .from("clothing_listings")
    .select(LISTING_SELECT)
    .in("owner_id", ownerIds)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as MyListing[];
}

export async function getMyListing(userId: string, id: string): Promise<MyListing | null> {
  const { data, error } = await getAdminClient().from("clothing_listings").select(LISTING_SELECT).eq("id", id).maybeSingle();
  if (error) throw error;
  const listing = data as unknown as (MyListing & { owner: { auth_user_id: string | null } }) | null;
  return listing && listing.owner?.auth_user_id === userId ? listing : null;
}

/** What an owner may see about a request: dates and status only. Customer details stay with the platform. */
export type OwnerRequestView = {
  id: string;
  listing_id: string;
  start_date: string;
  end_date: string;
  status: string;
  created_at: string;
  listing: { id: string; name: string } | null;
};

export async function getMyRequests(userId: string): Promise<OwnerRequestView[]> {
  const ownerIds = await myOwnerIds(userId);
  if (ownerIds.length === 0) return [];
  const db = getAdminClient();
  const { data: mine, error: e1 } = await db.from("clothing_listings").select("id").in("owner_id", ownerIds);
  if (e1) throw e1;
  const ids = (mine ?? []).map((l) => l.id as string);
  if (ids.length === 0) return [];
  const { data, error } = await db
    .from("rental_requests")
    .select("id,listing_id,start_date,end_date,status,created_at,listing:clothing_listings(id,name)")
    .in("listing_id", ids)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as OwnerRequestView[];
}

/** Verifies the listing belongs to the user. Returns its current state, or null. */
export async function ownedListingState(userId: string, id: string) {
  const { data } = await getAdminClient()
    .from("clothing_listings")
    .select("id,status,paused_by_owner,margin_percent,owner_id,owner:users!owner_id(auth_user_id)")
    .eq("id", id)
    .maybeSingle();
  const row = data as unknown as {
    id: string;
    status: string;
    paused_by_owner: boolean;
    margin_percent: number;
    owner_id: string;
    owner: { auth_user_id: string | null } | null;
  } | null;
  return row && row.owner?.auth_user_id === userId ? row : null;
}
