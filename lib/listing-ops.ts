import "server-only";
import { getAdminClient, STORAGE_BUCKET } from "@/lib/supabase";

/**
 * Deletes a listing, its uploaded photos, and the owner row if it has no other listings.
 * Callers MUST have authorised the action (admin session, or owner of the listing).
 */
export async function deleteListingAndFiles(id: string): Promise<void> {
  const db = getAdminClient();
  const { data: listing } = await db
    .from("clothing_listings")
    .select("owner_id, images:clothing_images(image_url)")
    .eq("id", id)
    .maybeSingle();
  if (!listing) return;

  // Seed placeholders are local paths and have no storage object.
  const marker = `/${STORAGE_BUCKET}/`;
  const paths = ((listing.images ?? []) as { image_url: string }[])
    .map((i) => (i.image_url.includes(marker) ? decodeURIComponent(i.image_url.split(marker)[1]) : null))
    .filter((p): p is string => Boolean(p));
  if (paths.length) await db.storage.from(STORAGE_BUCKET).remove(paths);

  const { error } = await db.from("clothing_listings").delete().eq("id", id);
  if (error) throw error;

  const { count } = await db
    .from("clothing_listings")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", listing.owner_id);
  if (!count) await db.from("users").delete().eq("id", listing.owner_id);
}
